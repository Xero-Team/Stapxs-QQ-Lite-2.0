<template>
    <div class="info">
        <font-awesome-icon class="back" :icon="['fas', 'angle-left']" @click="$emit('back')" />
        <img :src="chat.show.avatar" :alt="chat.show.name">
        <div class="info">
            <p>
                {{ chat.show.name }}
                <template v-if="chat.show.type === 'group'">
                    ({{ chat.info.group_members.length }})
                </template>
            </p>
            <span v-if="chat.show.temp !== undefined">
                {{ $t('来自群聊：{group}', { group: chat.show.temp }) }}
            </span>
            <span v-else>
                <template v-if="chat.show.appendInfo">
                    {{ chat.show.appendInfo }}
                </template>
                <template v-else>
                    {{ lastMessage
                        ? $t('上次消息 - {time}', { time: formatTime(lastMessage.time) })
                        : $t('暂无消息') }}
                </template>
            </span>
        </div>
        <div class="space" />
        <div class="more">
            <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" @click="$emit('open-info')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { i18n } from '@renderer/main'
import { getTrueLang } from '@renderer/function/utils/systemUtil'
import type { ChatInfoElem, MsgItemElem } from '@renderer/function/elements/information'

const props = defineProps<{
    chat: ChatInfoElem
    list: MsgItemElem[]
}>()

defineEmits<{
    back: []
    'open-info': []
}>()

const $t = i18n.global.t
const trueLang = getTrueLang()
const lastMessage = computed(() => props.list.at(-1))

function formatTime(value: unknown): string {
    const timestamp = typeof value === 'number' && Number.isFinite(value) ? value : 0
    return Intl.DateTimeFormat(trueLang, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    }).format(new Date(timestamp * 1000))
}
</script>
