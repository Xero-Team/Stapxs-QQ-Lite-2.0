<template>
    <Teleport to="body">
        <div :class="'msg-menu' + (withBar ? ' withBar' : '')">
            <div v-show="show" class="msg-menu-bg" @click="$emit('close')" />
            <div id="msgMenu" :class="show ? 'ss-card msg-menu-body show' : 'ss-card msg-menu-body'">
                <div v-if="isGroup" v-show="menu.showRespond"
                    :class="'ss-card respond' + (menu.respond ? ' open' : '')">
                    <template v-for="(num, index) in Emoji.responseId" :key="'respond-' + num">
                        <EmojiFace :emoji="Emoji.get(num)!" @click="$emit('respond', num)" />
                        <font-awesome-icon v-if="index == 4" :icon="['fas', 'angle-up']"
                            @click="$emit('expand-respond')" />
                    </template>
                </div>
                <div v-show="menu.add" @click="$emit('forward-self')">
                    <div><font-awesome-icon :icon="['fas', 'plus']" /></div>
                    <a>{{ $t('+ 1') }}</a>
                </div>
                <div v-show="menu.relpy" @click="$emit('reply')">
                    <div><font-awesome-icon :icon="['fas', 'message']" /></div>
                    <a>{{ $t('回复') }}</a>
                </div>
                <div v-show="menu.forward" @click="$emit('forward')">
                    <div><font-awesome-icon :icon="['fas', 'share']" /></div>
                    <a>{{ $t('转发') }}</a>
                </div>
                <div v-show="menu.select" @click="$emit('select')">
                    <div><font-awesome-icon :icon="['fas', 'circle-check']" /></div>
                    <a>{{ $t('多选') }}</a>
                </div>
                <div v-show="menu.copy" @click="$emit('copy')">
                    <div><font-awesome-icon :icon="['fas', 'clipboard']" /></div>
                    <a>{{ $t('复制') }}</a>
                </div>
                <div v-show="menu.copySelect" @click="$emit('copy-select')">
                    <div><font-awesome-icon :icon="['fas', 'code']" /></div>
                    <a>{{ $t('复制选中文本') }}</a>
                </div>
                <div v-show="menu.copyImg" @click="$emit('copy-img')">
                    <div><font-awesome-icon :icon="['fas', 'object-ungroup']" /></div>
                    <a>{{ $t('复制图片') }}</a>
                </div>
                <div v-show="menu.downloadImg != false" @click="$emit('download-img')">
                    <div><font-awesome-icon :icon="['fas', 'floppy-disk']" /></div>
                    <a>{{ $t('下载图片') }}</a>
                </div>
                <div v-show="menu.revoke" @click="$emit('revoke')">
                    <div><font-awesome-icon :icon="['fas', 'xmark']" /></div>
                    <a>{{ $t('撤回') }}</a>
                </div>
                <div v-show="menu.reedit" @click="$emit('reedit')">
                    <div><font-awesome-icon :icon="['fas', 'pencil']" /></div>
                    <a>{{ $t('重新编辑') }}</a>
                </div>
                <div v-show="menu.at" @click="$emit('at')">
                    <div><font-awesome-icon :icon="['fas', 'at']" /></div>
                    <a>{{ $t('提及') }}</a>
                </div>
                <div v-show="menu.poke" @click="$emit('poke')">
                    <div><font-awesome-icon :icon="['fas', 'fa-hand-point-up']" /></div>
                    <a>{{ $t('戳一戳') }}</a>
                </div>
                <div v-show="menu.remove" @click="$emit('remove')">
                    <div><font-awesome-icon :icon="['fas', 'trash-can']" /></div>
                    <a>{{ $t('移出群聊') }}</a>
                </div>
                <div v-show="menu.config" @click="$emit('config')">
                    <div><font-awesome-icon :icon="['fas', 'cog']" /></div>
                    <a>{{ $t('成员设置') }}</a>
                </div>
                <div v-show="menu.jumpToMsg" @click="$emit('jump')">
                    <div><font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" /></div>
                    <a>{{ $t('跳转到消息') }}</a>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { i18n } from '@renderer/main'
import Emoji from '@renderer/function/model/emoji'
import EmojiFace from '@renderer/components/EmojiFace.vue'

export interface ChatMsgMenuDisplay {
    jumpToMsg: boolean
    add: boolean
    relpy: boolean
    forward: boolean
    select: boolean
    copy: boolean
    copySelect: boolean
    copyImg: boolean
    downloadImg: string | false
    revoke: boolean
    reedit: boolean
    at: boolean
    poke: boolean
    remove: boolean
    respond: boolean
    showRespond: boolean
    config: boolean
}

defineProps<{
    show: boolean
    withBar: boolean
    isGroup: boolean
    menu: ChatMsgMenuDisplay
}>()

defineEmits<{
    close: []
    respond: [num: number]
    'expand-respond': []
    'forward-self': []
    reply: []
    forward: []
    select: []
    copy: []
    'copy-select': []
    'copy-img': []
    'download-img': []
    revoke: []
    reedit: []
    at: []
    poke: []
    remove: []
    config: []
    jump: []
}>()

const $t = i18n.global.t
</script>
