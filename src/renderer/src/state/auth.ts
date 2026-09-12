import { defineStore } from 'pinia'
import { shallowReactive, ref } from 'vue'

export interface ConnectionHistoryItem {
    address: string
    token?: string
}

export interface QuickLoginItem {
    address: string
    port: number
}

export interface LoginProfile {
    lnick?: string
    [key: string]: unknown
}

export interface WebApiCache {
    cookie?: Record<string, string>
    bkn?: string
    [key: string]: unknown
}

export interface LoginInfo extends Record<string, unknown> {
    address: string
    bkn: string
    connectionHistory: ConnectionHistoryItem[]
    creating: boolean
    info: LoginProfile
    nickname: string
    quickLogin: QuickLoginItem[] | null
    status: boolean
    token: string
    uin: string
    webapi: Record<string, WebApiCache>
}

export interface BotInfo extends Record<string, unknown> {
    app_name?: string
    app_version?: string
    version?: string
}

export function createLoginInfo(): LoginInfo {
    return {
        address: '',
        bkn: '',
        connectionHistory: [],
        creating: false,
        info: {},
        nickname: '',
        quickLogin: null,
        status: false,
        token: '',
        uin: '',
        webapi: {},
    }
}

export const useAuthStore = defineStore('auth', () => {
    const loginInfo = shallowReactive<LoginInfo>(createLoginInfo())
    const botInfo = shallowReactive<BotInfo>({})
    const jsonMap = ref<any>(undefined)

    return {
        loginInfo,
        botInfo,
        jsonMap,
    }
})
