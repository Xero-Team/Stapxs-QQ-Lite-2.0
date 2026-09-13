import { Connector } from '@renderer/function/connect'
import { useAuthStore } from '@renderer/state/auth'
import { useContactStore } from '@renderer/state/contact'
import { useSettingsStore } from '@renderer/state/settings'

import {
    UserFriendElem,
    UserGroupElem,
} from '../elements/information'
import { getSessionId } from './sessionUtil'
import { getShowName } from './displayFormat'

type SessionItem = UserFriendElem & UserGroupElem

export function updateLastestHistory(item: SessionItem) {
    const authStore = useAuthStore()
    const type = item.user_id ? 'user' : 'group'
    const id = item.user_id ? item.user_id : item.group_id
    const messageMap = authStore.jsonMap.message_list
    const name = messageMap && type !== 'group'
        ? messageMap.private_name
        : messageMap?.name

    Connector.send(
        name ?? 'get_chat_history',
        {
            message_type: messageMap?.message_type[type],
            group_id: id,
            user_id: id,
            message_seq: 0,
            message_id: 0,
            count: 1,
        },
        'getChatHistoryOnMsg_' + id,
    )
}

function getSessionTime(item: SessionItem) {
    const time = Number(item.time ?? 0)
    return Number.isFinite(time) ? time : 0
}

function getSessionSortName(item: SessionItem) {
    return item.py_start ?? getShowName(item.group_name ?? item.nickname ?? '', item.remark ?? '')
}

function getSessionList() {
    const contactStore = useContactStore()
    const settingsStore = useSettingsStore()
    const sessionMap = new Map<number, SessionItem>()

    if (settingsStore.sysConfig.session_display_mode === 'all') {
        contactStore.userList.forEach((item) => {
            const id = getSessionId(item)
            if (Number.isFinite(id) && id > 0) {
                sessionMap.set(id, item)
            }
        })
    }

    contactStore.baseOnMsgList.forEach((item, id) => {
        sessionMap.set(id, item)
    })

    return [...sessionMap.values()]
}

export function updateBaseOnMsgList() {
    const contactStore = useContactStore()
    const settingsStore = useSettingsStore()
    const allList = getSessionList()
    const topList = allList.filter((item) => item.always_top)
    const normalList = allList.filter((item) => !item.always_top)

    const sortFun = (a: SessionItem, b: SessionItem) => {
        const timeA = getSessionTime(a)
        const timeB = getSessionTime(b)
        if (timeA !== timeB) return timeB - timeA

        return getSessionSortName(b).localeCompare(getSessionSortName(a))
    }
    topList.sort(sortFun)
    normalList.sort(sortFun)

    let onMsgList: SessionItem[] = []
    let groupAssistList: SessionItem[] = []
    if (settingsStore.sysConfig.bubble_sort_user) {
        const shouldShowInMainList = (item: SessionItem) => {
            return item.user_id || item.new_msg || item.highlight
        }
        onMsgList = topList.concat(normalList.filter(shouldShowInMainList))
        groupAssistList = normalList.filter((item) => {
            return item.group_id && !shouldShowInMainList(item)
        })
    } else {
        onMsgList = topList.concat(normalList)
    }

    contactStore.onMsgList = onMsgList
    contactStore.groupAssistList = groupAssistList
}
