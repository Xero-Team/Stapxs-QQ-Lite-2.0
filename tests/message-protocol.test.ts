import { describe, expect, it } from 'vitest'
import {
    extractForwardMessages,
    parseCqText,
    resolveMediaUrl,
    serializeCqSegments,
} from '../src/renderer/src/protocol/message'

describe('pure OneBot message helpers', () => {
    it('parses CQ text and reply metadata without a DOM', () => {
        const parsed = parseCqText('hello [CQ:face,id=1] [CQ:reply,id=7,user_id=42,seq=9]world')
        expect(parsed.segments).toEqual([
            { type: 'text', data: { text: 'hello ' } },
            { type: 'face', data: { id: '1' } },
            { type: 'text', data: { text: ' ' } },
            { type: 'text', data: { text: 'world' } },
        ])
        expect(parsed.reply).toEqual({ user_id: '42', seq: '9', message: undefined })
    })

    it('serializes and escapes array segments', () => {
        expect(serializeCqSegments([
            { type: 'text', data: { text: 'a,b[c]' } },
            { type: 'image', data: { file: 'https://example.test/a' } },
        ])).toBe('a,b[c][CQ:image,file=https://example.test/a]')
        expect(serializeCqSegments([
            { type: 'image', data: { file: 'a,b[c]' } },
        ])).toBe('[CQ:image,file=a&#44;b&#91;c&#93;]')
    })

    it('resolves base64 media while preserving regular URLs', () => {
        expect(resolveMediaUrl('base64://abc')).toBe('data:image/png;base64,abc')
        expect(resolveMediaUrl('https://example.test/file')).toBe('https://example.test/file')
        expect(resolveMediaUrl(null)).toBeUndefined()
    })

    it('extracts forward message arrays from OneBot response wrappers', () => {
        const messages = [{ message_id: 1 }, { message_id: 2 }]
        expect(extractForwardMessages({ data: { messages } })).toEqual(messages)
        expect(extractForwardMessages({ data: { node: true } })).toEqual([])
    })
})
