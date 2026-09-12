import { z } from 'zod'

const AvatarIdSchema = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
const localAvatar = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e5e7eb"/><circle cx="32" cy="23" r="12" fill="#9ca3af"/><path d="M10 60a22 22 0 0 1 44 0" fill="#9ca3af"/></svg>',
)

/** Account identifiers never reach the avatar provider without explicit opt-in. */
export function resolveAvatarUrl(id: unknown, kind: 'user' | 'group', enabled: unknown): string {
    if (enabled !== true) return localAvatar
    const parsed = AvatarIdSchema.safeParse(id)
    if (!parsed.success) return localAvatar
    return kind === 'group'
        ? `https://p.qlogo.cn/gh/${parsed.data}/${parsed.data}/0`
        : `https://q1.qlogo.cn/g?b=qq&s=0&nk=${parsed.data}`
}
