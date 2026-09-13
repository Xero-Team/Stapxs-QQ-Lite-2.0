import { resolveAvatarUrl } from '@renderer/network/avatar'

export function avatarUrl(id: unknown, kind: 'user' | 'group' = 'user'): string {
    return resolveAvatarUrl(id, kind)
}
