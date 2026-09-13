import { BaseChatInfoElem, ChatInfoElem, JinMessageElem, MergeStackData, MsgItemElem } from '@renderer/function/elements/information'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export function createEmptyChatInfo(show: BaseChatInfoElem = { type: '', id: 0, name: '', avatar: '' }): ChatInfoElem {
    return {
        show,
        info: {
            group_info: {},
            user_info: {},
            me_info: {},
            group_members: [],
            group_files: [],
            group_sub_files: {},
            jin_info: {
                list: [] as JinMessageElem[],
                pages: 0,
            },
        },
    }
}

export const useChatStore = defineStore('chat', () => {
    const chatInfo = ref<ChatInfoElem>(createEmptyChatInfo())

    const messageList = ref<MsgItemElem[]>([])
    const mergeMsgStack = ref<MergeStackData[]>([])
    const mergeMessageList = ref<MsgItemElem[] | undefined>(undefined)
    const mergeMessageImgList = ref<Array<{ img_url: string }> | undefined>(undefined)

    function reset(show?: BaseChatInfoElem): void {
        chatInfo.value = createEmptyChatInfo(show)
        messageList.value = []
        mergeMsgStack.value = []
        mergeMessageList.value = undefined
        mergeMessageImgList.value = undefined
    }

    return {
        chatInfo,
        messageList,
        mergeMsgStack,
        mergeMessageList,
        mergeMessageImgList,
        reset,
    }
})
