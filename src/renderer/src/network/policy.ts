export interface NetworkAuditEntry {
    at: number
    purpose: string
    origin: string
}

const AUDIT_KEY = 'xero-qq-lite:network-audit'
const MAX_ENTRIES = 100

/** Return true only for explicit user opt-in and web protocols. */
export function isExternalRequestAllowed(url: string, enabled: unknown): boolean {
    if (enabled !== true) return false
    try {
        const parsed = new URL(url, globalThis.location?.origin ?? 'http://localhost')
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

/** Validate URLs before handing them to a browser or native shell. */
export function isSafeExternalUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
            && parsed.username === '' && parsed.password === ''
    } catch {
        return false
    }
}

/** Keep a bounded, local-only audit trail without query strings or request data. */
export function auditExternalRequest(url: string, purpose: string): void {
    try {
        const parsed = new URL(url, globalThis.location?.origin ?? 'http://localhost')
        const entry: NetworkAuditEntry = { at: Date.now(), purpose, origin: parsed.origin }
        const raw = globalThis.localStorage?.getItem(AUDIT_KEY)
        const previous = raw ? JSON.parse(raw) as unknown : []
        const entries = Array.isArray(previous) ? previous.filter(isAuditEntry) : []
        entries.push(entry)
        globalThis.localStorage?.setItem(AUDIT_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
    } catch {
        // Auditing must never break an explicitly enabled external feature.
    }
}

function isAuditEntry(value: unknown): value is NetworkAuditEntry {
    if (typeof value !== 'object' || value === null) return false
    const entry = value as Partial<NetworkAuditEntry>
    return typeof entry.at === 'number' && typeof entry.purpose === 'string' && typeof entry.origin === 'string'
}

export function readNetworkAudit(): NetworkAuditEntry[] {
    try {
        const raw = globalThis.localStorage?.getItem(AUDIT_KEY)
        const parsed = raw ? JSON.parse(raw) as unknown : []
        return Array.isArray(parsed) ? parsed.filter(isAuditEntry) : []
    } catch {
        return []
    }
}

export function clearNetworkAudit(): void {
    try { globalThis.localStorage?.removeItem(AUDIT_KEY) } catch { /* storage unavailable */ }
}
