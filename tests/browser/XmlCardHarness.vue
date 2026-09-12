<template>
  <label>XML <textarea
    v-model="xml"
    aria-label="XML"
  /></label>
  <label><input
    v-model="enabled"
    type="checkbox"
  >External services</label>
  <XmlCardBody
    :card="card"
    :external-services="enabled"
    fallback="Unsupported XML"
    @open="onOpen"
  />
  <output aria-label="Opened URL">{{ opened }}</output>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import XmlCardBody from '../../src/renderer/src/components/msg-component/XmlCardBody.vue'
import { parseXmlCard } from '../../src/renderer/src/protocol/xml-card'

const xml = ref('')
const enabled = ref(false)
const opened = ref('')
const card = computed(() => parseXmlCard(xml.value))
function onOpen(url: string) { opened.value = url }
</script>
