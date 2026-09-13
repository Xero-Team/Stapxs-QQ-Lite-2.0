export const HISTORIC_FAMILY_RE = /(?:Anatolian|Avestan|Bhaiksuki|Brahmi|Carian|Caucasian|Chorasmian|Cuneiform|Cypriot|Cypro|Deseret|DivesAkuru|Dogra|Duployan|Egyptian|Elbasan|Elymaic|Glagolitic|Gothic|Grantha|Gunjala|Hatran|ImperialAramaic|IndicSiyaq|Inscriptional|Kaithi|Kharoshthi|Khitan|Khojki|Khudawadi|LinearA|LinearB|Lycian|Lydian|Mahajani|Makasar|Manichaean|Marchen|Masaram|Mayan|Medefaidrin|Meroitic|Modi|Multani|Nabataean|NagMundari|Nandinagari|Nushu|Nyiakeng|Ogham|OldHungarian|OldItalic|OldNorth|OldPermic|OldPersian|OldSogdian|OldSouth|OldTurkic|Palmyrene|PauCinHau|PhagsPa|Phoenician|Psalter|Rejang|Runic|Samaritan|Saurashtra|Sharada|Shavian|Siddham|SignWriting|Sogdian|SoraSompeng|Soyombo|Syloti|Tagalog|Tagbanwa|Takri|Tangut|Tirhuta|Toto|Ugaritic|Vithkuqi|Wancho|Warang|Yezidi|Zanabazar|Ahom)/

const SKIP_FAMILY_RE = /(?:UI$|Unjoined|Display|Condensed|SemiCondensed|ExtraCondensed|Fangsong|Rashi|Kufi|Naskh|Nastaliq|Looped|Test$)/
const BOLD_FAMILIES = new Set(['NotoSans', 'NotoSansMono', 'NotoSansCJK'])
const ITALIC_FAMILIES = new Set(['NotoSans'])
const WEB_SKIP_EXACT = new Set([
    'NotoSansTifinaghAdrar-Regular.ttf',
    'NotoSansTifinaghAgrawImazighen-Regular.ttf',
    'NotoSansTifinaghAhaggar-Regular.ttf',
    'NotoSansTifinaghAir-Regular.ttf',
    'NotoSansTifinaghAPT-Regular.ttf',
    'NotoSansTifinaghAzawagh-Regular.ttf',
    'NotoSansTifinaghGhat-Regular.ttf',
    'NotoSansTifinaghHawad-Regular.ttf',
    'NotoSansTifinaghRhissaIxa-Regular.ttf',
    'NotoSansTifinaghSIL-Regular.ttf',
    'NotoSansTifinaghTawellemmet-Regular.ttf',
    'NotoSansSyriacEastern-Regular.ttf',
    'NotoSansSyriacWestern-Regular.ttf',
    'NotoMusic-Regular.ttf',
])

const CJK_COLLECTION_FAMILIES = {
    NotoSansCJK: [
        'Noto Sans CJK SC',
        'Noto Sans CJK TC',
        'Noto Sans CJK JP',
        'Noto Sans CJK KR',
        'Noto Sans CJK HK',
        'Noto Sans Mono CJK SC',
        'Noto Sans Mono CJK TC',
        'Noto Sans Mono CJK JP',
        'Noto Sans Mono CJK KR',
        'Noto Sans Mono CJK HK',
    ],
}

export function parseStyle(filename) {
    const stem = String(filename).replace(/\.(ttf|otf|ttc|woff2)$/i, '')
    if (/NotoColorEmoji/i.test(stem)) return { weight: 400, style: 'normal', role: 'regular' }
    if (/-BoldItalic$/i.test(stem)) return { weight: 700, style: 'italic', role: 'bold-italic' }
    if (/-Italic$/i.test(stem)) return { weight: 400, style: 'italic', role: 'italic' }
    if (/-Bold$/i.test(stem)) return { weight: 700, style: 'normal', role: 'bold' }
    if (/-Regular$/i.test(stem)) return { weight: 400, style: 'normal', role: 'regular' }
    return null
}

export function familyStem(filename) {
    return String(filename)
        .replace(/\.(ttf|otf|ttc|woff2)$/i, '')
        .replace(/-(Regular|BoldItalic|Bold|Italic)$/i, '')
}

