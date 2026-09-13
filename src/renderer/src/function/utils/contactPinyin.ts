import { getPinyin, ensurePinyinLoaded, isPinyinReady } from './pinyin'
import { useContactStore } from '@renderer/state/contact'
import type { UserFriendElem, UserGroupElem } from '../elements/information'

type ContactItem = UserFriendElem | UserGroupElem

function resolveContactPinyinName(item: ContactItem): string {
    if ((item as UserFriendElem).group_id) {
        return (item as UserFriendElem).group_name ?? ''
    }
    return `${(item as UserGroupElem).nickname ?? ''},${(item as UserGroupElem).remark ?? ''}`
}

export function resolvePinyinFirstChar(value: string): string {
    return getPinyin(value)
        .main
        .at(0)
        ?.substring(0, 1)
        .toUpperCase() ?? ' '
}

export function sortContactListByPinyin<T extends ContactItem>(list: T[]): void {
    list.sort((a, b) => {
        if (a.py_start && b.py_start) {
            return a.py_start.charCodeAt(0) - b.py_start.charCodeAt(0)
        }
        return 0
    })
}

export function buildPinyinForContacts(
    list: ContactItem[],
    startIndex = 0,
    onDone?: () => void,
): void {
    if (!isPinyinReady()) {
        onDone?.()
        return
    }

    const batchSize = 100
    const endIndex = Math.min(startIndex + batchSize, list.length)

    for (let index = startIndex; index < endIndex; index++) {
        const item = list[index]
        if (!item) continue
        item.py_name = getPinyin(resolveContactPinyinName(item))
        item.py_start = item.py_name.main.at(0)?.substring(0, 1).toUpperCase() ?? ' '
    }

    if (endIndex >= list.length) {
        onDone?.()
        return
    }

    setTimeout(() => {
        buildPinyinForContacts(list, endIndex, onDone)
    }, 0)
}

export function hydrateContactPinyinLater(list: ContactItem[]): void {
    const contactStore = useContactStore()

    const applyHydration = () => {
        buildPinyinForContacts(list, 0, () => {
            sortContactListByPinyin(list)
            contactStore.userList = [...contactStore.userList]
        })
    }

    if (isPinyinReady()) {
        applyHydration()
        return
    }

    void ensurePinyinLoaded().then((loaded) => {
        if (!loaded) return
        applyHydration()
    })
}
