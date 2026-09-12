/** Pure OneBot message helpers. These functions do not depend on the DOM or stores. */

export interface CqMessageSegment {
    type: string
    data: Record<string, string>
}

export interface ParsedCqMessage {
    segments: CqMessageSegment[]
    reply?: { user_id?: string; seq?: string; message?: string }
}

const CQ_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    ',': '&#44;',
    '[': '&#91;',
    ']': '&#93;',
}

const CQ_UNESCAPES: Record<string, string> = {
    '&amp;': '&',
    '&#44;': ',',
    '&#91;': '[',
    '&#93;': ']',
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
}

function escapeCq(value: string): string {
    return value.replace(/[&,\u005B\u005D]/g, (character) => CQ_ESCAPES[character] ?? character)
}

function unescapeCq(value: string): string {
    return value.replace(/&(?:amp|apos|lt|gt|quot|#39|#44|#91|#93);/g, (entity) => CQ_UNESCAPES[entity] ?? entity)
}

/** Convert an array message into OneBot's legacy CQ representation. */
export function serializeCqSegments(segments: readonly CqMessageSegment[]): string {
    return segments.map((segment) => {
        if (segment.type === 'text') return segment.data.text ?? ''
        const fields = Object.entries(segment.data)
            .map(([key, value]) => `${key}=${escapeCq(String(value))}`)
            .join(',')
        return `[CQ:${segment.type}${fields ? `,${fields}` : ''}]`
    }).join('')
}

function parseFields(input: string): Record<string, string> {
    const result: Record<string, string> = {}
    for (const field of input.split(',')) {
        const separator = field.indexOf('=')
        if (separator <= 0) continue
        result[field.slice(0, separator)] = unescapeCq(field.slice(separator + 1))
    }
    return result
}

/** Parse legacy CQ text without requiring a browser document. */
export function parseCqText(raw: string): ParsedCqMessage {
    const segments: CqMessageSegment[] = []
    let reply: ParsedCqMessage['reply']
    const pattern = /\[CQ:([^,\]]+)(?:,([^\]]*))?\]/g
    let cursor = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(raw)) !== null) {
        if (match.index > cursor) {
            segments.push({ type: 'text', data: { text: raw.slice(cursor, match.index).replaceAll('\\n', '\n') } })
        }
        const type = match[1]
        if (type === undefined) continue
        const data = parseFields(match[2] ?? '')
        if (type === 'reply') reply = {
            ...(data.user_id === undefined ? {} : { user_id: data.user_id }),
            ...(data.seq === undefined ? {} : { seq: data.seq }),
            ...(data.message === undefined ? {} : { message: data.message }),
        }
        else if (type === 'text') segments.push({ type, data: { ...data, text: unescapeCq(data.text ?? '') } })
        else segments.push({ type, data })
        cursor = pattern.lastIndex
    }
    if (cursor < raw.length || segments.length === 0) {
        segments.push({ type: 'text', data: { text: raw.slice(cursor).replaceAll('\\n', '\n') } })
    }
    return reply === undefined ? { segments } : { segments, reply }
}

/** Resolve OneBot image/file values to a displayable URL. */
export function resolveMediaUrl(file: unknown): string | undefined {
    if (typeof file !== 'string' || file.length === 0) return undefined
    if (file.startsWith('base64://')) return `data:image/png;base64,${file.slice('base64://'.length)}`
    if (/^(?:https?|data|file|blob):/i.test(file)) return file
    return file
}

/** Extract nested forward message nodes from common OneBot response shapes. */
export function extractForwardMessages(input: unknown): unknown[] {
    if (Array.isArray(input)) return input.flatMap((item) => extractForwardMessages(item))
    if (!input || typeof input !== 'object') return []
    const value = input as Record<string, unknown>
    for (const key of ['messages', 'message', 'content', 'data']) {
        const child = value[key]
        if (Array.isArray(child)) return child
        if (child && typeof child === 'object') {
            const nested = extractForwardMessages(child)
            if (nested.length > 0) return nested
        }
    }
    return []
}