export function familyFromFilename(filename) {
    const stem = familyStem(filename)
    const named = [
        ['NotoSansMonoCJKsc', 'Noto Sans Mono CJK SC'],
        ['NotoSansMonoCJKtc', 'Noto Sans Mono CJK TC'],
        ['NotoSansMonoCJKjp', 'Noto Sans Mono CJK JP'],
        ['NotoSansMonoCJKkr', 'Noto Sans Mono CJK KR'],
        ['NotoSansMonoCJKhk', 'Noto Sans Mono CJK HK'],
        ['NotoSansCJKsc', 'Noto Sans CJK SC'],
        ['NotoSansCJKtc', 'Noto Sans CJK TC'],
        ['NotoSansCJKjp', 'Noto Sans CJK JP'],
        ['NotoSansCJKkr', 'Noto Sans CJK KR'],
        ['NotoSansCJKhk', 'Noto Sans CJK HK'],
        ['NotoSansMonoCJK', 'Noto Sans Mono CJK'],
        ['NotoSansCJK', 'Noto Sans CJK'],
        ['NotoSerifCJK', 'Noto Serif CJK'],
        ['NotoSansMono', 'Noto Sans Mono'],
        ['NotoSansNKo', 'Noto Sans NKo'],
        ['NotoColorEmoji', 'Noto Color Emoji'],
        ['NotoSansSymbols2', 'Noto Sans Symbols 2'],
        ['NotoTraditional', 'Noto Traditional '],
        ['NotoLooped', 'Noto Looped '],
        ['NotoMusic', 'Noto Music'],
        ['NotoSerif', 'Noto Serif '],
        ['NotoSans', 'Noto Sans '],
    ]
    for (const [prefix, label] of named) {
        if (stem === prefix) return label.trim()
        if (stem.startsWith(prefix)) {
            const rest = stem.slice(prefix.length)
            if (rest === '') return label.trim()
            return `${label.trim()} ${splitCamel(rest)}`.replace(/\s+/g, ' ').trim()
        }
    }
    return splitCamel(stem)
}

function splitCamel(value) {
    return value
        .replace(/NKo/g, 'NKo')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .trim()
}

export function isHistoricFamily(filename) {
    return HISTORIC_FAMILY_RE.test(familyStem(filename))
}

export function selectNotoFiles(filenames, profile = 'desktop') {
    const names = [...filenames]
    const nameSet = new Set(names)
    const selected = []
    for (const name of names) {
        if (!/^Noto/i.test(name)) continue
        if (!/\.(ttf|otf|ttc)$/i.test(name)) continue
        if (name.startsWith('NotoSerifCJK')) continue
        const style = parseStyle(name)
        if (!style) continue
        const stem = familyStem(name)
        if (SKIP_FAMILY_RE.test(stem)) continue
        if (style.role === 'bold' && !BOLD_FAMILIES.has(stem)) continue
        if ((style.role === 'italic' || style.role === 'bold-italic') && (!ITALIC_FAMILIES.has(stem) || profile !== 'desktop')) continue
        if (stem.startsWith('NotoSerif') && nameSet.has(name.replace(/^NotoSerif/, 'NotoSans'))) continue
        if (stem === 'NotoSerif') continue
        if (profile === 'web') {
            if (isHistoricFamily(name)) continue
            if (WEB_SKIP_EXACT.has(name)) continue
            if (name.endsWith('.ttc') && stem !== 'NotoSansCJK') continue
        }
        selected.push(name)
    }
    return selected.sort()
}

export function cssFormatForFilename(filename) {
    if (/\.woff2$/i.test(filename)) return 'woff2'
    if (/\.ttc$/i.test(filename)) return 'collection'
    if (/\.otf$/i.test(filename)) return 'opentype'
    return 'truetype'
}

export function facesForFile(filename) {
    const style = parseStyle(filename) ?? { weight: 400, style: 'normal' }
    const stem = familyStem(filename)
    const families = CJK_COLLECTION_FAMILIES[stem]
        ?? (stem === 'NotoSansCJK' ? CJK_COLLECTION_FAMILIES.NotoSansCJK : [familyFromFilename(filename)])
    const extra = []
    if (families.includes('Noto Sans CJK SC')) extra.push('Noto Sans SC')
    return [...families, ...extra].map((family) => ({
        family,
        weight: style.weight,
        style: style.style,
        filename,
        format: cssFormatForFilename(filename),
    }))
}

const STACK_PRIORITY = [
    'Noto Sans',
    'Noto Sans CJK SC',
    'Noto Sans SC',
    'Noto Sans CJK TC',
    'Noto Sans CJK JP',
    'Noto Sans CJK KR',
    'Noto Sans CJK HK',
    'Noto Color Emoji',
]

export function buildFontStacks(faces) {
    const sans = new Set()
    const mono = new Set()
    for (const face of faces) {
        if (face.family.includes('Mono')) mono.add(face.family)
        else sans.add(face.family)
    }
    const sortSans = [...sans].sort((left, right) => {
        const leftRank = STACK_PRIORITY.indexOf(left)
        const rightRank = STACK_PRIORITY.indexOf(right)
        if (leftRank !== -1 || rightRank !== -1) {
            return (leftRank === -1 ? 1000 : leftRank) - (rightRank === -1 ? 1000 : rightRank)
        }
        return left.localeCompare(right)
    })
    const sortMono = [...mono].sort((left, right) => {
        if (left === 'Noto Sans Mono') return -1
        if (right === 'Noto Sans Mono') return 1
        return left.localeCompare(right)
    })
    if (sans.has('Noto Sans CJK SC') && !mono.has('Noto Sans Mono CJK SC')) {
        sortMono.push('Noto Sans CJK SC')
    }
    return {
        sans: [...sortSans, 'sans-serif'],
        mono: [...sortMono, 'ui-monospace', 'monospace'],
    }
}

