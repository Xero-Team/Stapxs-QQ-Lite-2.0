import { describe, expect, it } from 'vitest'
import {
    auditExternalRequest,
    clearNetworkAudit,
    isExternalRequestAllowed,
    isSafeExternalUrl,
    readNetworkAudit,
} from '../src/renderer/src/network/policy'

describe('network policy', () => {
    it('requires explicit opt-in and accepts only HTTP(S)', () => {
        expect(isExternalRequestAllowed('https://example.test/path', false)).toBe(false)
        expect(isExternalRequestAllowed('ws://example.test', true)).toBe(false)
        expect(isExternalRequestAllowed('https://example.test/path', true)).toBe(true)
    })

    it('rejects unsafe navigation schemes', () => {
        expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
        expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false)
        expect(isSafeExternalUrl('https://user:password@example.test/path')).toBe(false)
        expect(isSafeExternalUrl('https://example.test/path')).toBe(true)
        expect(isSafeExternalUrl('http://example.test/path')).toBe(true)
    })

    it('stores only bounded origin audit entries locally', () => {
        clearNetworkAudit()
        auditExternalRequest('https://example.test/path?token=secret', 'test')
        const audit = readNetworkAudit()
        expect(audit).toEqual([{ at: expect.any(Number), purpose: 'test', origin: 'https://example.test' }])
        expect(JSON.stringify(audit)).not.toContain('secret')
        clearNetworkAudit()
        expect(readNetworkAudit()).toEqual([])
    })
})
