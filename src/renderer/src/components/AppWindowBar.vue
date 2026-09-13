<template>
    <div v-if="['linux', 'win32'].includes(platform ?? '')"
        :class="['top-bar', { win: platform == 'win32' && dev }]"
        name="appbar"
        data-tauri-drag-region="true"
        @mousedown="$emit('drag', $event)">
        <div class="bar-button" @click="$emit('home')" />
        <div class="space" />
        <div class="controller">
            <div class="min" @click="$emit('minimize')">
                <font-awesome-icon :icon="['fas', 'minus']" />
            </div>
            <div class="close" @click="$emit('close')">
                <font-awesome-icon :icon="['fas', 'xmark']" />
            </div>
        </div>
    </div>
    <div v-else-if="platform == 'darwin'" class="controller mac-controller"
        data-tauri-drag-region="true" />
</template>

<script setup lang="ts">
defineProps<{
    platform: string | undefined
    dev: boolean
}>()

defineEmits<{
    home: []
    minimize: []
    close: []
    drag: [event: MouseEvent]
}>()
</script>
