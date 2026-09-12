import { describe, expect, it } from 'vitest'
import { normalizeLoginInfo, normalizeVersionInfo } from '../src/renderer/src/protocol/login'

describe('mapped login response compatibility', () => {
    it.each([10001, '10001'])('accepts numeric and string OneBot IDs (%s)', (uin) => {
        expect(normalizeLoginInfo({ uin, nickname: 'Mock Login', bkn: 42 })).toEqual({
            uin: '10001', nickname: 'Mock Login', bkn: 42,
        })
    })

    it('preserves large string IDs and empty nicknames without coercing other fields', () => {
        expect(normalizeLoginInfo({ uin: '9007199254740993', nickname: '' })).toEqual({
            uin: '9007199254740993', nickname: '',
        })
    })

    it.each([undefined, null, [], {}, 'invalid', { uin: 10001 }])(
        'rejects missing or malformed login records (%j)', (input) => {
            expect(normalizeLoginInfo(input)).toBeUndefined()
        },
    )

    it.each([null, undefined, false, {}, [], -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '', 'account']) (
        'does not coerce invalid account IDs (%j)', (uin) => {
            expect(normalizeLoginInfo({ uin, nickname: 'Mock Login' })).toBeUndefined()
        },
    )

    it('rejects non-string display names', () => {
        expect(normalizeLoginInfo({ uin: 10001, nickname: { html: '<script>' } })).toBeUndefined()
    })
})

describe('mapped version response compatibility', () => {
    it('retains backend extension fields', () => {
        const input = { app_name: 'NapCat.Onebot', app_version: '1.0.0', protocol_version: 'v11' }
        expect(normalizeVersionInfo(input)).toEqual(input)
    })

    it('allows missing optional version fields', () => {
        expect(normalizeVersionInfo({ protocol_version: 'v11' })).toEqual({ protocol_version: 'v11' })
    })

    it.each([undefined, null, [], { app_name: 1 }, { app_version: {} }])(
        'rejects malformed version fields (%j)', (input) => {
            expect(normalizeVersionInfo(input)).toBeUndefined()
        },
    )
})
