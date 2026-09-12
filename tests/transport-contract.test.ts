import { describe, expect, it, vi } from 'vitest'
import {
    HttpTransport,
    SseTransport,
    WebSocketTransport,
} from '../src/renderer/src/transport/transport'

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
})
