import { describe, expect, it } from 'vitest'
import { resolveAvatarUrl } from '../src/renderer/src/network/avatar'

describe('avatar request privacy', () => {
    it.each([10001, '10001'])('uses the QQ avatar CDN for valid identifiers (%j)', (id) => {
        expect(resolveAvatarUrl(id, 'user')).toBe('https://q1.qlogo.cn/g?b=qq&s=0&nk=10001')
        expect(resolveAvatarUrl(id, 'group')).toBe('https://p.qlogo.cn/gh/10001/10001/0')
    })

    it.each([undefined, null, {}, '', '../10001', '10001&redirect=example', -1, 1.5])(
        'rejects invalid IDs (%j)', (id) => {
            expect(resolveAvatarUrl(id, 'user')).toMatch(/^data:image\/svg\+xml,/)
        },
    )
})
