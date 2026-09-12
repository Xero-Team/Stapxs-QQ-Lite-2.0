import { describe, expect, it } from 'vitest'
import { resolveAvatarUrl } from '../src/renderer/src/network/avatar'

describe('avatar request privacy', () => {
    it.each([false, undefined, null, 'true', 1])('requires explicit opt-in (%j)', (enabled) => {
        for (const kind of ['user', 'group'] as const) {
            const result = resolveAvatarUrl(10001, kind, enabled)
            expect(result).toMatch(/^data:image\/svg\+xml,/)
            expect(result).not.toContain('10001')
        }
    })

    it.each([10001, '10001'])('supports OneBot identifiers after opt-in (%j)', (id) => {
        expect(resolveAvatarUrl(id, 'user', true)).toBe('https://q1.qlogo.cn/g?b=qq&s=0&nk=10001')
        expect(resolveAvatarUrl(id, 'group', true)).toBe('https://p.qlogo.cn/gh/10001/10001/0')
    })

    it.each([undefined, null, {}, '', '../10001', '10001&redirect=example', -1, 1.5])(
        'rejects invalid IDs even after opt-in (%j)', (id) => {
            expect(resolveAvatarUrl(id, 'user', true)).toMatch(/^data:image\/svg\+xml,/)
        },
    )
})
