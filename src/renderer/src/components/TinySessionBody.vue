<!--
 * @FileDescription: 搜索列表用的会话本体
 * @Author: Mr.Lee
 * @Date:
 *      2025/08/02
 * @Version:
 *      1.0 - 初始版本
 * @Description:
 *      该组件用于展示会话列表的元素。转发和收纳盒设置需要用。直接套用FriendBody开销太大，这个更轻量级
-->
<template>
    <div :key=" 'tiny-' + String(session.group_id ?? session.user_id)"
        class="tiny-session-body"
        :class="{
            'selected': selected,
        }">
        <div />
        <img loading="lazy"
            :title="getShowName(session.group_name || session.nickname, session.remark)"
            :src="session.user_id ? avatarUrl(session.user_id) :
                avatarUrl(session.group_id, 'group')">
        <div>
            <p>
                {{ getShowName(session.group_name || session.nickname, session.remark) }}
            </p>
            <div v-if="from === 'global-search' && session.raw_msg">
                <span>{{ session.raw_msg }}</span>
            </div>
            <div v-else>
                <span v-if="session.group_id">{{ $t('群组') }}</span>
                <span v-else-if="session.user_id">{{ $t('好友') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { avatarUrl } from '@renderer/function/utils/avatar'
import { UserGroupElem, UserFriendElem } from '@renderer/function/elements/information'
import { getShowName } from '@renderer/function/utils/msgUtil'

type Session = Pick<UserGroupElem, 'user_id' | 'nickname' | 'remark'> &
    Partial<Pick<UserFriendElem, 'group_id' | 'group_name' | 'raw_msg'>>

const {
    session,
    selected = false,
    from,
} = defineProps<{
    session: Session,
    selected?: boolean,
    from?: 'global-search'
}>()
</script>
