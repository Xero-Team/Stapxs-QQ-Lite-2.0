<template>
    <Transition name="pan">
        <div v-show="open && list.length > 0" class="ss-card jin-pan">
            <div>
                <font-awesome-icon :icon="['fas', 'message']" />
                <span>{{ $t('精华消息') }}</span>
                <font-awesome-icon :icon="['fas', 'xmark']" @click="$emit('close')" />
            </div>
            <div class="jin-pan-body" @scroll="$emit('scroll', $event)">
                <div v-for="(item, index) in list" :key="'jin-' + index">
                    <div>
                        <img :src="avatarUrl(item.sender_uin)">
                        <div>
                            <a>{{ item.sender_nick }}</a>
                            <span>{{ item.sender_time ? Intl.DateTimeFormat(locale, {
                                hour: 'numeric',
                                minute: 'numeric',
                            }).format(new Date(item.sender_time * 1000)) : '' }}
                                {{ $t('发送') }}</span>
                        </div>
                        <span>{{ $t('{time}，由 {name} 设置', {
                            time: item.sender_time ? Intl.DateTimeFormat(locale, {
                                hour: 'numeric',
                                minute: 'numeric',
                            }).format(new Date(item.sender_time * 1000)) : '',
                            name: item.add_digest_nick,
                        }) }}</span>
                    </div>
                    <div class="context">
                        <template v-for="(context, indexc) in item.msg_content" :key="'jinc-' + index + '-' + indexc">
                            <span v-if="context.type === 'text'">{{ context.data.text }}</span>
                            <EmojiFace v-if="context.type === 'face'" :emoji="Emoji.get(Number(context.data.id))" />
                            <img v-if="context.type === 'image'" :src="context.data.url"
                                @click="$emit('view-image', context.data.url ?? '')">
                        </template>
                    </div>
                </div>
                <div v-show="loading" class="jin-pan-load">
                    <font-awesome-icon :icon="['fas', 'spinner']" />
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { i18n } from '@renderer/main'
import { avatarUrl } from '@renderer/function/utils/avatar'
import Emoji from '@renderer/function/model/emoji'
import EmojiFace from '@renderer/components/EmojiFace.vue'
import type { JinMessageElem } from '@renderer/function/elements/information'

defineProps<{
    open: boolean
    list: JinMessageElem[]
    loading: boolean
    locale: string
}>()

defineEmits<{
    close: []
    scroll: [event: Event]
    'view-image': [url: string]
}>()

const $t = i18n.global.t
</script>
