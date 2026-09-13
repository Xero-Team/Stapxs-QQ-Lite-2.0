/**
 * Shared native OneBot command contract.
 *
 * Electron is the primary desktop runtime. Tauri and Capacitor keep compatible
 * command names so the renderer can stay on `PlatformBackend` without importing
 * native implementations.
 */
export const ONEBOT_NATIVE_COMMANDS = {
    connect: 'onebot:connect',
    send: 'onebot:send',
    close: 'onebot:close',
    onOpen: 'onebot:onopen',
    onMessage: 'onebot:onmessage',
    onClose: 'onebot:onclose',
    capacitorEvent: 'onebot:event',
} as const

export type OneBotNativeCommand = typeof ONEBOT_NATIVE_COMMANDS[keyof typeof ONEBOT_NATIVE_COMMANDS]

export interface OneBotConnectArgs {
    address: string
    token?: string
}

export interface OneBotCloseInfo {
    code: number | string
    message?: string
    address?: string
}
