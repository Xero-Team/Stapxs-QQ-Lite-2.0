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
