import { resolveAvatarUrl } from '@renderer/network/avatar'
import { useSettingsStore } from '@renderer/state/settings'

/** Read reactive settings at render time so disabling external services takes effect. */
export function avatarUrl(id: unknown, kind: 'user' | 'group' = 'user'): string {
    return resolveAvatarUrl(id, kind, useSettingsStore().sysConfig.enable_external_services)
}
