import { defineStore } from 'pinia'
import { shallowReactive, ref, shallowRef } from 'vue'

export interface UserClass {
    class_id: number
    class_name: string
    sort_id?: number
    user_count?: number
}

export const useSettingsStore = defineStore('settings', () => {
    const sysConfig = shallowReactive<Record<string, any>>({})
    const darkMode = ref(false)
    const connectSsl = ref(false)
    const firstLoad = ref(false)
    const classes = shallowRef<UserClass[]>([])

    return {
        sysConfig,
        darkMode,
        connectSsl,
        firstLoad,
        classes,
    }
})
