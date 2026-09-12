import { describe, expect, it } from 'vitest'
import { parseExternalUrl } from '../src/electron/function/urlPolicy'

describe('electron external URL policy', () => {
    it('accepts bounded HTTP(S) targets', () => {
        expect(parseExternalUrl('https://example.test/path')?.origin).toBe('https://example.test')
        expect(parseExternalUrl('http://example.test')).toBeInstanceOf(URL)
    })

    it('rejects non-network, malformed, and oversized targets', () => {
        expect(parseExternalUrl('javascript:alert(1)')).toBeNull()
        expect(parseExternalUrl('file:///etc/passwd')).toBeNull()
        expect(parseExternalUrl('x'.repeat(2001))).toBeNull()
        expect(parseExternalUrl(null)).toBeNull()
    })
})
