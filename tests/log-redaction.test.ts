import { describe, expect, it } from 'vitest'
import { redactLogValue } from '../src/renderer/src/function/logging'

describe('log redaction', () => {
    it('removes account, message, and network identifiers recursively', () => {
        expect(redactLogValue({
            group_id: 123,
            self_id: 456,
            message_id: 'm-1',
            message: [{ type: 'text', data: { text: 'private' } }],
            endpoint: 'https://example.test?token=secret',
            action: 'get_status',
        })).toEqual({
            group_id: '[redacted]',
            self_id: '[redacted]',
            message_id: '[redacted]',
            message: '[redacted]',
            endpoint: '[redacted]',
            action: 'get_status',
        })
    })
})
