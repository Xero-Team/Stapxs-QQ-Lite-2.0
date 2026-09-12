import { ChatInfoElem, MergeStackData, MsgItemElem } from '@renderer/function/elements/information'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
    const chatInfo = ref<ChatInfoElem>({
        show: { type: '', id: 0, name: '', avatar: '' },
        info: {
            group_info: {},
            user_info: {},
            me_info: {},
            group_members: [],
            group_files: [],
            group_sub_files: {},
            jin_info: {
                list: [],
                pages: 0,
            },
        },
    })

    const messageList = ref<MsgItemElem[]>([])
    const mergeMsgStack = ref<MergeStackData[]>([])
    const mergeMessageList = ref<MsgItemElem[] | undefined>(undefined)
    const mergeMessageImgList = ref<Array<{ img_url: string }> | undefined>(undefined)

    return {
        chatInfo,
        messageList,
        mergeMsgStack,
        mergeMessageList,
        mergeMessageImgList,
    }
})
