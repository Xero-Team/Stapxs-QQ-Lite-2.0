import { isSafeExternalUrl } from '../network/policy'

export type XmlCardBlock =
    | { kind: 'title'; text: string; size: number }
    | { kind: 'summary'; text: string }
    | { kind: 'picture'; url: string }

export type XmlCard =
    | { status: 'invalid' }
    | { status: 'unsupported'; source: string }
    | { status: 'ok'; blocks: XmlCardBlock[]; link: string | null }

function webUrl(value: string | null): string | null {
    if (!value || !isSafeExternalUrl(value)) return null
    const url = new URL(value)
    return url.username || url.password ? null : url.href
}

/** Parse OneBot XML as an inert XML document; never convert it into HTML. */
export function parseXmlCard(input: unknown): XmlCard {
    if (typeof input !== 'string' || input.length > 256 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(input)) {
        return { status: 'invalid' }
    }
    const document = new DOMParser().parseFromString(input, 'application/xml')
    const root = document.documentElement
    if (document.querySelector('parsererror') || root?.tagName !== 'msg') return { status: 'invalid' }
    const source = Array.from(root.children).find((node) => node.tagName === 'source')?.getAttribute('name')
    if (source === '群投票') return { status: 'unsupported', source }

    const blocks: XmlCardBlock[] = []
    for (const item of Array.from(root.children)) {
        if (item.tagName !== 'item') continue
        for (const node of Array.from(item.children)) {
            if (blocks.length >= 200) return { status: 'invalid' }
            if (node.tagName === 'title') {
                const rawSize = Number(node.getAttribute('size') ?? 18)
                const size = Number.isFinite(rawSize) ? Math.min(48, Math.max(12, rawSize)) : 18
                blocks.push({ kind: 'title', text: node.textContent ?? '', size })
            } else if (node.tagName === 'summary') {
                blocks.push({ kind: 'summary', text: node.textContent ?? '' })
            } else if (node.tagName === 'picture') {
                const url = webUrl(node.getAttribute('cover'))
                if (url) blocks.push({ kind: 'picture', url })
            }
        }
    }
    return blocks.length ? { status: 'ok', blocks, link: webUrl(root.getAttribute('url')) } : { status: 'invalid' }
}
