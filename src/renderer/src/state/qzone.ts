import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

export type QzoneFeedRecord = Record<string, unknown>

export const useQzoneStore = defineStore('qzone', () => {
    const qzoneFeedList = ref<QzoneFeedRecord[]>([])
    const state = shallowReactive({
        currentView: 'feed' as 'feed' | 'my',
        myPagePos: 0,
        myPageSize: 10,
        myHasMore: true,
        myLoading: false,
    })

    function reset(): void {
        qzoneFeedList.value = []
        state.currentView = 'feed'
        state.myPagePos = 0
        state.myHasMore = true
        state.myLoading = false
    }

    return {
        qzoneFeedList,
        state,
        reset,
    }
})
