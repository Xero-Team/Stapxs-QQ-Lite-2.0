import { getLocalValue, setLocalValue } from '../storage'

export interface NetworkAuditEntry {
    at: number
    purpose: string
    origin: string
}

const AUDIT_NAMESPACE = 'network'
const AUDIT_KEY = 'audit'
const MAX_ENTRIES = 100

let auditCache: NetworkAuditEntry[] = []

function isAuditEntry(value: unknown): value is NetworkAuditEntry {
    if (typeof value !== 'object' || value === null) return false
    const entry = value as Partial<NetworkAuditEntry>
    return typeof entry.at === 'number' && typeof entry.purpose === 'string' && typeof entry.origin === 'string'
}

export async function hydrateNetworkAudit(): Promise<void> {
    try {
        const stored = await getLocalValue<unknown>(AUDIT_NAMESPACE, AUDIT_KEY)
        auditCache = Array.isArray(stored) ? stored.filter(isAuditEntry) : []
    } catch {
        auditCache = []
    }
}

export function isExternalRequestAllowed(url: string, enabled: unknown): boolean {
    if (enabled !== true) return false
    try {
        const parsed = new URL(url, globalThis.location?.origin ?? 'http://localhost')
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

export function isSafeExternalUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
            && parsed.username === '' && parsed.password === ''
    } catch {
        return false
    }
}

export function auditExternalRequest(url: string, purpose: string): void {
    try {
        const parsed = new URL(url, globalThis.location?.origin ?? 'http://localhost')
        const entry: NetworkAuditEntry = { at: Date.now(), purpose, origin: parsed.origin }
        auditCache = [...auditCache.filter(isAuditEntry), entry].slice(-MAX_ENTRIES)
        void setLocalValue(AUDIT_NAMESPACE, AUDIT_KEY, auditCache).catch(() => undefined)
    } catch {
        // Auditing must never break an explicitly enabled external feature.
    }
}

export function readNetworkAudit(): NetworkAuditEntry[] {
    return auditCache
}

export function clearNetworkAudit(): void {
    auditCache = []
    void setLocalValue(AUDIT_NAMESPACE, AUDIT_KEY, auditCache).catch(() => undefined)
}
