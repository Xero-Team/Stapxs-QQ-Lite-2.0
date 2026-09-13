export type MessagePayload = Record<string, unknown>

function asMessagePayload(value: unknown): MessagePayload | undefined {
    return typeof value === 'object' && value !== null ? value as MessagePayload : undefined
}

export function normalizeMessageId(id: unknown): string {
    if (id === null || id === undefined) return ''
    return String(id)
}

function getMessageTimestamp(msg: MessagePayload): number {
    const timestamp = Number(msg.time)
    return Number.isFinite(timestamp) ? timestamp : 0
}

function buildFallbackMessageKey(msg: MessagePayload): string {
    const seq = msg.message_seq ?? msg.seq_id ?? msg.seq ?? ''
    const senderInfo = asMessagePayload(msg.sender)
    const sender = senderInfo?.user_id ?? msg.user_id ?? msg.sender_id ?? ''
    return `${getMessageTimestamp(msg)}|${sender}|${seq}`
}

function compareMessageOrder(a: MessagePayload, b: MessagePayload): number {
    const ta = getMessageTimestamp(a)
    const tb = getMessageTimestamp(b)
    if (ta !== tb) return ta - tb

    const sa = Number(a.message_seq ?? a.seq_id ?? a.seq)
    const sb = Number(b.message_seq ?? b.seq_id ?? b.seq)
    if (Number.isFinite(sa) && Number.isFinite(sb) && sa !== sb) return sa - sb

    const ia = normalizeMessageId(a.message_id)
    const ib = normalizeMessageId(b.message_id)
    if (ia === ib) return 0
    return ia.localeCompare(ib)
}

export function getImageSegments(msg: MessagePayload): MessagePayload[] {
    if (!Array.isArray(msg.message)) return []
    return msg.message
        .map(asMessagePayload)
        .filter((segment): segment is MessagePayload => segment?.type === 'image')
}

export function hasImageMessage(msg: MessagePayload): boolean {
    return getImageSegments(msg).length > 0
}

export function hasResolvableImageSource(msg: MessagePayload): boolean {
    const images = getImageSegments(msg)
    if (images.length === 0) return false
    return images.every((segment) => {
        const url = typeof segment.url === 'string' ? segment.url : ''
        const file = typeof segment.file === 'string' ? segment.file : ''
        return url.length > 0 || file.length > 0
    })
}

export type DuplicateMessageReplacer = (existing: MessagePayload, incoming: MessagePayload) => boolean

export function mergeMessagesByIdAndTime(
    current: MessagePayload[],
    incoming: MessagePayload[],
    shouldReplaceDuplicateMessage: DuplicateMessageReplacer,
): MessagePayload[] {
    if (incoming.length === 0) return [...current]
    if (current.length === 0) {
        const firstPass = [...incoming]
        firstPass.sort(compareMessageOrder)
        return firstPass
    }

    const idSet = new Set<string>()
    const idIndexMap = new Map<string, number>()
    const fallbackSet = new Set<string>()
    const merged: MessagePayload[] = []

    for (const msg of current) {
        merged.push(msg)
        const id = normalizeMessageId(msg.message_id)
        if (id) {
            idSet.add(id)
            idIndexMap.set(id, merged.length - 1)
        } else {
            fallbackSet.add(buildFallbackMessageKey(msg))
        }
    }

    for (const msg of incoming) {
        const id = normalizeMessageId(msg.message_id)
        if (id) {
            if (idSet.has(id)) {
                const index = idIndexMap.get(id)
                const existing = index === undefined ? undefined : merged[index]
                if (index !== undefined && existing && shouldReplaceDuplicateMessage(existing, msg)) {
                    merged[index] = msg
                }
                continue
            }
            idSet.add(id)
            merged.push(msg)
            idIndexMap.set(id, merged.length - 1)
            continue
        }

        const fallbackKey = buildFallbackMessageKey(msg)
        if (fallbackSet.has(fallbackKey)) continue
        fallbackSet.add(fallbackKey)
        merged.push(msg)
    }

    merged.sort(compareMessageOrder)
    return merged
}
