const MAX_EXTERNAL_URL_LENGTH = 2000

/** Parse an IPC supplied URL while allowing only network navigation targets. */
export function parseExternalUrl(value: unknown): URL | null {
    if (typeof value !== 'string' || value.length === 0 || value.length > MAX_EXTERNAL_URL_LENGTH) return null
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
    } catch {
        return null
    }
}
