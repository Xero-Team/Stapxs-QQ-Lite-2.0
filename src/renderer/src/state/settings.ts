import { defineStore } from 'pinia'
import { shallowReactive, ref, shallowRef } from 'vue'

export interface UserClass {
    class_id: number
    class_name: string
    sort_id?: number
    user_count?: number
}

export interface SystemConfig extends Record<string, unknown> {
    address: string
    top_info: Record<string, unknown>
    save_password: string | boolean
    notice_group: Record<string, unknown>
    auto_connect: boolean
    local_emoji_folder: string | null
    connection_history: unknown[]
    language: string
    opt_dark: boolean
    opt_auto_dark: boolean
    theme_color: number
    opt_auto_win_color: boolean
    chat_background: string
    chat_background_blur: number
    chat_background_align: string
    chat_background_fit: string
    chatview_name: string
    opt_fast_animation: boolean
    chat_more_blur: boolean
    glass_effect: boolean
    initial_scale: number
    fs_adaptation: number
    opt_always_top: boolean
    opt_revolve: boolean
    use_favicon_notice: boolean
    use_super_face: boolean
    opt_ind_message: boolean
    opt_no_auto_load_image: boolean
    close_notice: boolean
    bubble_sort_user: boolean
    session_display_mode: 'recent' | 'all'
    close_respond: boolean
    msg_taill: string
    quick_send: string
    group_notice_type: string
    send_face: boolean
    use_breakline: boolean
    send_key: string
    close_ga: boolean
    open_ga_bot: boolean
    enable_external_services: boolean
    record_recent_emoji: 'none' | 'order' | '100times' | '500times'
    enable_local_history: boolean
    mixed_load_messages: boolean
    disable_local_history_image_cache: boolean
    msg_type: number
    log_level: string
    debug_msg: boolean
    custom_css: string
    openai_api: string
    openai_token: string
    openai_model: string
    glagame_max_tokens: number
    glagame_favorability: boolean
    glagame_prompt: string
}

export const useSettingsStore = defineStore('settings', () => {
    const sysConfig = shallowReactive<SystemConfig>({} as SystemConfig)
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
