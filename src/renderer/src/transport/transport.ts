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
    const timeout = options.timeoutMs === undefined ? undefined : setTimeout(() => controller.abort(), options.timeoutMs)
    if (options.signal) {
        if (options.signal.aborted) controller.abort()
        else options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    return operation(controller.signal).catch((error: unknown) => {
        if (controller.signal.aborted) throw new TransportError('Transport operation aborted or timed out', options.timeoutMs === undefined ? 'aborted' : 'timeout')
        throw error
    }).finally(() => { if (timeout) clearTimeout(timeout) })
}

export function backoffDelay(attempt: number, baseMs = 250, maxMs = 30_000): number {
    const exponential = Math.min(maxMs, baseMs * (2 ** Math.max(0, attempt)))
    return Math.floor(exponential * (0.8 + Math.random() * 0.4))
}

export interface WebSocketLike {
    binaryType: string
    readyState: number
    onopen: (() => void) | null
    onmessage: ((event: { data: unknown }) => void) | null
    onclose: (() => void) | null
    onerror: (() => void) | null
    send(data: string): void
    close(): void
}

/** Small browser WebSocket adapter used by all renderer transports. */
export class WebSocketTransport implements Transport {
    private socket: WebSocketLike | undefined
    private currentState: TransportState = 'idle'
    private readonly handlers = new Set<(payload: unknown) => void>()

    constructor(private readonly url: string, private readonly protocols?: string | string[]) {}

    get state(): TransportState { return this.currentState }

    connect(options: TransportRequest = {}): Promise<void> {
        return withTimeout((signal) => new Promise<void>((resolve, reject) => {
            this.currentState = 'connecting'
            const Socket = globalThis.WebSocket as unknown as new (url: string, protocols?: string | string[]) => WebSocketLike
            const socket = new Socket(this.url, this.protocols)
            this.socket = socket
            socket.onopen = () => { this.currentState = 'authenticated'; resolve() }
            socket.onmessage = (event) => this.handlers.forEach((handler) => handler(event.data))
            socket.onerror = () => { this.currentState = 'error'; reject(new TransportError('WebSocket connection failed', 'network')) }
            socket.onclose = () => { this.currentState = 'closed' }
            signal.addEventListener('abort', () => socket.close(), { once: true })
        }), options)
    }

    send(payload: unknown, options: TransportRequest = {}): Promise<void> {
        return withTimeout(async (signal) => {
            if (!this.socket || this.currentState !== 'authenticated') throw new TransportError('WebSocket is not connected', 'network')
            if (signal.aborted) throw new TransportError('Send aborted', 'aborted')
            this.socket.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
        }, options)
    }

    async close(): Promise<void> {
        this.socket?.close()
        this.socket = undefined
        this.currentState = 'closed'
    }

    onMessage(handler: (payload: unknown) => void): () => void {
        this.handlers.add(handler)
        return () => this.handlers.delete(handler)
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

    constructor(private readonly endpoint: string) {}
    get state(): TransportState { return this.currentState }
    connect(options: TransportRequest = {}): Promise<void> {
        return withTimeout((signal) => new Promise<void>((resolve, reject) => {
            const Source = globalThis.EventSource as unknown as new (url: string) => EventSourceLike
            this.currentState = 'connecting'
            const source = new Source(this.endpoint)
            this.source = source
            source.onopen = () => { this.currentState = 'authenticated'; resolve() }
            source.onmessage = (event) => {
                try { this.handlers.forEach((handler) => handler(JSON.parse(event.data) as unknown)) }
                catch { this.currentState = 'error' }
            }
            source.onerror = () => { this.currentState = 'error'; reject(new TransportError('SSE connection failed', 'network')) }
            signal.addEventListener('abort', () => source.close(), { once: true })
        }), options)
    }
    async send(): Promise<void> { throw new TransportError('SSE is receive-only; use HttpTransport for API calls', 'protocol') }
    async close(): Promise<void> { this.source?.close(); this.source = undefined; this.currentState = 'closed' }
    onMessage(handler: (payload: unknown) => void): () => void { this.handlers.add(handler); return () => this.handlers.delete(handler) }
}
