import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStickerStore = defineStore('sticker', () => {
    const stickerCache = ref<string[] | undefined>([])

    function reset(): void {
        stickerCache.value = []
    }

    return {
        stickerCache,
        reset,
    }
})
