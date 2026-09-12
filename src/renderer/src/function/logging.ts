const SENSITIVE_KEYS = /token|access_token|authorization|cookie|password|message|user_id|group_id|self_id|target_id|operator_id|message_id|uin|qq|path|url|endpoint|origin|href/i

/** Redact private protocol and network fields before values reach a logger. */
export function redactLogValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(redactLogValue)
    if (typeof value !== 'object' || value === null) return value
    const result: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value)) {
        result[key] = SENSITIVE_KEYS.test(key) ? '[redacted]' : redactLogValue(nested)
    }
    return result
}
