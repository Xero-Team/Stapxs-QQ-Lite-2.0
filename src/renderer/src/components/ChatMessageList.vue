<template>
    <template v-if="!searchOpen">
        <div v-if="!canLoadHistory" class="note note-nomsg">
            <hr>
            <a>{{ $t('没有更多消息了') }}</a>
        </div>
        <div v-if="loadHistoryFail" class="note note-nomsg">
            <hr>
            <a>{{ $t('获取历史记录失败') }}</a>
        </div>
        <NoticeBody v-if="nowGetHistory && list.length > 0"
            :data="{ sub_type: 'time', ...(list[0] ? { time: list[0].time } : {}) }" />
        <TransitionGroup :name="fastAnimation ? '' : 'msglist'" tag="div">
            <template v-for="(msgIndex, index) in list">
                <NoticeBody
                    v-if="isShowTime(list[Number(index) - 1]?.time, msgIndex.time)"
                    :key="'notice-time-' + (msgIndex.time / (4 * 60)).toFixed(0)"
                    :data="{ sub_type: 'time', time: msgIndex.time }" />
                <NoticeBody
                    v-if="isDeleteMsg(msgIndex)"
                    :key="'delete-' + msgIndex.message_id"
                    :data="{ sub_type: 'delete' }" />
                <MsgBody v-else-if="isMessage(msgIndex)"
                    :key="msgIndex.fake_message_id ?? msgIndex.message_id"
                    :selected="isSelected(msgIndex)"
                    :data="msgIndex"
                    :image-list-header="chatImg"
                    @click="emit('message-click', $event, msgIndex)"
                    @showMenu="forwardShowMenu"
                    @scrollToMsg="forwardScroll"
                    @imageLoaded="emit('image-loaded', $event)"
                    @leftMove="emit('left-move', $event)"
                    @sendPoke="emit('send-poke', $event)" />
                <NoticeBody v-else-if="msgIndex.post_type === 'notice'"
                    :id="'notice-' + msgIndex.message_id + '-' + index"
                    :key="'notice-' + index"
                    :data="msgIndex" />
            </template>
        </TransitionGroup>
    </template>
    <template v-else>
        <TransitionGroup :name="fastAnimation ? '' : 'msglist'" tag="div">
            <template v-for="(msgIndex, index) in searchList">
                <NoticeBody
                    v-if="isShowTime(searchList[Number(index) - 1]?.time, msgIndex.time)"
                    :key="'notice-time-' + index"
                    :data="{ sub_type: 'time', time: msgIndex.time }" />
                <MsgBody v-if="isMessage(msgIndex)"
                    :key="msgIndex.fake_message_id ?? msgIndex.message_id"
                    :selected="isSelected(msgIndex)"
                    :data="msgIndex"
                    @scrollToMsg="forwardScroll"
                    @showMenu="forwardShowMenu"
                    @imageLoaded="emit('image-loaded', $event)"
                    @leftMove="emit('left-move', $event)" />
            </template>
        </TransitionGroup>
    </template>
</template>

<script setup lang="ts">
import MsgBody from './MsgBody.vue'
import NoticeBody from './NoticeBody.vue'
import { isDeleteMsg, isShowTime } from '@renderer/function/utils/msgUtil'
import type { Img } from '@renderer/function/model/img'
import type { MenuEventData, RenderedMessage } from '@renderer/function/elements/information'

defineOptions({ name: 'ChatMessageList' })

const props = defineProps<{
    list: RenderedMessage[]
    searchList: RenderedMessage[]
    searchOpen: boolean
    canLoadHistory: boolean
    loadHistoryFail: boolean
    nowGetHistory: boolean
    fastAnimation: boolean
    multipleSelectList: string[]
    menuSelectedMsgId: string | null
    chatImg: Img | undefined
}>()

const emit = defineEmits<{
    'message-click': [event: Event, message: RenderedMessage]
    'show-menu': [event: MenuEventData, message: RenderedMessage]
    'scroll-to-msg': [messageId: string, showAnimation: boolean]
    'image-loaded': [height: number]
    'left-move': [message: RenderedMessage]
    'send-poke': [userId: number]
}>()

function isMessage(message: RenderedMessage): boolean {
    return (message.post_type === 'message' || message.post_type === 'message_sent') && message.message.length > 0
}

function isSelected(message: RenderedMessage): boolean {
    return props.multipleSelectList.includes(message.message_id) || props.menuSelectedMsgId === message.message_id
}

function forwardScroll(messageId: string, showAnimation: boolean): void {
    emit('scroll-to-msg', messageId, showAnimation)
}

function forwardShowMenu(event: MenuEventData, message: RenderedMessage): void {
    emit('show-menu', event, message)
}
</script>
