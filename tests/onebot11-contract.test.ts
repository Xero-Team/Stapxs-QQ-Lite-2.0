import { describe, expect, it } from 'vitest'
import napcatEvent from '../docs/onebot11-samples/napcat-event.json'
import lagrangeResponse from '../docs/onebot11-samples/lagrange-api-response.json'
import { classifyOneBotPayload, inspectOneBotPayload, parseOneBotApiResponse, parseOneBotEvent } from '../src/renderer/src/protocol/onebot11'
import { isIncomingMessage } from '../src/renderer/src/function/elements/information'
import { retryWithBackoff } from '../src/renderer/src/transport/transport'

describe('OneBot 11 compatibility samples', () => {
    it('accepts a NapCat message event', () => {
        expect(parseOneBotEvent(napcatEvent).post_type).toBe('message')
    })

    it('accepts a Lagrange API response', () => {
        expect(parseOneBotApiResponse(lagrangeResponse).status).toBe('ok')
    })

    it('rejects malformed payloads', () => {
        expect(() => parseOneBotEvent({ post_type: '' })).toThrow()
        expect(() => parseOneBotEvent(null)).toThrow()
    })

    it('treats NapCat heartbeats as events even when status is an object', () => {
        const heartbeat = {
            time: 1710000000.5,
            self_id: 123456,
            post_type: 'meta_event',
            meta_event_type: 'heartbeat',
            status: { online: true, good: true },
            interval: 5000,
        }
        expect(classifyOneBotPayload(heartbeat)).toBe('event')
        expect(inspectOneBotPayload(heartbeat)).toEqual({ kind: 'event', ok: true })
        expect(parseOneBotEvent(heartbeat).post_type).toBe('meta_event')
    })

    it('accepts string retcodes on API responses', () => {
        expect(parseOneBotApiResponse({ status: 'ok', retcode: '0', data: {} }).retcode).toBe(0)
        expect(classifyOneBotPayload({ status: 'ok', retcode: '0', echo: 'getLoginInfo' })).toBe('api')
    })

    it('narrows message events before the renderer pipeline consumes them', () => {
        const event = {
            post_type: 'message',
            message: [{ type: 'text', data: { text: 'hello' } }],
            sender: { user_id: 10001, nickname: 'Alice' },
        }
        expect(isIncomingMessage(event)).toBe(true)
        expect(isIncomingMessage({ ...event, message: ['invalid'] })).toBe(false)
    })

    it('retries transient transport failures with bounded attempts', async () => {
        let calls = 0
        await expect(retryWithBackoff(async () => {
            calls += 1
            if (calls < 3) throw new Error('temporary')
            return 'ok'
        }, { attempts: 4, baseMs: 1, maxMs: 2 })).resolves.toBe('ok')
        expect(calls).toBe(3)
    })
})