const GENERIC_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'ui-monospace', 'system-ui', 'emoji'])

function cssEscapeFamily(family) {
    if (GENERIC_FAMILIES.has(family)) return family
    return `'${family.replaceAll("'", "\\'")}'`
}

export function renderFacesCss(faces) {
    const stacks = buildFontStacks(faces)
    const rules = faces.map((face) => `@font-face {
    font-family: ${cssEscapeFamily(face.family)};
    src: url('./${face.filename}') format('${face.format}');
    font-weight: ${face.weight};
    font-style: ${face.style};
    font-display: swap;
}`)
    return `/* Generated by scripts/prepare-noto-fonts.mjs. Do not edit. */
:root {
    --font-sans: ${stacks.sans.map(cssEscapeFamily).join(', ')};
    --font-mono: ${stacks.mono.map(cssEscapeFamily).join(', ')};
}

${rules.join('\n\n')}
`
}

export function findTable(buffer, fontHeaderOffset, tag) {
    const numTables = buffer.readUInt16BE(fontHeaderOffset + 4)
    for (let index = 0; index < numTables; index++) {
        const record = fontHeaderOffset + 12 + index * 16
        if (buffer.toString('ascii', record, record + 4) === tag) {
            return {
                offset: buffer.readUInt32BE(record + 8),
                length: buffer.readUInt32BE(record + 12),
                checksum: buffer.readUInt32BE(record + 4),
            }
        }
    }
    return null
}

export function listTtcFaces(buffer) {
    if (buffer.toString('ascii', 0, 4) !== 'ttcf') return []
    const count = buffer.readUInt32BE(8)
    const faces = []
    for (let index = 0; index < count; index++) {
        const offset = buffer.readUInt32BE(12 + index * 4)
        faces.push({ index, offset, family: readName(buffer, offset, 1) || readName(buffer, offset, 4) })
    }
    return faces
}

function readName(buffer, fontHeaderOffset, nameId) {
    const table = findTable(buffer, fontHeaderOffset, 'name')
    if (!table) return ''
    const start = table.offset
    const count = buffer.readUInt16BE(start + 2)
    const stringOffset = buffer.readUInt16BE(start + 4)
    let fallback = ''
    for (let index = 0; index < count; index++) {
        const record = start + 6 + index * 12
        const platform = buffer.readUInt16BE(record)
        const id = buffer.readUInt16BE(record + 6)
        const length = buffer.readUInt16BE(record + 8)
        const offset = buffer.readUInt16BE(record + 10)
        if (id !== nameId) continue
        const raw = buffer.subarray(start + stringOffset + offset, start + stringOffset + offset + length)
        let text = ''
        if (platform === 3 || platform === 0) {
            if (raw.length % 2 !== 0) continue
            text = Buffer.from(raw).swap16().toString('utf16le')
        } else {
            text = raw.toString('latin1')
        }
        if (platform === 3) return text
        if (!fallback) fallback = text
    }
    return fallback
}

export function extractSfntFromTtc(buffer, fontIndex) {
    const faces = listTtcFaces(buffer)
    const face = faces[fontIndex]
    if (!face) throw new Error(`TTC face ${fontIndex} not found`)
    const numTables = buffer.readUInt16BE(face.offset + 4)
    const tables = []
    for (let index = 0; index < numTables; index++) {
        const record = face.offset + 12 + index * 16
        tables.push({
            tag: buffer.subarray(record, record + 4),
            checksum: buffer.readUInt32BE(record + 4),
            offset: buffer.readUInt32BE(record + 8),
            length: buffer.readUInt32BE(record + 12),
        })
    }
    let cursor = 12 + numTables * 16
    const relocated = tables.map((table) => {
        const aligned = (cursor + 3) & ~3
        const next = { ...table, newOffset: aligned }
        cursor = aligned + table.length
        return next
    })
    const output = Buffer.alloc((cursor + 3) & ~3)
    buffer.copy(output, 0, face.offset, face.offset + 12)
    relocated.forEach((table, index) => {
        const record = 12 + index * 16
        table.tag.copy(output, record)
        output.writeUInt32BE(table.checksum, record + 4)
        output.writeUInt32BE(table.newOffset, record + 8)
        output.writeUInt32BE(table.length, record + 12)
        buffer.copy(output, table.newOffset, table.offset, table.offset + table.length)
    })
    return output
}

export function resolveFontProfile(env = process.env) {
    const explicit = env.VITE_BUNDLE_FONTS
    if (explicit === 'web' || explicit === 'desktop' || explicit === 'system') return explicit
    return env.DESKTOP ? 'desktop' : 'web'
}
