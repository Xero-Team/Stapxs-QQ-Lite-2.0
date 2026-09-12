<!-- XML card adapter: protocol parsing and rendering live in separate modules. -->
<template>
  <XmlCardBody
    :id="'xml-' + id"
    :data-id="id"
    :card="card"
    :external-services="settings.sysConfig.enable_external_services === true"
    :fallback="card.status === 'unsupported'
      ? `（${$t('chat_xml_unsupport')}：${card.source}）`
      : `( ${$t('解析消息错误')}: xml )`"
    @open="openLink"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseXmlCard } from '@renderer/protocol/xml-card'
import { openLink } from '@renderer/function/utils/appUtil'
import { useSettingsStore } from '@renderer/state/settings'
import XmlCardBody from './XmlCardBody.vue'

const props = defineProps<{ item: string; id: string }>()
const settings = useSettingsStore()
const card = computed(() => parseXmlCard(props.item))
</script>
