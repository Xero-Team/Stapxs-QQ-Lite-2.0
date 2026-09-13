import Dexie, { type Table } from 'dexie'
import { z } from 'zod'

export interface LocalStoreRecord {
    id?: number
    namespace: string
    key: string
    value: unknown
    updatedAt: number
}

export const STORAGE_META_NAMESPACE = '_meta'
export const STORAGE_BUILD_ID_KEY = 'buildId'
export const STORAGE_ASSET_DB_NAME = 'ssqq-local-assets'

class LocalStoreDatabase extends Dexie {
    records!: Table<LocalStoreRecord, number>

    constructor() {
        super('xero-qq-lite-local')
        this.version(1).stores({ records: '++id, [namespace+key], namespace, updatedAt' })
    }
}

export const localStoreDb = new LocalStoreDatabase()

export function currentStorageBuildId(): string {
    const buildId = (import.meta as { env?: { VITE_STORAGE_BUILD_ID?: string } }).env?.VITE_STORAGE_BUILD_ID
    return typeof buildId === 'string' && buildId.length > 0 ? buildId : 'dev'
}

export function shouldResetLocalStore(storedBuildId: unknown, buildId: string): boolean {
    return storedBuildId !== buildId
}

function deleteIndexedDb(name: string): Promise<void> {
    if (typeof indexedDB === 'undefined') return Promise.resolve()
    return new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(name)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
    })
}

async function latestRecord(namespace: string, key: string): Promise<LocalStoreRecord | undefined> {
    const records = await localStoreDb.records.where('[namespace+key]').equals([namespace, key]).sortBy('updatedAt')
    return records.at(-1)
}

async function putRecord(record: LocalStoreRecord): Promise<void> {
    const existing = await latestRecord(record.namespace, record.key)
    await localStoreDb.records.put({
        ...record,
        ...(existing?.id === undefined ? {} : { id: existing.id }),
    })
}

export async function setLocalValue(namespace: string, key: string, value: unknown): Promise<void> {
    await localStoreDb.transaction('rw', localStoreDb.records, async () => {
        await putRecord({ namespace, key, value, updatedAt: Date.now() })
    })
}

export async function getLocalValue<T>(namespace: string, key: string): Promise<T | undefined> {
    const record = await latestRecord(namespace, key)
    return record?.value as T | undefined
}

export async function prepareLocalStore(): Promise<boolean> {
    const buildId = currentStorageBuildId()
    let stored: unknown
    try {
        stored = await getLocalValue<string>(STORAGE_META_NAMESPACE, STORAGE_BUILD_ID_KEY)
    } catch {
        localStoreDb.close()
        await deleteIndexedDb(localStoreDb.name)
        await localStoreDb.open()
        stored = undefined
    }
    if (!shouldResetLocalStore(stored, buildId)) return false
    await localStoreDb.records.clear()
    await deleteIndexedDb(STORAGE_ASSET_DB_NAME)
    await setLocalValue(STORAGE_META_NAMESPACE, STORAGE_BUILD_ID_KEY, buildId)
    return true
}

export async function exportLocalData(): Promise<LocalStoreRecord[]> {
    return localStoreDb.records.toArray()
}

const ImportRecordSchema = z.object({
    namespace: z.string().max(128),
    key: z.string().max(512),
    value: z.unknown(),
    updatedAt: z.number().finite(),
})
const ImportSchema = z.array(ImportRecordSchema)

export async function importLocalData(input: unknown, replace = false): Promise<number> {
    const parsed = ImportSchema.safeParse(input)
    if (!parsed.success) {
        throw new TypeError('Invalid local data export')
    }
    const records = new Map<string, LocalStoreRecord>()
    for (const record of parsed.data) {
        if (record.namespace === STORAGE_META_NAMESPACE && record.key === STORAGE_BUILD_ID_KEY) continue
        const key = JSON.stringify([record.namespace, record.key])
        const previous = records.get(key)
        if (!previous || record.updatedAt >= previous.updatedAt) {
            records.set(key, { namespace: record.namespace, key: record.key, value: record.value, updatedAt: record.updatedAt })
        }
    }
    await localStoreDb.transaction('rw', localStoreDb.records, async () => {
        if (replace) await localStoreDb.records.clear()
        for (const record of records.values()) {
            const existing = await latestRecord(record.namespace, record.key)
            if (!existing || record.updatedAt >= existing.updatedAt) await putRecord(record)
        }
        await putRecord({
            namespace: STORAGE_META_NAMESPACE,
            key: STORAGE_BUILD_ID_KEY,
            value: currentStorageBuildId(),
            updatedAt: Date.now(),
        })
    })
    return records.size
}

export async function clearLocalData(namespace?: string): Promise<void> {
    if (namespace === undefined) {
        await localStoreDb.records.clear()
        await deleteIndexedDb(STORAGE_ASSET_DB_NAME)
        await setLocalValue(STORAGE_META_NAMESPACE, STORAGE_BUILD_ID_KEY, currentStorageBuildId())
        return
    }
    await localStoreDb.records.where('namespace').equals(namespace).delete()
}

export async function exportLocalDataJson(): Promise<string> {
    return JSON.stringify(await exportLocalData())
}
