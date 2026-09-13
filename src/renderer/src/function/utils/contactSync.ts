import app from '@renderer/main'
import { Connector } from '@renderer/function/connect'
import { getMsgData, updateBaseOnMsgList, updateLastestHistory } from '@renderer/function/utils/msgUtil'
import {
    buildPinyinForContacts,
    hydrateContactPinyinLater,
    sortContactListByPinyin,
} from '@renderer/function/utils/contactPinyin'
import { isPinyinReady } from '@renderer/function/utils/pinyin'
import { mergeEarlySessionContacts } from '@renderer/function/utils/sessionUtil'
import { updateMenu } from '@renderer/function/utils/appUtil'
import { useAuthStore } from '@renderer/state/auth'
import { useContactStore } from '@renderer/state/contact'
import { useSettingsStore } from '@renderer/state/settings'
import type { Session } from '@renderer/function/elements/information'

type MessagePayload = Record<string, unknown>
type PathMap = Record<string, unknown>

let listLoadTimes = 0

export function resetContactSync(): void {
    listLoadTimes = 0
}

export function saveUser(msg: MessagePayload, type: string, msgPath: PathMap) {
    const authStore = useAuthStore()
    const contactStore = useContactStore()
    const settingsStore = useSettingsStore()
    listLoadTimes++
    let list: Session[] | undefined
    if (typeof msgPath.user_list === 'string' || typeof msgPath.user_list === 'object')
        list = getMsgData('user_list', msg, msgPath.user_list as string | Record<string, string>) as Session[]
    else {
        switch (type) {
            case 'friend':
                list = getMsgData('friend_list', msg, msgPath.friend_list as string | Record<string, string>) as Session[]
                if (list)
                    list = list.filter((item, index, arr) => {
                        return arr.findIndex((item2) => item2.user_id == item.user_id) == index
                    })
                break
            case 'group':
                list = getMsgData('group_list', msg, msgPath.group_list as string | Record<string, string>) as Session[]
                if (list)
                    list = list.filter((item, index, arr) => {
                        return arr.findIndex((item2) => item2.group_id == item.group_id) == index
                    })
                break
        }
    }
    if (list != undefined) {
        const groupNames = {} as { [key: number]: string }
        list.forEach((item, index) => {
            if (item.group_name == null || item.group_name == undefined) {
                item.group_name = ''
            }
            if (list?.[index]) {
                list[index].py_name = { main: [], short: [] }
                list[index].py_start = ' '
            }
            if (type == 'friend') {
                if (item.class_id != undefined && item.class_name) {
                    if (typeof item.class_name == 'string') {
                        groupNames[item.class_id] = item.class_name
                    } else {
                        groupNames[item.class_id] = item.class_name[0]
                    }
                }
                item.group_name = ''
            } else {
                delete item.class_id
                delete item.class_name
            }
        })
        if (Object.keys(groupNames).length > 0) {
            const groupNamesList = [] as {
                class_id: number
                class_name: string
            }[]
            for (const key in groupNames) {
                groupNamesList.push({
                    class_id: Number(key),
                    class_name: groupNames[key] ?? '',
                })
            }
            saveClassInfo(groupNamesList)
        }
        if (isPinyinReady()) {
            buildPinyinForContacts(list)
        } else {
            hydrateContactPinyinLater(list)
        }
        sortContactListByPinyin(list)
        const didMergeEarlySessions = mergeEarlySessionContacts(
            list,
            contactStore.baseOnMsgList,
        )
        contactStore.userList = contactStore.userList.concat(list)
        if (
            settingsStore.sysConfig.session_display_mode === 'all' ||
            didMergeEarlySessions
        ) {
            updateBaseOnMsgList()
        }
        const info = settingsStore.sysConfig.top_info as {
            [key: string]: number[]
        } | null
        if (info != null) {
            const topList = info[authStore.loginInfo.uin]
            if (topList !== undefined) {
                list.forEach((item) => {
                    const id = Number(
                        item.user_id ? item.user_id : item.group_id,
                    )
                    if (topList.indexOf(id) >= 0) {
                        item.always_top = true
                        if (contactStore.baseOnMsgList.get(id) == undefined) {
                            contactStore.baseOnMsgList.set(id, item)
                            contactStore.userList.forEach((user) => {
                                if (user.always_top) {
                                    updateLastestHistory(user)
                                }
                            })
                        }
                    }
                })
            }
        }
        updateMenu({
            parent: 'account',
            id: 'userList',
            action: 'label',
            value: app.config.globalProperties.$t('用户列表（{count}）', {
                count: contactStore.userList.length,
            }),
        })
    }
    if (listLoadTimes > 0 && listLoadTimes % 2 == 0) {
        if (authStore.jsonMap.recent_contact)
            Connector.send(
                authStore.jsonMap.recent_contact.name,
                {},
                'getRecentContact',
            )
    }
    if (type == 'friend' && authStore.jsonMap.friend_category) {
        Connector.send(
            authStore.jsonMap.friend_category.name,
            {},
            'getFriendCategory',
        )
    }
}

export function saveClassInfo(
    list: { class_id: number; class_name: string; sort_id?: number }[],
) {
    const settingsStore = useSettingsStore()
    if (list[0]?.sort_id != undefined) {
        list.sort((a, b) => {
            if (a.sort_id && b.sort_id) return a.sort_id - b.sort_id
            else return 0
        })
    } else {
        list.sort((a, b) => a.class_id - b.class_id)
    }

    settingsStore.classes = list
}
