import { z } from 'zod'

/**
 * The mapping files intentionally allow protocol-specific keys. The loader
 * validates the stable discriminator and keeps the extension fields opaque
 * until a caller applies the mapping for a particular API.
 */
const JsonPathMapSchema = z.object({
    name: z.string().min(1),
}).passthrough()

export interface JsonPathMapEntry extends Record<string, unknown> {
    name: string
    private_name?: string
    source?: string
    type?: string
    order?: string
    pagerType?: string
    message_type: Record<string, string>
    file_url?: string
    list?: Record<string, string | null>
    name_group_send?: string
    name_temp_send?: string
    name_user_send?: string
}

export interface JsonPathMap extends Record<string, JsonPathMapEntry | string | undefined> {
    name: string
    version_info: string
    login_info: JsonPathMapEntry
    user_list: JsonPathMapEntry
    roaming_stamp: JsonPathMapEntry
    message_list: JsonPathMapEntry
    forward_msg: JsonPathMapEntry
    message_info: JsonPathMapEntry
    get_message: JsonPathMapEntry
    message_value: JsonPathMapEntry
    friend_list: JsonPathMapEntry
    group_list: JsonPathMapEntry
    friend_info: JsonPathMapEntry
    group_member_info: JsonPathMapEntry
    group_notices: JsonPathMapEntry
    group_files: JsonPathMapEntry
    group_folder_files: JsonPathMapEntry
    group_essence: JsonPathMapEntry
    file_download: JsonPathMapEntry
    set_message_read: JsonPathMapEntry
    send_respond: JsonPathMapEntry
    recent_contact: JsonPathMapEntry
    poke: JsonPathMapEntry
    friend_category: JsonPathMapEntry
    get_qzone_feed: JsonPathMapEntry
    get_qzone_msg: JsonPathMapEntry
    send_qzone_msg: JsonPathMapEntry
    comment_qzone: JsonPathMapEntry
    delete_qzone_msg: JsonPathMapEntry
    leave_group: JsonPathMapEntry
    set_group_nickname: JsonPathMapEntry
    set_group_title: JsonPathMapEntry
    ban_mumber: JsonPathMapEntry
    set_group_name: JsonPathMapEntry
    delete_msg: JsonPathMapEntry
    get_record: JsonPathMapEntry
}

export function createEmptyJsonPathMap(): JsonPathMap {
    return {} as JsonPathMap
}

export function normalizeJsonPathMap(value: unknown): JsonPathMap | undefined {
    const result = JsonPathMapSchema.safeParse(value)
    return result.success ? result.data as JsonPathMap : undefined
}

export function getJsonPathEntry(map: JsonPathMap, key: string): JsonPathMapEntry | undefined {
    const value = map[key]
    return typeof value === 'object' && value !== null
        && typeof value.name === 'string' ? value as JsonPathMapEntry : undefined
}
