import { z } from 'zod'

/** OneBot 11 message segment. Unknown extensions remain forward compatible. */
export const MessageSegmentSchema = z.object({
    type: z.string().min(1),
    data: z.record(z.string(), z.unknown()).default({}),
})

export const OneBotEventSchema = z.object({
    time: z.number().int().nonnegative(),
    self_id: z.union([z.number().int(), z.string()]),
    post_type: z.string().min(1),
}).passthrough()

export const OneBotApiResponseSchema = z.object({
    status: z.enum(['ok', 'failed']),
    retcode: z.number().int(),
    data: z.unknown().optional(),
    message: z.string().optional(),
    wording: z.string().optional(),
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
