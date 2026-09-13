// Native IndexedDB contracts. All records and contexts are disposable.
async (page) => {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block' })
    try {
        const storagePage = await context.newPage()
        await storagePage.goto(page.url())
        const result = await storagePage.evaluate(async () => {
            const db = await import('/storage.ts')
            const assert = (condition, label) => { if (!condition) throw new Error(label) }
            const countNamespace = async (namespace) =>
                (await db.exportLocalData()).filter((row) => row.namespace === namespace).length
            const scenarios = []
            await db.clearLocalData()
            await Promise.all(Array.from({ length: 20 }, (_, value) => db.setLocalValue('settings', 'same', value)))
            assert(await countNamespace('settings') === 1, 'Concurrent writes produced duplicate keys')
            scenarios.push('concurrent-upsert')

            const initial = await db.exportLocalData()
            const initialRow = initial.find((row) => row.namespace === 'settings' && row.key === 'same')
            const newer = { namespace: 'settings', key: 'same', value: 'newer', updatedAt: initialRow.updatedAt + 1 }
            await db.importLocalData([newer])
            await db.importLocalData([newer])
            await db.importLocalData([{ ...newer, value: 'stale', updatedAt: 1 }])
            assert(await db.getLocalValue('settings', 'same') === 'newer', 'Merge replaced new data with stale backup')
            assert(await countNamespace('settings') === 1, 'Repeated import appended duplicate keys')
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

            await db.setLocalValue('settings', 'keep', 'value')
            await db.setLocalValue(db.STORAGE_META_NAMESPACE, db.STORAGE_BUILD_ID_KEY, 'stale-build')
            const wiped = await db.prepareLocalStore()
            assert(wiped === true, 'Mismatched build id did not reset')
            assert(await db.getLocalValue('settings', 'keep') === undefined, 'Stale records survived a build-id reset')
            assert(await db.getLocalValue(db.STORAGE_META_NAMESPACE, db.STORAGE_BUILD_ID_KEY) === db.currentStorageBuildId(), 'Build id was not rewritten')
            assert(await db.prepareLocalStore() === false, 'Matching build id still reset the store')
            scenarios.push('build-id-reset')

            await db.setLocalValue('settings', 'same', 'newer')
            db.localStoreDb.close()
            await db.localStoreDb.open()
            assert(await db.getLocalValue('settings', 'same') === 'newer', 'Data did not survive database reopen')
            await db.clearLocalData('settings')
            assert(await db.getLocalValue(db.STORAGE_META_NAMESPACE, db.STORAGE_BUILD_ID_KEY) === db.currentStorageBuildId(), 'Namespace clear removed metadata')
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
