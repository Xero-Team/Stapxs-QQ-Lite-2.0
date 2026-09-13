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

    function clearMessages(): void {
        messageList.value.splice(0, messageList.value.length)
    }

    function setMessages(messages: MsgItemElem[]): void {
        messageList.value.splice(0, messageList.value.length, ...messages)
    }

    function reset(show?: BaseChatInfoElem): void {
        chatInfo.value = createEmptyChatInfo(show)
        clearMessages()
        mergeMsgStack.value = []
        mergeMessageList.value = undefined
        mergeMessageImgList.value = undefined
    }

    return {
        chatInfo,
        messageList,
        clearMessages,
        setMessages,
        mergeMsgStack,
        mergeMessageList,
        mergeMessageImgList,
        reset,
    }
})
