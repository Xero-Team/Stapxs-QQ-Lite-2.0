import { describe, expect, it } from 'vitest'
import { importLocalData } from '../src/renderer/src/storage/localStore'

describe('local storage migration contracts', () => {
    it('rejects malformed exports before opening a write transaction', async () => {
        await expect(importLocalData([{ namespace: 'settings', key: 'x', updatedAt: 'later' }]))
            .rejects.toThrow('Invalid local data export')
    })

    it('rejects oversized keys and namespaces', async () => {
        await expect(importLocalData([{ namespace: 'x'.repeat(129), key: 'x', updatedAt: 1 }]))
            .rejects.toThrow('Invalid local data export')
    })
})
