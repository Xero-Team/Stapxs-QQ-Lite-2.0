export type TransportState = 'idle' | 'connecting' | 'authenticated' | 'closed' | 'error'

export interface TransportRequest {
    signal?: AbortSignal
    timeoutMs?: number
}

export interface Transport {
    readonly state: TransportState
    connect(options?: TransportRequest): Promise<void>
    send(payload: unknown, options?: TransportRequest): Promise<void>
    close(): Promise<void>
    onMessage(handler: (payload: unknown) => void): () => void
}

export class TransportError extends Error {
    constructor(message: string, readonly code: 'timeout' | 'aborted' | 'network' | 'protocol') {
        super(message)
        this.name = 'TransportError'
    }
}

export function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, options: TransportRequest = {}): Promise<T> {
    const controller = new AbortController()
    let timedOut = false
    const timeout = options.timeoutMs === undefined ? undefined : setTimeout(() => { timedOut = true; controller.abort() }, options.timeoutMs)
    if (options.signal) {
        if (options.signal.aborted) controller.abort()
        else options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    return operation(controller.signal).catch((error: unknown) => {
        if (controller.signal.aborted) throw new TransportError('Transport operation aborted or timed out', timedOut ? 'timeout' : 'aborted')
        throw error
    }).finally(() => { if (timeout) clearTimeout(timeout) })
}

export function backoffDelay(attempt: number, baseMs = 250, maxMs = 30_000): number {
    const exponential = Math.min(maxMs, baseMs * (2 ** Math.max(0, attempt)))
    return Math.floor(exponential * (0.8 + Math.random() * 0.4))
}

export async function retryWithBackoff<T>(
    operation: (attempt: number) => Promise<T>,
    options: { attempts?: number; baseMs?: number; maxMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
    const attempts = options.attempts ?? 5
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt++) {
        if (options.signal?.aborted) throw new TransportError('Retry aborted', 'aborted')
        try { return await operation(attempt) }
        catch (error: unknown) {
            lastError = error
            if (attempt + 1 >= attempts) break
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, backoffDelay(attempt, options.baseMs, options.maxMs))
                options.signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new TransportError('Retry aborted', 'aborted')) }, { once: true })
            })
        }
    }
    throw lastError
}

export interface WebSocketLike {
    binaryType: string
    readyState: number
    onopen: (() => void) | null
    onmessage: ((event: { data: unknown }) => void) | null
    onclose: ((event?: { code?: number; reason?: string }) => void) | null
    onerror: (() => void) | null
    send(data: string): void
    close(code?: number, reason?: string): void
}

export interface WebSocketTransportOptions {
    /** Send a protocol-specific heartbeat while the socket is authenticated. */
    heartbeatIntervalMs?: number
    heartbeatPayload?: unknown | (() => unknown)
    /** Optional handshake invoked after the socket opens and before it is usable. */
    authenticate?: (socket: WebSocketLike, signal: AbortSignal) => Promise<void>
}

/** Small browser WebSocket adapter used by all renderer transports. */
export class WebSocketTransport implements Transport {
    private socket: WebSocketLike | undefined
    private heartbeatTimer: ReturnType<typeof setInterval> | undefined
    private currentState: TransportState = 'idle'
    private readonly handlers = new Set<(payload: unknown) => void>()
    private readonly closeHandlers = new Set<(event: { code: number; reason: string }) => void>()
    private readonly errorHandlers = new Set<() => void>()

    constructor(
        private readonly url: string,
        private readonly protocols?: string | string[],
        private readonly options: WebSocketTransportOptions = {},
    ) {}

    get state(): TransportState { return this.currentState }

    connect(options: TransportRequest = {}): Promise<void> {
        return withTimeout((signal) => new Promise<void>((resolve, reject) => {
            if (this.currentState === 'authenticated') { resolve(); return }
            this.currentState = 'connecting'
            let settled = false
            const Socket = globalThis.WebSocket as unknown as new (url: string, protocols?: string | string[]) => WebSocketLike
            const socket = new Socket(this.url, this.protocols)
            this.socket = socket
            socket.onopen = () => {
                void (async () => {
                    try {
                        if (this.options.authenticate) await this.options.authenticate(socket, signal)
                        if (signal.aborted) return
                        settled = true
                        this.currentState = 'authenticated'
                        this.startHeartbeat()
                        resolve()
                    } catch (error: unknown) {
                        this.currentState = 'error'
                        socket.close()
                        if (!settled) {
                            settled = true
                            reject(error instanceof TransportError
                                ? error
                                : new TransportError('WebSocket authentication failed', 'protocol'))
                        }
                    }
                })()
            }
            socket.onmessage = (event) => this.handlers.forEach((handler) => handler(event.data))
            socket.onerror = () => {
                this.currentState = 'error'
                this.errorHandlers.forEach((handler) => handler())
                if (!settled) { settled = true; reject(new TransportError('WebSocket connection failed', 'network')) }
            }
            socket.onclose = (event) => {
                this.currentState = 'closed'
                this.closeHandlers.forEach((handler) => handler({ code: event?.code ?? 1006, reason: event?.reason ?? '' }))
            }
            signal.addEventListener('abort', () => socket.close(), { once: true })
            signal.addEventListener('abort', () => {
                if (!settled) { settled = true; reject(new TransportError('WebSocket connection aborted', 'aborted')) }
            }, { once: true })
        }), options)
    }

