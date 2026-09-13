import { PinYinData } from '../utils/pinyin'

export enum BotMsgType {
    CQCode,
    Array
}

export interface ChatInfoElem {
    show: BaseChatInfoElem
    info: {
        group_info: GroupInfoElem
        user_info: UserInfoElem
        me_info: MemberInfoElem
        group_members: GroupMemberInfoElem[]
        /** Legacy OneBot file payload; validated at protocol boundary. */
        group_files: (GroupFileElem & GroupFileFolderElem)[]
        group_sub_files: Record<string, unknown>
        group_notices?: BulletinDataElem[]
        now_member_info?: Record<string, unknown>
        image_list?: { index: number; message_id: string; img_url: string }[]
        jin_info: {
            list: JinMessageElem[]
            is_end?: boolean
            pages: number
        }
    }
}

export interface BulletinDataElem extends Record<string, unknown> {
    time: number
    content: string[]
    sender: number
    img?: { src: string }
    is_read?: boolean
    read_num?: number
}

export interface JinMessageContext {
    type: string
    data: { text?: string; id?: string | number; url?: string }
}

export interface JinMessageElem {
    sender_uin: number
    sender_nick: string
    sender_time: number
    add_digest_nick: string
    msg_content: JinMessageContext[]
}

export interface GroupInfoElem extends Record<string, unknown> {
    gc?: number
}

export interface UserInfoElem extends Record<string, unknown> {
    uin?: number
}

export interface MemberInfoElem extends Record<string, unknown> {
    role?: string
    card?: string
    shut_up_timestamp?: number
}

export interface BaseChatInfoElem {
    type: string
    id: number
    name: string
    avatar: string
    appendInfo?: string | undefined
    jump?: string
    temp?: string | number | undefined
}

export interface UserElem {
    new_msg?: boolean
    raw_msg?: string
    time?: number
    always_top?: boolean
    message_id?: string
    highlight?: string
}

export interface UserFriendElem extends UserElem {
    group_id: number
    group_name: string
    py_name?: PinYinData
    py_start?: string
    member_count?: number
    admin_flag?: boolean
}

export interface UserGroupElem extends UserElem {
    user_id: number
    nickname: string
    remark: string
    raw_msg_base?: string       // 给群收纳箱用的
    py_name?: PinYinData
    py_start?: string
    class_id?: number
    class_name?: string
}

export interface GroupFileElem {
    file_id: string
    file_name: string
    size: number
    download_times: number
    dead_time: number
    upload_time: number
    uploader_name: string

    download_percent?: number
}

export interface GroupFileFolderElem {
    folder_id: string
    folder_name: string
    count: number
    create_time: number
    creater_name: string

    items?: GroupFileElem[]
    show_items?: boolean
}

export interface GroupMemberInfoElem {
    user_id: number
    title: string
    card: string
    join_time: number
    last_sent_time: number
    level: number
    nickname: string
    rank: string
    role: string
    sex: string
    shutup_time: number
    py_start?: string
}

export interface SQCodeElem {
    addText: boolean
    addTop?: boolean
    msgObj: MessageSegmentElem
}

/** OneBot message segment used by the composer before it becomes an event. */
export interface MessageSegmentElem extends Record<string, unknown> {
    type?: string
    text?: string
    id?: string | number
    file?: string
    url?: string
    qq?: string | number
}

/**
 * A message segment received from a OneBot event.
 *
 * This is deliberately separate from `MessageSegmentElem`: the latter is
 * also used by the composer and therefore has a different set of optional
 * fields. Extensions are kept in the index signature for forward
 * compatibility with adapter-specific segments.
 */
export interface IncomingMessageSegment extends Record<string, unknown> {
    type?: string
    text?: string
    id?: string | number
    file?: string
    file_id?: string
    file_name?: string
    name?: string
    url?: string
    qq?: string | number
    summary?: string
    size?: number
    file_size?: number
    subType?: number
    asface?: boolean
    data?: unknown
    content?: IncomingMessageElem[]
}

export interface IncomingMessageSender extends Record<string, unknown> {
    user_id?: string | number
    nickname?: string
    card?: string
    group_id?: string | number
    role?: string
}

/** Normalized OneBot message event consumed by the message pipeline. */
export interface IncomingMessageElem extends Record<string, unknown> {
    post_type?: string
    message_type?: string
    detail_type?: string
    sub_type?: string
    notice_type?: string
    message_id?: string | number
    message_seq?: string | number
    seq?: string | number
    time?: number | string
    group_id?: string | number
    user_id?: string | number
    target_id?: string | number
    group_name?: string
    raw_message?: string
    message: IncomingMessageSegment[]
    sender: IncomingMessageSender
    atme?: boolean
    atall?: boolean
}

/** Narrow an unknown payload at the OneBot message boundary. */
export function isIncomingMessage(value: unknown): value is IncomingMessageElem {
    if (typeof value !== 'object' || value === null) return false
    const payload = value as Record<string, unknown>
    if (!Array.isArray(payload.message) || typeof payload.sender !== 'object' || payload.sender === null) {
        return false
    }
    return payload.message.every((segment) => typeof segment === 'object' && segment !== null)
}

export interface MsgItemElem {
    type?: string
    /** Legacy extension fields are narrowed at each protocol/rendering boundary. */
    [key: string]: unknown
}

export interface RenderedMessageSegment extends Record<string, unknown> {
    type?: string
    text?: string
    id?: string | number
    file?: string
    file_id?: string
    file_name?: string
    name?: string
    url?: string
    qq?: string | number
    summary?: string
    size?: number
    file_size?: number
    subType?: number
    asface?: boolean
    data?: MessageSegmentData | string
    content?: RenderedMessage[] | string
}

export interface MessageSegmentData extends Record<string, unknown> {
    text?: string
    file?: string
    file_id?: string
    file_name?: string
    name?: string
    url?: string
    id?: string | number
    size?: number
    summary?: string
}

export interface RenderedMessageSender extends IncomingMessageSender {
    user_id: number
    nickname?: string
    card?: string
    role?: string
    title?: string
}

/** Message shape consumed by the renderer after protocol normalization. */
export interface RenderedMessage extends Record<string, unknown> {
    type?: string
    message: RenderedMessageSegment[]
    sender: RenderedMessageSender
    message_id: string
    fake_message_id?: string | number
    post_type?: string
    message_type?: string
    detail_type?: string
    sub_type?: string
    notice_type?: string
    time: number
    user_id?: string | number
    group_id?: string | number
    target_id?: string | number
    self_id?: string | number
    message_seq?: number
    seq?: number
    nickname?: string
    card?: string
    remark?: string
    group_name?: string
    raw_message?: string
    raw_msg?: string
    revoke?: boolean
    fake_msg?: boolean
    atme?: boolean
    atall?: boolean
    color?: string
    _from_local_db?: boolean
    emojis?: Record<string, number[]>
    emoji_like?: Array<{ emoji_id: number; count: number }>
    fileView?: { ext: string; url: string; txt?: string }
}

export interface MergeStackData {
    messageList: RenderedMessage[]      // 消息列表
    imageList: Array<{ img_url: string }>        // 图片列表
    placeCache: number      // 位置缓存
    forwardMsg: RenderedMessage         // 原合并转发消息
}

export interface MenuEventData {
    x: number
    y: number
    target: HTMLElement
}

export type Session = UserGroupElem & UserFriendElem
