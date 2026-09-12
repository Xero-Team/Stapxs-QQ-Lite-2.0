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

function isRecord(value: unknown): value is LocalStoreRecord {
    if (typeof value !== 'object' || value === null) return false
    const candidate = value as Partial<LocalStoreRecord>
    return typeof candidate.namespace === 'string'
        && candidate.namespace.length <= 128
        && typeof candidate.key === 'string'
        && candidate.key.length <= 512
        && typeof candidate.updatedAt === 'number'
        && Number.isFinite(candidate.updatedAt)
}

/**
 * Restore an export created by exportLocalData/exportLocalDataJson.
 * Invalid records are rejected before the transaction starts so a partial
 * restore cannot leave the database in an unknown state.
 */
export async function importLocalData(input: unknown, replace = false): Promise<number> {
    if (!Array.isArray(input) || !input.every(isRecord)) {
        throw new TypeError('Invalid local data export')
    }
    const records = new Map<string, LocalStoreRecord>()
    for (const record of input) {
        const key = `${record.namespace}\u0000${record.key}`
        const previous = records.get(key)
        if (!previous || record.updatedAt >= previous.updatedAt) {
            records.set(key, { namespace: record.namespace, key: record.key, value: record.value, updatedAt: record.updatedAt })
        }
    }
    await localStoreDb.transaction('rw', localStoreDb.records, async () => {
        if (replace) await localStoreDb.records.clear()
        await localStoreDb.records.bulkPut([...records.values()])
    })
    return records.size
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