    send(payload: unknown, options: TransportRequest = {}): Promise<void> {
        return withTimeout(async (signal) => {
            if (!this.socket || this.currentState !== 'authenticated') throw new TransportError('WebSocket is not connected', 'network')
            if (signal.aborted) throw new TransportError('Send aborted', 'aborted')
            this.socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
        }, options)
    }

    async close(code?: number, reason?: string): Promise<void> {
        this.stopHeartbeat()
        this.socket?.close(code, reason)
        this.socket = undefined
        this.currentState = 'closed'
    }

    private startHeartbeat(): void {
        this.stopHeartbeat()
        const interval = this.options.heartbeatIntervalMs
        if (interval === undefined || interval <= 0) return
        this.heartbeatTimer = setInterval(() => {
            if (!this.socket || this.currentState !== 'authenticated') return
            try {
                const payload = typeof this.options.heartbeatPayload === 'function'
                    ? this.options.heartbeatPayload()
                    : this.options.heartbeatPayload ?? { action: 'get_status', params: {}, echo: 'xero-heartbeat' }
                this.socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
            } catch {
                this.currentState = 'error'
                this.errorHandlers.forEach((handler) => handler())
            }
        }, interval)
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer !== undefined) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = undefined
        }
    }

    onMessage(handler: (payload: unknown) => void): () => void {
        this.handlers.add(handler)
        return () => this.handlers.delete(handler)
    }

    onClose(handler: (event: { code: number; reason: string }) => void): () => void {
        this.closeHandlers.add(handler)
        return () => this.closeHandlers.delete(handler)
    }

    onError(handler: () => void): () => void {
        this.errorHandlers.add(handler)
        return () => this.errorHandlers.delete(handler)
    }
}

export class HttpTransport implements Transport {
    private currentState: TransportState = 'idle'
    private readonly handlers = new Set<(payload: unknown) => void>()

    constructor(private readonly endpoint: string, private readonly headers: Record<string, string> = {}) {}
    get state(): TransportState { return this.currentState }

    async connect(): Promise<void> { this.currentState = 'authenticated' }

    async send(payload: unknown, options: TransportRequest = {}): Promise<void> {
        this.currentState = 'connecting'
        await withTimeout(async (signal) => {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'content-type': 'application/json', ...this.headers },
                body: JSON.stringify(payload),
                signal,
            })
            if (!response.ok) throw new TransportError(`HTTP transport failed (${response.status})`, 'network')
            const data: unknown = await response.json()
            this.handlers.forEach((handler) => handler(data))
            this.currentState = 'authenticated'
        }, options).catch((error: unknown) => {
            this.currentState = 'error'
            throw error
        })
    }

    async close(): Promise<void> { this.currentState = 'closed' }
    onMessage(handler: (payload: unknown) => void): () => void { this.handlers.add(handler); return () => this.handlers.delete(handler) }
}

export interface EventSourceLike {
    onopen: (() => void) | null
    onmessage: ((event: { data: string }) => void) | null
    onerror: (() => void) | null
    close(): void
}

export class SseTransport implements Transport {
    private source: EventSourceLike | undefined
    private currentState: TransportState = 'idle'
    private readonly handlers = new Set<(payload: unknown) => void>()
    private readonly errorHandlers = new Set<() => void>()

    constructor(private readonly endpoint: string) {}
    get state(): TransportState { return this.currentState }
    connect(options: TransportRequest = {}): Promise<void> {
        return withTimeout((signal) => new Promise<void>((resolve, reject) => {
            const Source = globalThis.EventSource as unknown as new (url: string) => EventSourceLike
            this.currentState = 'connecting'
            let settled = false
            const source = new Source(this.endpoint)
            this.source = source
            source.onopen = () => { settled = true; this.currentState = 'authenticated'; resolve() }
            source.onmessage = (event) => {
                try { this.handlers.forEach((handler) => handler(JSON.parse(event.data) as unknown)) }
                catch { this.currentState = 'error' }
            }
            source.onerror = () => {
                this.currentState = 'error'
                this.errorHandlers.forEach((handler) => handler())
                if (!settled) { settled = true; reject(new TransportError('SSE connection failed', 'network')) }
            }
            signal.addEventListener('abort', () => source.close(), { once: true })
            signal.addEventListener('abort', () => {
                if (!settled) { settled = true; reject(new TransportError('SSE connection aborted', 'aborted')) }
            }, { once: true })
        }), options)
    }
    async send(): Promise<void> { throw new TransportError('SSE is receive-only; use HttpTransport for API calls', 'protocol') }
    async close(): Promise<void> { this.source?.close(); this.source = undefined; this.currentState = 'closed' }
    onMessage(handler: (payload: unknown) => void): () => void { this.handlers.add(handler); return () => this.handlers.delete(handler) }
    onError(handler: () => void): () => void { this.errorHandlers.add(handler); return () => this.errorHandlers.delete(handler) }
}
