/** Remove bidi control characters before showing user-controlled names. */
export function getShowName(base: string, remark: string): string {
    const sanitizedBase = base.replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
    if (!remark || remark === base) return sanitizedBase
    return (remark + '（' + base + '）').replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
}

export function isShowTime(
    timePrevious: number | undefined,
    timeNow: number,
    alwaysShow = false,
): boolean {
    if (alwaysShow) return true
    if (timePrevious === undefined) return false
    return timeNow - timePrevious >= 300
}

export interface QqLevelIcons {
    crown: number
    sun: number
    moon: number
    star: number
}

export function qqLevelIcons(level: number): QqLevelIcons {
    const result: QqLevelIcons = { crown: 0, sun: 0, moon: 0, star: 0 }
    result.crown = Math.floor(level / 64)
    level %= 64
    result.sun = Math.floor(level / 16)
    level %= 16
    result.moon = Math.floor(level / 4)
    level %= 4
    result.star = level
    return result
}

export function qqLevelToEmoji(level: number): string | number {
    const rawLevel = level
    if (level <= 0) return level
    const crown = Math.floor(level / 64)
    level %= 64
    const sun = Math.floor(level / 16)
    level %= 16
    const moon = Math.floor(level / 4)
    level %= 4
    const star = level
    return '👑'.repeat(crown) + '☀️'.repeat(sun) + '🌙'.repeat(moon) + '⭐️'.repeat(star) + '（' + rawLevel + '）'
}
