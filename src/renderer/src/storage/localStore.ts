import Dexie, { type Table } from 'dexie'

export interface LocalStoreRecord {
    id?: number
    namespace: string
    key: string
    value: unknown
    updatedAt: number
}

class LocalStoreDatabase extends Dexie {
    records!: Table<LocalStoreRecord, number>

    constructor() {
        super('xero-qq-lite-local')
        this.version(1).stores({ records: '++id, [namespace+key], namespace, updatedAt' })
    }
}

export const localStoreDb = new LocalStoreDatabase()

export async function setLocalValue(namespace: string, key: string, value: unknown): Promise<void> {
    const existing = await localStoreDb.records.where('[namespace+key]').equals([namespace, key]).first()
    const record: LocalStoreRecord = { id: existing?.id, namespace, key, value, updatedAt: Date.now() }
    await localStoreDb.records.put(record)
}

export async function getLocalValue<T>(namespace: string, key: string): Promise<T | undefined> {
    const record = await localStoreDb.records.where('[namespace+key]').equals([namespace, key]).first()
    return record?.value as T | undefined
}

export async function exportLocalData(): Promise<LocalStoreRecord[]> {
    return localStoreDb.records.toArray()
}

export async function clearLocalData(namespace?: string): Promise<void> {
    if (namespace === undefined) {
        await localStoreDb.records.clear()
        return
    }
    await localStoreDb.records.where('namespace').equals(namespace).delete()
}

/** Copy legacy localStorage values once; source data is retained for rollback. */
export async function migrateLegacyLocalStorage(namespace = 'legacy-localstorage'): Promise<number> {
    if (typeof globalThis.localStorage === 'undefined') return 0
    const marker = `${namespace}:migration-v1`
    if (await getLocalValue<boolean>(namespace, marker)) return 0
    let migrated = 0
    for (let index = 0; index < globalThis.localStorage.length; index++) {
        const key = globalThis.localStorage.key(index)
        if (!key || key === marker) continue
        const raw = globalThis.localStorage.getItem(key)
        if (raw === null) continue
        let value: unknown = raw
        try { value = JSON.parse(raw) as unknown } catch { /* retain string values */ }
        await setLocalValue(namespace, key, value)
        migrated++
    }
    await setLocalValue(namespace, marker, true)
    return migrated
}

export async function exportLocalDataJson(): Promise<string> {
    return JSON.stringify(await exportLocalData())
}
