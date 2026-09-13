import { UserFriendElem, UserGroupElem } from '@renderer/function/elements/information'
import { defineStore } from 'pinia'
import { shallowRef, reactive, ref } from 'vue'

export interface SystemNotice {
    flag?: string
    request_type?: string
    sub_type?: string
    user_id?: string | number
    group_id?: string | number
    time?: string | number
    comment?: string
    [key: string]: unknown
}

export const useContactStore = defineStore('contact', () => {
    const userList = shallowRef<(UserFriendElem & UserGroupElem)[]>([])
    const showList = shallowRef<(UserFriendElem & UserGroupElem)[]>([])
    const groupAssistList = shallowRef<(UserFriendElem & UserGroupElem)[]>([])
    const baseOnMsgList = reactive(new Map<number, UserFriendElem & UserGroupElem>())
    const onMsgList = shallowRef<(UserFriendElem & UserGroupElem)[]>([])
    const newMsgCount = ref(0)
    const systemNoticesList = shallowRef<SystemNotice[] | undefined>(undefined)

    function reset(): void {
        userList.value = []
        showList.value = []
        groupAssistList.value = []
        baseOnMsgList.clear()
        onMsgList.value = []
        newMsgCount.value = 0
        systemNoticesList.value = []
    }

    return {
        userList,
        showList,
        groupAssistList,
        baseOnMsgList,
        onMsgList,
        newMsgCount,
        systemNoticesList,
        reset,
    }
})
