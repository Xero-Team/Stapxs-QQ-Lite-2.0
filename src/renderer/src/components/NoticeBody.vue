<!--
 * @FileDescription: 通知消息模板
 * @Author: Xero-Team
 * @Date: 2022/12/04
 * @Version: 1.0
-->

<template>
    <div :id="'notice-' + id"
        class="note">
        <div v-if="data.notice_type && data.notice_type.indexOf('recall') >= 0" class="note-recall note-base">
            <a>{{ info.name }}</a>
            <span>{{ $t('撤回了一条消息') }}</span>
            <div />
            <a
                v-if="data.originMsg"
                @click="$emit('reedit', data.originMsg)">
                {{ $t('重新编辑') }}
            </a>
        </div>
        <div v-else-if="data.notice_type == 'group_ban'" class="note-ban note-base">
            <template v-if="data.sub_type === 'ban'">
                <template v-if="isMe(data.user_id)">
                    <span>{{ $t('成员类型_admin') }}</span>
                    <a>&nbsp;{{ getName(data.operator_id) }}&nbsp;</a>
                    <span>{{ $t('禁言了你') }}</span>
                    <span>&nbsp;{{ fTime(data.duration) }}</span>
                </template>
                <template v-else>
                    <span>{{ $t('管理员禁言了') }}</span>
                    <a>&nbsp;{{ getName(data.user_id) }}&nbsp;</a>
                    <span>{{ fTime(data.duration) }}</span>
                </template>
            </template>
            <span v-else>{{
                $t('管理员解除了 {name} 的禁言', { name: isMe(data.user_id) ? $t('你') : getName(data.user_id)})
            }}</span>
        </div>
        <div v-else-if="data.sub_type === 'delete'" class="note-recall note-base">
            <span>{{ $t('这条消息迷失在虚空里了') }}</span>
            <div />
        </div>
        <div v-else-if="data.sub_type === 'poke'"
            class="note-notify note-base">
            <span>{{ data.str }}</span>
            <div class="space" />
        </div>
        <div v-else-if="data.sub_type === 'time' && data.time != undefined"
            class="note-time note-base">
            <a>{{ Intl.DateTimeFormat(
                trueLang,
                getTimeConfig(new Date(data.time * 1000)),
            ).format(new Date(data.time * 1000))
            }}</a>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import { i18n } from '@renderer/main'
    import { useAuthStore } from '@renderer/state/auth'
    import { useChatStore } from '@renderer/state/chat'
    import {
        getTimeConfig,
        getTrueLang,
    } from '@renderer/function/utils/systemUtil'
    import { pokeAnime } from '@renderer/function/utils/msgUtil'
import { backend } from '@renderer/runtime/backend'
    import type { RenderedMessage } from '@renderer/function/elements/information'

interface NoticePayload {
    [key: string]: unknown
    post_type?: string
    notice_type?: string
    sub_type?: string
    user_id?: string | number
    operator_id?: string | number
    duration?: number
    str?: string
    time?: number
    originMsg?: RenderedMessage
    pokeMe?: boolean
    name?: string | number
}

    const $t = i18n.global.t

    const authStore = useAuthStore()
    const chatStore = useChatStore()

    defineOptions({ name: 'NoticeBody' })

    const props = defineProps<{ data: NoticePayload; id?: string | number }>()
    defineEmits<{ reedit: [message: RenderedMessage] }>()

    const trueLang = getTrueLang()
    const info = ref<NoticePayload>(props.data)

    function isMe(id: string | number | undefined) {
        return String(authStore.loginInfo.uin) === String(id)
    }

    function getName(id: string | number | undefined) {
        const back = chatStore.chatInfo.info.group_members.filter(
            (item) => {
                return item.user_id === id
            },
        )
        if (back.length === 1) {
            const member = back[0]
            return member && (member.card === '' || member.card == null) ? member.nickname : member?.card ?? id ?? ''
        }
        return id ?? ''
    }

    function fTime(time: number | undefined) {
        time ??= 0
        // 将秒数转换为可阅读的时间，最大单位天
        const day = Math.floor(time / 86400)
        const hour = Math.floor((time % 86400) / 3600)
        const minute = Math.floor((time % 3600) / 60)
        const second = time % 60

        let back = ''
        if (day > 0) {
            back += `${day} ${$t('天')} `
        }
        if (hour > 0) {
            back += `${hour} ${$t('小时')} `
        }
        if (minute > 0) {
            back += `${minute} ${$t('分钟')} `
        }
        if (second > 0) {
            back += `${second} ${$t('秒')} `
        }
        return back
    }

    onMounted(async () => {
        let windowInfo = null as {
            x: number
            y: number
            width: number
            height: number
        } | null
        windowInfo = await backend.call(undefined, 'win:getWindowInfo', true)
        // 补全撤回者信息
        if (
            info.value.notice_type &&
            info.value.notice_type.indexOf('recall') >= 0
        ) {
            if (chatStore.chatInfo.show.type === 'group') {
                const id = info.value.operator_id
                // 寻找群成员信息
                if (chatStore.chatInfo.info.group_members !== undefined) {
                    const back =
                        chatStore.chatInfo.info.group_members.filter(
                            (item) => {
                                return item.user_id === Number(id)
                            },
                    )
                    if (back.length === 1) {
                        const member = back[0]
                        if (member) info.value.name = member.card === '' || member.card == null ? member.nickname : member.card
                    } else {
                        info.value.name = id ?? ''
                    }
                } else {
                    info.value.name = id ?? ''
                }
            } else {
                info.value.name = chatStore.chatInfo.show.name
            }
        }
        // poke 通知创建对应的动画
        // PS：只有最后一条 poke 通知会触发动画，避免反复触发动画
        if (info.value.sub_type === 'poke' && info.value.pokeMe &&
            info.value == chatStore.messageList[chatStore.messageList.length - 1]) {
                let item = document.getElementById('app')
                if (backend.isDesktop()) {
                    item = document.getElementById('notice-' + props.id)?.getElementsByClassName('space')[0] as HTMLElement
                }
                pokeAnime(item, windowInfo)
        }
    })
</script>
