import { describe, expect, it, vi } from 'vitest'
import {
    HttpTransport,
    ReconnectingTransport,
    SseTransport,
    TransportError,
    WebSocketTransport,
    withTimeout,
} from '../src/renderer/src/transport/transport'
import type { Transport } from '../src/renderer/src/transport/transport'

describe('transport contracts', () => {
    it('posts JSON and dispatches the decoded HTTP response', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
        vi.stubGlobal('fetch', fetchMock)
        const transport = new HttpTransport('http://bot/api', { Authorization: 'Bearer test' })
        const received: unknown[] = []
        transport.onMessage((payload) => received.push(payload))
        await transport.send({ action: 'get_status' })
        expect(fetchMock).toHaveBeenCalledWith('http://bot/api', expect.objectContaining({ method: 'POST' }))
        expect(received).toEqual([{ ok: true }])
        expect(transport.state).toBe('authenticated')
    })

    it('supports the shared lifecycle hooks for stateless HTTP transport', async () => {
        const transport = new HttpTransport('http://bot/api')
        const closed: Array<{ code: number; reason: string }> = []
        transport.onClose((event) => closed.push(event))
        await transport.connect()
        await transport.close()
        expect(transport.state).toBe('closed')
        expect(closed).toEqual([{ code: 1000, reason: 'closed' }])
    })

    it('connects, forwards WebSocket messages, and closes', async () => {
        class FakeSocket {
            static instance: FakeSocket
            binaryType = ''
            readyState = 0
            onopen: (() => void) | null = null
            onmessage: ((event: { data: unknown }) => void) | null = null
            onclose: (() => void) | null = null
            onerror: (() => void) | null = null
            sent: string[] = []
            constructor(readonly url: string) {
                FakeSocket.instance = this
                queueMicrotask(() => { this.readyState = 1; this.onopen?.() })
            }
            send(data: string) { this.sent.push(data) }
            close() { this.readyState = 3; this.onclose?.() }
        }
        vi.stubGlobal('WebSocket', FakeSocket)
        const transport = new WebSocketTransport('ws://bot')
        const received: unknown[] = []
        transport.onMessage((payload) => received.push(payload))
        await transport.connect({ timeoutMs: 100 })
        await transport.send({ ping: 1 })
        FakeSocket.instance.onmessage?.({ data: '{"pong":1}' })
        expect(FakeSocket.instance.sent).toEqual(['{"ping":1}'])
        expect(received).toEqual(['{"pong":1}'])
        await transport.close()
        expect(transport.state).toBe('closed')
    })

    it('reports a connection timeout when a socket never opens', async () => {
        class HangingSocket {
            binaryType = ''
            readyState = 0
            onopen: (() => void) | null = null
            onmessage: ((event: { data: unknown }) => void) | null = null
            onclose: (() => void) | null = null
            onerror: (() => void) | null = null
            send() {}
            close() {}
        }
        vi.stubGlobal('WebSocket', HangingSocket)
        const transport = new WebSocketTransport('ws://hanging')
        await expect(transport.connect({ timeoutMs: 1 })).rejects.toMatchObject({ code: 'timeout' })
    })

    it('keeps request context on the shared transport error model', () => {
        const error = new TransportError('request timed out', 'timeout', { echo: 'send_42' })
        expect(error).toMatchObject({ code: 'timeout', echo: 'send_42' })
        expect(error).toBeInstanceOf(Error)
    })

    it('propagates caller cancellation through the shared timeout wrapper', async () => {
        const controller = new AbortController()
        const operation = withTimeout(async (signal) => new Promise<void>((_, reject) => {
            signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })
        }), { signal: controller.signal })
        controller.abort()
        await expect(operation).rejects.toMatchObject({ code: 'aborted' })
    })

    it('sends configured heartbeats and stops them on close', async () => {
        vi.useFakeTimers()
        class HeartbeatSocket {
            binaryType = ''
            readyState = 0
            onopen: (() => void) | null = null
            onmessage: ((event: { data: unknown }) => void) | null = null
            onclose: (() => void) | null = null
            onerror: (() => void) | null = null
            sent: string[] = []
            constructor() { queueMicrotask(() => { this.readyState = 1; this.onopen?.() }) }
            send(data: string) { this.sent.push(data) }
            close() { this.readyState = 3; this.onclose?.() }
        }
        vi.stubGlobal('WebSocket', HeartbeatSocket)
        const transport = new WebSocketTransport('ws://heartbeat', undefined, {
            heartbeatIntervalMs: 10,
            heartbeatPayload: { action: 'get_status', echo: 'test-heartbeat' },
        })
        await transport.connect({ timeoutMs: 100 })
        const socket = (transport as unknown as { socket: HeartbeatSocket }).socket
        await vi.advanceTimersByTimeAsync(25)
        expect(socket.sent).toEqual(['{"action":"get_status","echo":"test-heartbeat"}', '{"action":"get_status","echo":"test-heartbeat"}'])
        await transport.close()
        await vi.advanceTimersByTimeAsync(25)
        expect(socket.sent).toHaveLength(2)
        vi.useRealTimers()
    })

    it('enters authenticated state only after the optional handshake succeeds', async () => {
        class AuthSocket {
            binaryType = ''
            readyState = 0
            onopen: (() => void) | null = null
            onmessage: ((event: { data: unknown }) => void) | null = null
            onclose: (() => void) | null = null
            onerror: (() => void) | null = null
            send = vi.fn()
            close = vi.fn()
            constructor() { queueMicrotask(() => { this.readyState = 1; this.onopen?.() }) }
        }
        vi.stubGlobal('WebSocket', AuthSocket)
        let authenticated = false
        const transport = new WebSocketTransport('ws://auth', undefined, {
            authenticate: async (socket) => {
                socket.send('{"action":"get_login_info"}')
                await Promise.resolve()
                authenticated = true
            },
        })
        await transport.connect({ timeoutMs: 100 })
        expect(authenticated).toBe(true)
        expect(transport.state).toBe('authenticated')
        await transport.close()
    })

    it('reports authentication failures as protocol transport errors', async () => {
        class RejectingAuthSocket {
            binaryType = ''
            readyState = 0
            onopen: (() => void) | null = null
            onmessage: ((event: { data: unknown }) => void) | null = null
            onclose: (() => void) | null = null
            onerror: (() => void) | null = null
            close = vi.fn()
            send = vi.fn()
            constructor() { queueMicrotask(() => { this.readyState = 1; this.onopen?.() }) }
        }
        vi.stubGlobal('WebSocket', RejectingAuthSocket)
        const transport = new WebSocketTransport('ws://auth-rejected', undefined, {
            authenticate: async () => { throw new Error('invalid credentials') },
        })
        await expect(transport.connect({ timeoutMs: 100 })).rejects.toMatchObject({
            code: 'protocol',
            message: 'WebSocket authentication failed',
        })
        expect(transport.state).toBe('error')
    })

    it('parses SSE events and exposes receive-only semantics', async () => {
        class FakeSource {
            onopen: (() => void) | null = null
            onmessage: ((event: { data: string }) => void) | null = null
            onerror: (() => void) | null = null
            close = vi.fn()
            constructor() { queueMicrotask(() => this.onopen?.()) }
        }
        vi.stubGlobal('EventSource', FakeSource)
        const transport = new SseTransport('http://bot/events')
        const received: unknown[] = []
        transport.onMessage((payload) => received.push(payload))
        await transport.connect({ timeoutMs: 100 })
        const source = (transport as unknown as { source: FakeSource }).source
        source.onmessage?.({ data: '{"post_type":"meta_event"}' })
        expect(received).toEqual([{ post_type: 'meta_event' }])
        await expect(transport.send({ action: 'x' })).rejects.toThrow('receive-only')
        await transport.close()
    })

    it('reports malformed SSE payloads through the shared error hook', async () => {
        class FakeSource {
            onopen: (() => void) | null = null
            onmessage: ((event: { data: string }) => void) | null = null
            onerror: (() => void) | null = null
            close = vi.fn()
            constructor() { queueMicrotask(() => this.onopen?.()) }
        }
        vi.stubGlobal('EventSource', FakeSource)
        const transport = new SseTransport('http://bot/events')
        const errors = vi.fn()
        transport.onError(errors)
        await transport.connect({ timeoutMs: 100 })
        const source = (transport as unknown as { source: FakeSource }).source
        source.onmessage?.({ data: '{invalid' })
        expect(transport.state).toBe('error')
        expect(errors).toHaveBeenCalledOnce()
        await transport.close()
    })

    it('retries failed connections and reconnects after an established link closes', async () => {
        vi.useFakeTimers()
        class FlakyTransport implements Transport {
            state: 'idle' | 'connecting' | 'authenticated' | 'closed' | 'error' = 'idle'
            private readonly messageHandlers = new Set<(payload: unknown) => void>()
            private readonly closeHandlers = new Set<(event: { code: number; reason: string }) => void>()
            private readonly errorHandlers = new Set<() => void>()
            constructor(private readonly shouldFail: boolean) {}
            async connect(): Promise<void> {
                this.state = 'connecting'
                if (this.shouldFail) {
                    this.state = 'error'
                    throw new TransportError('synthetic failure', 'network')
                }
                this.state = 'authenticated'
            }
            async send(): Promise<void> {}
            async close(): Promise<void> { this.state = 'closed' }
            onMessage(handler: (payload: unknown) => void): () => void { this.messageHandlers.add(handler); return () => this.messageHandlers.delete(handler) }
            onClose(handler: (event: { code: number; reason: string }) => void): () => void { this.closeHandlers.add(handler); return () => this.closeHandlers.delete(handler) }
            onError(handler: () => void): () => void { this.errorHandlers.add(handler); return () => this.errorHandlers.delete(handler) }
            drop(): void {
                this.state = 'closed'
                this.closeHandlers.forEach((handler) => handler({ code: 1006, reason: 'dropped' }))
            }
        }

        const created: FlakyTransport[] = []
        const transport = new ReconnectingTransport(() => {
            const instance = new FlakyTransport(created.length === 0)
            created.push(instance)
            return instance
        }, { attempts: 3, baseMs: 1, maxMs: 1 })

        const connecting = transport.connect({ timeoutMs: 100 })
        await vi.advanceTimersByTimeAsync(1)
        await connecting
        expect(created).toHaveLength(2)
        expect(transport.state).toBe('authenticated')

        created[1].drop()
        await vi.advanceTimersByTimeAsync(1)
        await vi.waitFor(() => expect(created).toHaveLength(3))
        expect(transport.state).toBe('authenticated')
        await transport.close()
        vi.useRealTimers()
    })
})
