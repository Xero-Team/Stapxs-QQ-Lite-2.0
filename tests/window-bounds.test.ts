import { describe, expect, it } from 'vitest'
import {
    computeDefaultWindowSize,
    isLegacyDefaultWindowSize,
    minWindowSize,
    resolveWindowBounds,
} from '../src/electron/function/windowBounds'

describe('desktop window bounds', () => {
    it('uses the 1200x800 ideal size on a 1080p work area', () => {
        expect(computeDefaultWindowSize({ width: 1920, height: 1080 })).toEqual({
            width: 1200,
            height: 800,
        })
    })

    it('caps at the ideal size on a 1440p work area', () => {
        expect(computeDefaultWindowSize({ width: 2560, height: 1440 })).toEqual({
            width: 1200,
            height: 800,
        })
    })

    it('scales down on a 1366x768 laptop work area', () => {
        expect(computeDefaultWindowSize({ width: 1366, height: 768 })).toEqual({
            width: 984,
            height: 640,
        })
    })

    it('nearly fills a small 800x600 work area', () => {
        expect(computeDefaultWindowSize({ width: 800, height: 600 })).toEqual({
            width: 752,
            height: 552,
        })
    })

    it('replaces the legacy 850x530 default and centers it', () => {
        expect(isLegacyDefaultWindowSize({ width: 850, height: 530 })).toBe(true)
        expect(resolveWindowBounds(
            { x: 40, y: 60, width: 850, height: 530 },
            { x: 0, y: 0, width: 1920, height: 1080 },
        )).toEqual({
            x: 360,
            y: 140,
            width: 1200,
            height: 800,
        })
    })

    it('keeps a user-resized window but clamps it onto the current work area', () => {
        expect(resolveWindowBounds(
            { x: 100, y: 80, width: 1600, height: 1000 },
            { x: 0, y: 0, width: 1366, height: 768 },
        )).toEqual({
            x: 48,
            y: 48,
            width: 1318,
            height: 720,
        })
    })

    it('centers when restored position is missing', () => {
        expect(resolveWindowBounds(
            { width: 1200, height: 800 },
            { x: 100, y: 50, width: 1920, height: 1080 },
        )).toEqual({
            x: 460,
            y: 190,
            width: 1200,
            height: 800,
        })
    })

    it('prefers a 720px min width on large screens', () => {
        expect(minWindowSize({ width: 1920, height: 1080 })).toEqual({
            width: 720,
            height: 450,
        })
    })
})
