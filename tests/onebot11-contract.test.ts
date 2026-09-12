import { describe, expect, it } from 'vitest'
import napcatEvent from '../docs/onebot11-samples/napcat-event.json'
import lagrangeResponse from '../docs/onebot11-samples/lagrange-api-response.json'
import { parseOneBotApiResponse, parseOneBotEvent } from '../src/renderer/src/protocol/onebot11'

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
})
