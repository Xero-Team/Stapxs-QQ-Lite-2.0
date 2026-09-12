import { describe, expect, it, vi } from 'vitest'
import {
    auditExternalRequest,
    clearNetworkAudit,
    isExternalRequestAllowed,
    readNetworkAudit,
} from '../src/renderer/src/network/policy'

describe('network policy', () => {
    it('requires explicit opt-in and accepts only HTTP(S)', () => {
        expect(isExternalRequestAllowed('https://example.test/path', false)).toBe(false)
        expect(isExternalRequestAllowed('ws://example.test', true)).toBe(false)
        expect(isExternalRequestAllowed('https://example.test/path', true)).toBe(true)
    })

    it('stores only bounded origin audit entries locally', () => {
        const values = new Map<string, string>()
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
        })
        clearNetworkAudit()
        auditExternalRequest('https://example.test/path?token=secret', 'test')
        expect(readNetworkAudit()).toEqual([{ at: expect.any(Number), purpose: 'test', origin: 'https://example.test' }])
        expect(values.get('xero-qq-lite:network-audit')).not.toContain('secret')
        clearNetworkAudit()
        expect(readNetworkAudit()).toEqual([])
    })
})
