export const LEGACY_DEFAULT_WINDOW_SIZE = { width: 850, height: 530 } as const
export const IDEAL_WINDOW_SIZE = { width: 1200, height: 800 } as const
export const PREFERRED_MIN_WINDOW_SIZE = { width: 720, height: 450 } as const
export const HARD_MIN_WINDOW_SIZE = { width: 350, height: 450 } as const

const WORK_AREA_MARGIN = 48
const WIDTH_RATIO = 0.72
const HEIGHT_RATIO = 0.78
const MIN_DEFAULT_WIDTH = 960
const MIN_DEFAULT_HEIGHT = 640
const LEGACY_SIZE_TOLERANCE = 8

export interface WorkArea {
    x: number
    y: number
    width: number
    height: number
}

export interface WindowBounds {
    x: number
    y: number
    width: number
    height: number
}

export interface RestoredWindowBounds {
    x?: number
    y?: number
    width: number
    height: number
}

function clamp(value: number, min: number, max: number): number {
    if (max < min) return max
    return Math.min(max, Math.max(min, value))
}

export function isLegacyDefaultWindowSize(size: { width: number; height: number }): boolean {
    return Math.abs(size.width - LEGACY_DEFAULT_WINDOW_SIZE.width) <= LEGACY_SIZE_TOLERANCE
        && Math.abs(size.height - LEGACY_DEFAULT_WINDOW_SIZE.height) <= LEGACY_SIZE_TOLERANCE
}

export function minWindowSize(workArea: { width: number; height: number }): { width: number; height: number } {
    return {
        width: Math.max(HARD_MIN_WINDOW_SIZE.width, Math.min(PREFERRED_MIN_WINDOW_SIZE.width, Math.floor(workArea.width))),
        height: Math.max(HARD_MIN_WINDOW_SIZE.height, Math.min(PREFERRED_MIN_WINDOW_SIZE.height, Math.floor(workArea.height))),
    }
}

export function computeDefaultWindowSize(workArea: { width: number; height: number }): { width: number; height: number } {
    const maxWidth = Math.max(HARD_MIN_WINDOW_SIZE.width, workArea.width - WORK_AREA_MARGIN)
    const maxHeight = Math.max(HARD_MIN_WINDOW_SIZE.height, workArea.height - WORK_AREA_MARGIN)
    const width = clamp(
        Math.round(Math.min(IDEAL_WINDOW_SIZE.width, workArea.width * WIDTH_RATIO)),
        Math.min(MIN_DEFAULT_WIDTH, maxWidth),
        maxWidth,
    )
    const height = clamp(
        Math.round(Math.min(IDEAL_WINDOW_SIZE.height, workArea.height * HEIGHT_RATIO)),
        Math.min(MIN_DEFAULT_HEIGHT, maxHeight),
        maxHeight,
    )
    return { width, height }
}

export function centerWindowOnWorkArea(
    size: { width: number; height: number },
    workArea: WorkArea,
): WindowBounds {
    return {
        x: Math.round(workArea.x + (workArea.width - size.width) / 2),
        y: Math.round(workArea.y + (workArea.height - size.height) / 2),
        width: size.width,
        height: size.height,
    }
}

export function fitWindowToWorkArea(bounds: RestoredWindowBounds, workArea: WorkArea): WindowBounds {
    const minSize = minWindowSize(workArea)
    const maxWidth = Math.max(minSize.width, workArea.width - WORK_AREA_MARGIN)
    const maxHeight = Math.max(minSize.height, workArea.height - WORK_AREA_MARGIN)
    const width = clamp(Math.round(bounds.width), minSize.width, maxWidth)
    const height = clamp(Math.round(bounds.height), minSize.height, maxHeight)
    if (bounds.x === undefined || bounds.y === undefined || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) {
        return centerWindowOnWorkArea({ width, height }, workArea)
    }
    const x = clamp(Math.round(bounds.x), workArea.x, Math.max(workArea.x, workArea.x + workArea.width - width))
    const y = clamp(Math.round(bounds.y), workArea.y, Math.max(workArea.y, workArea.y + workArea.height - height))
    return { x, y, width, height }
}

export function resolveWindowBounds(restored: RestoredWindowBounds, workArea: WorkArea): WindowBounds {
    const legacy = isLegacyDefaultWindowSize(restored)
    const size = legacy ? computeDefaultWindowSize(workArea) : restored
    const next: RestoredWindowBounds = {
        width: size.width,
        height: size.height,
    }
    if (!legacy && restored.x !== undefined) next.x = restored.x
    if (!legacy && restored.y !== undefined) next.y = restored.y
    return fitWindowToWorkArea(next, workArea)
}
