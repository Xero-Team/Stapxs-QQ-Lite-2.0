import { z } from 'zod'

// JSONPath preserves OneBot's numeric IDs; state and connection history use strings.
const AccountIdSchema = z.union([
    z.number().int().nonnegative(),
    z.string().regex(/^\d+$/),
]).transform(String)

const LoginInfoSchema = z.object({
    uin: AccountIdSchema,
    nickname: z.string(),
}).passthrough()

const VersionInfoSchema = z.object({
    app_name: z.string().optional(),
    app_version: z.string().optional(),
}).passthrough()

export type LoginInfo = z.infer<typeof LoginInfoSchema>
export type VersionInfo = z.infer<typeof VersionInfoSchema>

/** Validate mapped login data without exposing response values in diagnostics. */
export function normalizeLoginInfo(input: unknown): LoginInfo | undefined {
    const result = LoginInfoSchema.safeParse(input)
    return result.success ? result.data : undefined
}

export function normalizeVersionInfo(input: unknown): VersionInfo | undefined {
    const result = VersionInfoSchema.safeParse(input)
    return result.success ? result.data : undefined
}
