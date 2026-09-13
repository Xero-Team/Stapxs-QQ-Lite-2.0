<template>
    <Transition>
        <div v-if="show" class="forward-pan">
            <div class="ss-card card">
                <header>
                    <span>{{ $t('转发消息') }}</span>
                    <font-awesome-icon :icon="['fas', 'xmark']" @click="$emit('close')" />
                </header>
                <label for="chat-forward-search" class="sr-only">{{ $t('搜索转发对象') }}</label>
                <input id="chat-forward-search" :placeholder="$t('搜索 ……')" @input="$emit('search', $event)">
                <div>
                    <div v-for="data in list"
                        :key="'forwardList-' + (data.user_id ? data.user_id : data.group_id)"
                        @click="$emit('select', data)">
                        <img loading="lazy"
                            :title="getShowName(data.group_name || data.nickname, data.remark)"
                            :src="data.user_id ? avatarUrl(data.user_id) : avatarUrl(data.group_id, 'group')">
                        <div>
                            <p>
                                {{ data.group_name
                                    ? data.group_name
                                    : data.remark === data.nickname
                                        ? data.nickname
                                        : data.remark + '（' + data.nickname + '）' }}
                            </p>
                            <span>{{ data.group_id ? $t('群组') : $t('好友') }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg" @click="$emit('close')" />
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { i18n } from '@renderer/main'
import { avatarUrl } from '@renderer/function/utils/avatar'
import { getShowName } from '@renderer/function/utils/displayFormat'
import type { UserFriendElem, UserGroupElem } from '@renderer/function/elements/information'

defineProps<{
    show: boolean
    list: Array<UserFriendElem & UserGroupElem>
}>()

defineEmits<{
    close: []
    search: [event: Event]
    select: [data: UserFriendElem & UserGroupElem]
}>()

const $t = i18n.global.t
</script>
