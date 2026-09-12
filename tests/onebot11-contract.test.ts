import { describe, expect, it } from 'vitest'
import napcatEvent from '../docs/onebot11-samples/napcat-event.json'
import lagrangeResponse from '../docs/onebot11-samples/lagrange-api-response.json'
import { parseOneBotApiResponse, parseOneBotEvent } from '../src/renderer/src/protocol/onebot11'
import { retryWithBackoff } from '../src/renderer/src/transport/transport'

describe('OneBot 11 compatibility samples', () => {
    it('accepts a NapCat message event', () => {
        expect(parseOneBotEvent(napcatEvent).post_type).toBe('message')
    })

    it('accepts a Lagrange API response', () => {
        expect(parseOneBotApiResponse(lagrangeResponse).status).toBe('ok')
    })

    it('rejects malformed payloads', () => {
        expect(() => parseOneBotEvent({ post_type: 'message' })).toThrow()
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
