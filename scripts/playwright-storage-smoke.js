// Native IndexedDB migration/rollback contracts. All records and contexts are disposable.
async (page) => {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block' })
    try {
        const storagePage = await context.newPage()
        await storagePage.goto(page.url())
        const result = await storagePage.evaluate(async () => {
            const db = await import('/storage.ts')
            const assert = (condition, label) => { if (!condition) throw new Error(label) }
            const scenarios = []
            await db.clearLocalData()
            await Promise.all(Array.from({ length: 20 }, (_, value) => db.setLocalValue('settings', 'same', value)))
            assert((await db.exportLocalData()).length === 1, 'Concurrent writes produced duplicate keys')
            scenarios.push('concurrent-upsert')

            const initial = await db.exportLocalData()
            const initialRow = initial[0]
            const newer = { namespace: 'settings', key: 'same', value: 'newer', updatedAt: initialRow.updatedAt + 1 }
            await db.importLocalData([newer])
            await db.importLocalData([newer])
            await db.importLocalData([{ ...newer, value: 'stale', updatedAt: 1 }])
            assert(await db.getLocalValue('settings', 'same') === 'newer', 'Merge replaced new data with stale backup')
            assert((await db.exportLocalData()).length === 1, 'Repeated import appended duplicate keys')
            scenarios.push('repeat-import', 'newest-merge')

            await db.importLocalData([
                { namespace: 'a\u0000b', key: 'c', value: 1, updatedAt: 1 },
                { namespace: 'a', key: 'b\u0000c', value: 2, updatedAt: 1 },
            ])
            assert(await db.getLocalValue('a\u0000b', 'c') === 1 && await db.getLocalValue('a', 'b\u0000c') === 2, 'Compound identities collided')
            scenarios.push('compound-key')
            const backup = await db.exportLocalDataJson()
            let failed = false
            try { await db.importLocalData([{ namespace: 12, key: 'bad' }], true) } catch { failed = true }
            assert(failed && await db.exportLocalDataJson() === backup, 'Invalid replacement modified data')
            failed = false
            try {
                await db.importLocalData([
                    { namespace: 'settings', key: 'partial', value: 1, updatedAt: 1 },
                    { namespace: 'settings', key: 'cannot-clone', value: () => 1, updatedAt: 1 },
                ], true)
            } catch { failed = true }
            assert(failed && await db.exportLocalDataJson() === backup, 'Write failure did not roll back replacement')
            scenarios.push('invalid-restore', 'transaction-rollback')
            await db.clearLocalData()
            await db.importLocalData(JSON.parse(backup), true)
            assert(await db.getLocalValue('settings', 'same') === 'newer', 'Export could not restore data')
            scenarios.push('export-clear-restore')

            localStorage.clear()
            localStorage.setItem('options', 'raw & values')
            localStorage.setItem('history', JSON.stringify([{ id: 1, text: 'Synthetic' }]))
            localStorage.setItem('newer', 'older localStorage value')
            await db.setLocalValue('migration-test', 'newer', 'existing Dexie value')
            const beforeMigration = await db.exportLocalDataJson()
            const simulateFullDisk = (_key, record) => {
                if (record.key === 'history') throw new Error('Synthetic quota failure')
            }
            db.localStoreDb.records.hook('creating', simulateFullDisk)
            failed = false
            try { await db.migrateLegacyLocalStorage('migration-test') } catch { failed = true }
            finally { db.localStoreDb.records.hook('creating').unsubscribe(simulateFullDisk) }
            assert(failed && await db.exportLocalDataJson() === beforeMigration, 'Failed migration left partial rows or a marker')
            scenarios.push('migration-rollback')
            const migrated = await db.migrateLegacyLocalStorage('migration-test')
            assert(migrated === 3, 'Legacy snapshot was incomplete')
            assert(await db.getLocalValue('migration-test', 'newer') === 'existing Dexie value', 'Migration overwrote existing Dexie record')
            assert(await db.getLocalValue('migration-test', 'options') === 'raw & values', 'Legacy strings changed')
            assert((await db.getLocalValue('migration-test', 'history'))[0].id === 1, 'Legacy JSON was not migrated')
            assert(await db.migrateLegacyLocalStorage('migration-test') === 0, 'Migration marker did not prevent rerun')
            assert(localStorage.getItem('options') === 'raw & values' && localStorage.length === 3, 'Rollback source was modified')
            scenarios.push('legacy-migration')
            db.localStoreDb.close()
            await db.localStoreDb.open()
            assert(await db.getLocalValue('migration-test', 'options') === 'raw & values', 'Data did not survive database reopen')
            await db.clearLocalData('migration-test')
            assert(await db.getLocalValue('settings', 'same') === 'newer', 'Namespace clear removed unrelated data')
            scenarios.push('reopen-namespace-clear')
            await db.localStoreDb.records.bulkAdd([
                { namespace: 'old-duplicates', key: 'x', value: 'latest', updatedAt: 20 },
                { namespace: 'old-duplicates', key: 'x', value: 'older', updatedAt: 10 },
            ])
            assert(await db.getLocalValue('old-duplicates', 'x') === 'latest', 'Older duplicate masked the newest record')
            assert((await db.exportLocalData()).filter((row) => row.namespace === 'old-duplicates').length === 2, 'Existing duplicate values were silently deleted')
            scenarios.push('legacy-duplicate-read-export')
            return { passed: true, scenarios }
        })
        return result
    } finally {
        await context.close()
    }
}
