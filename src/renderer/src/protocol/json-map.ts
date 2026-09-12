import { z } from 'zod'

/**
 * The mapping files intentionally allow protocol-specific keys. The loader
 * validates the stable discriminator and keeps the extension fields opaque
 * until a caller applies the mapping for a particular API.
 */
const JsonPathMapSchema = z.object({
    name: z.string().min(1),
}).passthrough()

export type JsonPathMap = z.infer<typeof JsonPathMapSchema>

export function normalizeJsonPathMap(value: unknown): JsonPathMap | undefined {
    const result = JsonPathMapSchema.safeParse(value)
    return result.success ? result.data : undefined
}
