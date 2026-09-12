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
