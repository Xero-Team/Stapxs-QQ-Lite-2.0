import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConnectionStore = defineStore('connection', () => {
    const heartbeatTime = ref<number>(-1)
    const oldHeartbeatTime = ref<number>(-1)
    const lastHeartbeatTime = ref<number>(-1)
    const backTimes = ref(0)
    const metaEventWatchTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)
    const metaEventTimeoutTriggered = ref(false)

    function reset(): void {
        if (metaEventWatchTimer.value) clearTimeout(metaEventWatchTimer.value)
        metaEventWatchTimer.value = undefined
        metaEventTimeoutTriggered.value = false
        heartbeatTime.value = -1
        oldHeartbeatTime.value = -1
        lastHeartbeatTime.value = -1
        backTimes.value = 0
    }

    return {
        heartbeatTime,
        oldHeartbeatTime,
        lastHeartbeatTime,
        backTimes,
        metaEventWatchTimer,
        metaEventTimeoutTriggered,
        reset,
    }
})
