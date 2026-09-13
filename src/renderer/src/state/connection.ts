import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConnectionStore = defineStore('connection', () => {
    const heartbeatTime = ref<number>(-1)
    const oldHeartbeatTime = ref<number>(-1)
    const lastHeartbeatTime = ref<number>(-1)
    const backTimes = ref(0)
    const metaEventWatchTimer = ref<ReturnType<typeof setTimeout> | undefined>(undefined)
    const metaEventTimeoutTriggered = ref(false)
    const activeRequest = ref<AbortController | undefined>(undefined)
    const retryCount = ref(0)

    function beginRequest(): AbortSignal {
        activeRequest.value?.abort()
        const controller = new AbortController()
        activeRequest.value = controller
        return controller.signal
    }

    function cancelRequest(): void {
        activeRequest.value?.abort()
        activeRequest.value = undefined
    }

    function markRetry(): number {
        retryCount.value += 1
        return retryCount.value
    }

    function resetRetry(): void {
        retryCount.value = 0
    }

    function reset(): void {
        if (metaEventWatchTimer.value) clearTimeout(metaEventWatchTimer.value)
        cancelRequest()
        metaEventWatchTimer.value = undefined
        metaEventTimeoutTriggered.value = false
        heartbeatTime.value = -1
        oldHeartbeatTime.value = -1
        lastHeartbeatTime.value = -1
        backTimes.value = 0
        resetRetry()
    }

    return {
        heartbeatTime,
        oldHeartbeatTime,
        lastHeartbeatTime,
        backTimes,
        metaEventWatchTimer,
        metaEventTimeoutTriggered,
        activeRequest,
        beginRequest,
        cancelRequest,
        retryCount,
        markRetry,
        resetRetry,
        reset,
    }
})
