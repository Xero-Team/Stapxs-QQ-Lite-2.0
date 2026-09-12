import { describe, expect, it } from 'vitest'
import { normalizeJsonPathMap } from '../src/renderer/src/protocol/json-map'

describe('JSONPath mapping boundary', () => {
    it('accepts a named mapping and preserves protocol extensions', () => {
        const input = {
            name: 'NapCat.Onebot',
            message_list: { name: 'get_group_msg_history' },
            custom: { nested: true },
        }
        expect(normalizeJsonPathMap(input)).toEqual(input)
    })

    it.each([undefined, null, [], {}, { name: '' }, { name: 42 }])(
        'rejects an unnamed or malformed mapping (%j)',
        (input) => expect(normalizeJsonPathMap(input)).toBeUndefined(),
    )
})
