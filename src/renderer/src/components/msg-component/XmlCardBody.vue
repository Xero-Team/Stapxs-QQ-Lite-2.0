<template>
  <div
    class="msg-xml"
    :class="{ 'msg-xml-link': card.status === 'ok' && card.link }"
    :role="card.status === 'ok' && card.link ? 'link' : undefined"
    :tabindex="card.status === 'ok' && card.link ? 0 : undefined"
    @click="openCard"
    @keydown.enter.prevent="openCard">
    <template v-if="card.status === 'ok'">
      <template v-for="(block, index) in card.blocks" :key="index">
        <p
          v-if="block.kind === 'title'"
          :style="{ fontSize: `${block.size / 30}rem`, marginBottom: `${block.size / 5}px` }">
          {{ block.text }}
        </p>
        <span v-else-if="block.kind === 'summary'" class="msg-xml-summary">{{ block.text }}</span>
        <img
          v-else-if="block.kind === 'picture' && isExternalRequestAllowed(block.url, externalServices)"
          class="msg-xml-img"
          :src="block.url"
          alt=""
          referrerpolicy="no-referrer"
          @load="auditExternalRequest(block.url, 'xml-card-image')">
      </template>
    </template>
    <span v-else class="msg-unknown">{{ fallback }}</span>
  </div>
</template>

<script setup lang="ts">
import type { XmlCard } from '@renderer/protocol/xml-card'
import { auditExternalRequest, isExternalRequestAllowed } from '@renderer/network/policy'

const props = defineProps<{ card: XmlCard; externalServices: boolean; fallback: string }>()
const emit = defineEmits<{ open: [url: string] }>()

function openCard() {
    if (props.card.status === 'ok' && props.card.link) emit('open', props.card.link)
}
</script>

<style scoped>
.msg-xml-link { cursor: pointer; }
</style>
