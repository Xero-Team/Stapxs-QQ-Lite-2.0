<template>
    <TransitionGroup class="app-msg" name="appmsg" tag="div">
        <div v-for="message in messages" :key="'appmsg-' + message.id">
            <div><font-awesome-icon :icon="['fas', message.svg]" /></div>
            <a>{{ message.text }}</a>
            <div v-if="!message.autoClose" @click="emit('remove', message.id)">
                <font-awesome-icon :icon="['fas', 'xmark']" />
            </div>
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
import type { PopInfoElem } from '@renderer/function/elements/system'

defineOptions({ name: 'AppNotifications' })

defineProps<{
    messages: PopInfoElem[]
}>()

const emit = defineEmits<{
    remove: [id: number]
}>()
</script>
