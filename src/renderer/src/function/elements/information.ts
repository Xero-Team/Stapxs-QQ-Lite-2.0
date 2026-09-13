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

export interface MsgItemElem {
    type?: string
    // Legacy extension fields are validated by the OneBot schema before use.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

export interface MergeStackData {
    messageList: MsgItemElem[]      // 消息列表
    imageList: Array<{ img_url: string }>        // 图片列表
    placeCache: number      // 位置缓存
    forwardMsg: MsgItemElem         // 原合并转发消息
}

export interface MenuEventData {
    x: number
    y: number
    target: HTMLElement
}

export type Session = UserGroupElem & UserFriendElem
