import { BotMsgType } from '@renderer/function/elements/information'
import { getInch } from '@renderer/function/utils/systemUtil'
import { defineStore } from 'pinia'
import { ref, markRaw, defineAsyncComponent } from 'vue'

export const useUIStore = defineStore('ui', () => {
    const openSideBar = ref(true)
    const nowGetHistory = ref(false)
    const canLoadHistory = ref(true)
    const loadHistoryFail = ref(false)
    const historyBeforeTime = ref<number | undefined>(undefined)
    const msgType = ref(BotMsgType.Array)

    const popBoxList = ref<{
        svg?: string
        title?: string
        html?: string
        template?: unknown
        templateValue?: Record<string, unknown>
        data?: unknown
        full?: boolean
        onClose?: () => void
        button?: {
            master?: boolean
            fun?: (value: unknown) => void
            text: string
        }[]
        allowQuickClose?: boolean
        allowClose?: boolean
    }[]>([])

    const pageView = {
        chatView: markRaw(
            defineAsyncComponent(() => import('@renderer/pages/Chat.vue')),
        ),
        msgView: markRaw(
            defineAsyncComponent(
                () => import('@renderer/components/MsgBody.vue'),
            ),
        ),
    }

    const inch = getInch()

    return {
        openSideBar,
        nowGetHistory,
        canLoadHistory,
        loadHistoryFail,
        historyBeforeTime,
        msgType,
        popBoxList,
        pageView,
        inch,
    }
})
