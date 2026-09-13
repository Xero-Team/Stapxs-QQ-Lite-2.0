/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly VITE_STORAGE_BUILD_ID: string
}

declare module 'vue3-danmaku'

// Border Card UI currently ships an in-repository Vue SFC that is not strict-mode safe.
// Keep its public component boundary typed while the upstream package is migrated.
declare module 'vue3-bcui/packages/bc-tab' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent
    export default component
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent
    export default component
}

declare interface Window {
    moYu: () => string
    _AMapSecurityConfig: string | undefined
    pinyin?: {
        pinyin: (
            value: string,
            options: {
                heteronym: boolean
                compact: boolean
                style: string
            }
        ) => string[][]
    }
    createMap: (key: string | undefined, msgId: string, point: {
        lat: number,
        lng: number
    }) => void
    __TAURI_INTERNALS__: Record<string, unknown>
}

// po 文件，按字符串处理
declare module '*.po' {
    const value: string
    export default value
}

declare module '*.yaml' {
    const content: Record<string, unknown>
    export default content
}

declare module '*.yml' {
    const content: Record<string, unknown>
    export default content
}

declare module '@renderer/assets/img/qq-face/public/assets/qq_emoji/_index.json' {
    const content: {
        emojiId: string,
        describe: '' | `/${string}`,
        assets: {
            type: number,
            path: string,
            name: string,
        }[]
    }[]
    export default content
}[]
