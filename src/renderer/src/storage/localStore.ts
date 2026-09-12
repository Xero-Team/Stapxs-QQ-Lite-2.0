import Dexie, { type Table } from 'dexie'
import { z } from 'zod'

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

async function latestRecord(namespace: string, key: string): Promise<LocalStoreRecord | undefined> {
    // Older releases could create duplicate compound keys. Keep those rows exportable,
    // but always read the newest value instead of whichever primary key sorts first.
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

/**
 * Restore an export created by exportLocalData/exportLocalDataJson.
 * Invalid records are rejected before the transaction starts so a partial
 * restore cannot leave the database in an unknown state.
 */
export async function importLocalData(input: unknown, replace = false): Promise<number> {
    const parsed = ImportSchema.safeParse(input)
    if (!parsed.success) {
        throw new TypeError('Invalid local data export')
    }
    const records = new Map<string, LocalStoreRecord>()
    for (const record of parsed.data) {
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
    const snapshot: Array<{ key: string; value: unknown }> = []
    for (let index = 0; index < globalThis.localStorage.length; index++) {
        const key = globalThis.localStorage.key(index)
        if (key === null || key === marker) continue
        const raw = globalThis.localStorage.getItem(key)
        if (raw === null) continue
        let value: unknown = raw
        try { value = JSON.parse(raw) as unknown } catch { /* retain string values */ }
        snapshot.push({ key, value })
    }
    return localStoreDb.transaction('rw', localStoreDb.records, async () => {
        // Another tab may have completed migration while the snapshot was read.
        if (await getLocalValue<boolean>(namespace, marker)) return 0
        for (const { key, value } of snapshot) {
            // A resumed migration must not overwrite newer data already in Dexie.
            if (!await latestRecord(namespace, key)) {
                await putRecord({ namespace, key, value, updatedAt: Date.now() })
            }
        }
        await putRecord({ namespace, key: marker, value: true, updatedAt: Date.now() })
        return snapshot.length
    })
}

export async function exportLocalDataJson(): Promise<string> {
    return JSON.stringify(await exportLocalData())
}
