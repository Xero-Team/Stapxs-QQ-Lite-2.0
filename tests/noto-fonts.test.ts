import { describe, expect, it } from 'vitest'
import {
    buildFontStacks,
    familyFromFilename,
    facesForFile,
    renderFacesCss,
    resolveFontProfile,
    selectNotoFiles,
} from '../scripts/noto-fonts.mjs'

describe('noto font selection', () => {
    const pool = [
        'NotoSans-Regular.ttf',
        'NotoSans-Bold.ttf',
        'NotoSans-Italic.ttf',
        'NotoSans-Thin.ttf',
        'NotoSansArabic-Regular.ttf',
        'NotoSansArabic-Bold.ttf',
        'NotoSansArabicUI-Regular.ttf',
        'NotoSansCJK-Regular.ttc',
        'NotoSansCJK-Bold.ttc',
        'NotoSerifCJK-Regular.ttc',
        'NotoColorEmoji.ttf',
        'NotoSansMono-Regular.ttf',
        'NotoSansCuneiform-Regular.ttf',
        'NotoSansTest-Regular.ttf',
        'NotoSerifTibetan-Regular.ttf',
        'NotoSerif-Regular.ttf',
        'MesloLGMNerdFont-Regular.ttf',
    ]

    it('keeps rare-script Regular plus CJK Regular/Bold on desktop', () => {
        const selected = selectNotoFiles(pool, 'desktop')
        expect(selected).toContain('NotoSans-Regular.ttf')
        expect(selected).toContain('NotoSans-Bold.ttf')
        expect(selected).toContain('NotoSans-Italic.ttf')
        expect(selected).toContain('NotoSansArabic-Regular.ttf')
        expect(selected).toContain('NotoSansCJK-Regular.ttc')
        expect(selected).toContain('NotoSansCJK-Bold.ttc')
        expect(selected).toContain('NotoColorEmoji.ttf')
        expect(selected).toContain('NotoSansCuneiform-Regular.ttf')
        expect(selected).toContain('NotoSerifTibetan-Regular.ttf')
        expect(selected).not.toContain('NotoSans-Thin.ttf')
        expect(selected).not.toContain('NotoSansArabic-Bold.ttf')
        expect(selected).not.toContain('NotoSansArabicUI-Regular.ttf')
        expect(selected).not.toContain('NotoSerifCJK-Regular.ttc')
        expect(selected).not.toContain('NotoSansTest-Regular.ttf')
        expect(selected).not.toContain('NotoSerif-Regular.ttf')
        expect(selected).not.toContain('MesloLGMNerdFont-Regular.ttf')
    })

    it('drops historic scripts and extra italic from the web set', () => {
        const selected = selectNotoFiles(pool, 'web')
        expect(selected).toContain('NotoSans-Regular.ttf')
        expect(selected).toContain('NotoSansCJK-Regular.ttc')
        expect(selected).toContain('NotoSansArabic-Regular.ttf')
        expect(selected).not.toContain('NotoSansCuneiform-Regular.ttf')
        expect(selected).not.toContain('NotoSans-Italic.ttf')
    })
})

describe('noto family names', () => {
    it('splits Noto filenames into CSS families', () => {
        expect(familyFromFilename('NotoSans-Regular.ttf')).toBe('Noto Sans')
        expect(familyFromFilename('NotoSansCJKsc-Regular.woff2')).toBe('Noto Sans CJK SC')
        expect(familyFromFilename('NotoSansSymbols2-Regular.ttf')).toBe('Noto Sans Symbols 2')
        expect(familyFromFilename('NotoColorEmoji.ttf')).toBe('Noto Color Emoji')
        expect(familyFromFilename('NotoSansNKo-Regular.ttf')).toBe('Noto Sans NKo')
    })

    it('aliases extracted SC faces and keeps Noto Sans first in the stack', () => {
        const faces = [
            ...facesForFile('NotoSans-Regular.woff2'),
            ...facesForFile('NotoSansCJKsc-Regular.woff2'),
            ...facesForFile('NotoColorEmoji.ttf'),
        ]
        expect(faces.some((face) => face.family === 'Noto Sans SC')).toBe(true)
        const stacks = buildFontStacks(faces)
        expect(stacks.sans.slice(0, 3)).toEqual([
            'Noto Sans',
            'Noto Sans CJK SC',
            'Noto Sans SC',
        ])
        expect(stacks.mono).toContain('Noto Sans CJK SC')
        expect(stacks.mono.at(-1)).toBe('monospace')
        const css = renderFacesCss(faces)
        expect(css).toContain('ui-monospace, monospace')
        expect(css).not.toContain("'ui-monospace'")
    })
})

describe('font profile', () => {
    it('uses desktop fonts for native shells and web fonts otherwise', () => {
        expect(resolveFontProfile({ DESKTOP: '1' })).toBe('desktop')
        expect(resolveFontProfile({})).toBe('web')
        expect(resolveFontProfile({ VITE_BUNDLE_FONTS: 'system' })).toBe('system')
    })
})
