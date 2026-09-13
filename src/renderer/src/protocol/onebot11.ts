import { z } from 'zod'

/** OneBot 11 message segment. Unknown extensions remain forward compatible. */
export const MessageSegmentSchema = z.object({
    type: z.string().min(1),
    data: z.record(z.string(), z.unknown()).default({}),
})

export const OneBotEventSchema = z.object({
    time: z.coerce.number().nonnegative().optional(),
    self_id: z.union([z.number(), z.string()]).optional(),
    post_type: z.string().min(1),
}).passthrough()

export const OneBotApiResponseSchema = z.object({
    status: z.union([z.literal('ok'), z.literal('failed'), z.literal('async'), z.string()]).optional(),
    retcode: z.coerce.number().optional(),
    data: z.unknown().optional(),
    message: z.string().optional(),
    wording: z.string().optional(),
    echo: z.union([z.string(), z.number()]).optional(),
}).passthrough()

export type MessageSegment = z.infer<typeof MessageSegmentSchema>
export type OneBotEvent = z.infer<typeof OneBotEventSchema>
export type OneBotApiResponse = z.infer<typeof OneBotApiResponseSchema>

export function parseOneBotEvent(input: unknown): OneBotEvent {
    return OneBotEventSchema.parse(input)
}

export function parseOneBotApiResponse(input: unknown): OneBotApiResponse {
    return OneBotApiResponseSchema.parse(input)
}

export type OneBotPayloadKind = 'event' | 'api' | 'unknown'

export function classifyOneBotPayload(input: unknown): OneBotPayloadKind {
    if (typeof input !== 'object' || input === null) return 'unknown'
    const data = input as Record<string, unknown>
    if (typeof data.post_type === 'string' && data.post_type !== '') return 'event'
    if ('retcode' in data || typeof data.echo === 'string' || typeof data.echo === 'number'
        || data.status === 'ok' || data.status === 'failed' || data.status === 'async') {
        return 'api'
    }
    return 'unknown'
}

export function inspectOneBotPayload(input: unknown): { kind: OneBotPayloadKind; ok: boolean } {
    const kind = classifyOneBotPayload(input)
    if (kind === 'event') return { kind, ok: OneBotEventSchema.safeParse(input).success }
    if (kind === 'api') return { kind, ok: OneBotApiResponseSchema.safeParse(input).success }
    return { kind, ok: false }
}
