/** Runtime platforms supported by the renderer adapter. */
export type RuntimeType = 'electron' | 'tauri' | 'capacitor' | 'web'

export type RuntimePlatform = 'win32' | 'darwin' | 'linux' | 'android' | 'ios' | 'web'

export type PlatformListener = (...args: never[]) => unknown

/**
 * Common renderer-facing platform contract.
 *
 * Implementations may use Electron IPC, Tauri invoke/events, or Capacitor
 * plugins internally. Callers depend only on this contract and receive
 * `unknown` results until a command-specific schema validates them.
 */
export interface PlatformBackend {
    type: RuntimeType
    platform: RuntimePlatform | undefined
    release: string
    arch: string | undefined
    proxy: number | undefined

    init(): Promise<void>
    call(type: string | undefined, name: string, needBack: boolean, ...args: unknown[]): Promise<unknown> | undefined
    callSync(name: string, ...args: unknown[]): unknown
    addListener(type: string | undefined, name: string, callback: PlatformListener): void
    removeListener(type: string | undefined, name: string, callback: PlatformListener): void

    isDesktop(): boolean
    isMobile(): boolean
    isWeb(): boolean
    proxyUrl(url: string): string
    proxyImageUrl(url: string): Promise<string>
    unProxyUrl(url: string): string
}
