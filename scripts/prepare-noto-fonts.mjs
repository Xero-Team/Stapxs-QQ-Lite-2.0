#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

import {
    extractSfntFromTtc,
    facesForFile,
    listTtcFaces,
    renderFacesCss,
    selectNotoFiles,
} from './noto-fonts.mjs'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fontRoot = join(repoRoot, 'resources', 'fonts')
const cacheDir = join(fontRoot, '_cache')
const sourceDir = join(fontRoot, '_source')
const force = process.argv.includes('--force')

const LOCAL_FONT_DIRS = [
    '/usr/share/fonts/noto',
    '/usr/share/fonts/noto-cjk',
]

const ARCH_PACKAGES = [
    {
        file: 'noto-fonts-1:2026.09.01-1-any.pkg.tar.zst',
        url: 'https://geo.mirror.pkgbuild.com/extra/os/x86_64/noto-fonts-1:2026.09.01-1-any.pkg.tar.zst',
    },
    {
        file: 'noto-fonts-cjk-20240730-1-any.pkg.tar.zst',
        url: 'https://geo.mirror.pkgbuild.com/extra/os/x86_64/noto-fonts-cjk-20240730-1-any.pkg.tar.zst',
    },
    {
        file: 'noto-fonts-emoji-1:2.051-1-any.pkg.tar.zst',
        url: 'https://geo.mirror.pkgbuild.com/extra/os/x86_64/noto-fonts-emoji-1:2.051-1-any.pkg.tar.zst',
    },
]

function log(message) {
    process.stdout.write(`${message}\n`)
}

async function pathExists(path) {
    try {
        await stat(path)
        return true
    } catch {
        return false
    }
}

async function collectLocalFonts() {
    const found = []
    for (const dir of LOCAL_FONT_DIRS) {
        if (!await pathExists(dir)) continue
        const entries = await readdir(dir)
        for (const name of entries) {
            if (!/\.(ttf|otf|ttc)$/i.test(name)) continue
            found.push({ name, path: join(dir, name) })
        }
    }
    return found
}

async function download(url, dest) {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok || !response.body) {
        throw new Error(`download failed ${response.status} ${url}`)
    }
    await mkdir(dirname(dest), { recursive: true })
    await pipeline(Readable.fromWeb(response.body), createWriteStream(dest))
}

async function extractArchPackage(archive, dest) {
    await mkdir(dest, { recursive: true })
    execFileSync('tar', ['--zstd', '-xf', archive, '-C', dest], { stdio: 'inherit' })
}

async function collectExtractedFonts(dir, found = []) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) await collectExtractedFonts(full, found)
        else if (/\.(ttf|otf|ttc)$/i.test(entry.name)) found.push({ name: entry.name, path: full })
    }
    return found
}

async function ensureSources() {
    const local = await collectLocalFonts()
    const selected = selectNotoFiles(local.map((item) => item.name), 'desktop')
    if (selected.length >= 80) {
        log(`using ${local.length} local Noto files`)
        return local
    }
    log('local Noto fonts incomplete, downloading Arch packages')
    await mkdir(cacheDir, { recursive: true })
    await mkdir(sourceDir, { recursive: true })
    for (const item of ARCH_PACKAGES) {
        const archive = join(cacheDir, item.file)
        if (!await pathExists(archive)) {
            log(`downloading ${item.file}`)
            await download(item.url, archive)
        }
        await extractArchPackage(archive, sourceDir)
    }
    return collectExtractedFonts(sourceDir)
}

function hasWoff2Compress() {
    try {
        execFileSync('which', ['woff2_compress'], { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

async function compressWoff2(input, output) {
    execFileSync('woff2_compress', [input], { stdio: 'ignore' })
    const generated = input.replace(/\.(ttf|otf)$/i, '.woff2')
    if (generated !== output) await copyFile(generated, output)
    if (generated !== input && generated !== output) await rm(generated, { force: true })
}

async function writeProfile(profile, files, oflSource) {
    const dest = join(fontRoot, profile)
    if (force) await rm(dest, { recursive: true, force: true })
    await mkdir(dest, { recursive: true })
    const selected = selectNotoFiles(files.map((item) => item.name), profile)
    const byName = new Map(files.map((item) => [item.name, item]))
    const canWoff2 = profile === 'web' && hasWoff2Compress()
    const outputFaces = []
    const used = new Set()

    for (const name of selected) {
        const source = byName.get(name)
        if (!source) continue
        if (profile === 'web' && name.startsWith('NotoSansCJK') && name.endsWith('.ttc')) {
            const buffer = await readFile(source.path)
            const faces = listTtcFaces(buffer)
            const sc = faces.find((face) => face.family === 'Noto Sans CJK SC')
            if (!sc) throw new Error(`Noto Sans CJK SC missing in ${name}`)
            const extracted = extractSfntFromTtc(buffer, sc.index)
            const style = name.includes('Bold') ? 'Bold' : 'Regular'
            const ttfName = `NotoSansCJKsc-${style}.ttf`
            const ttfPath = join(dest, ttfName)
            await writeFile(ttfPath, extracted)
            let filename = ttfName
            if (canWoff2) {
                filename = ttfName.replace(/\.ttf$/i, '.woff2')
                await compressWoff2(ttfPath, join(dest, filename))
                await rm(ttfPath, { force: true })
            }
            used.add(filename)
            outputFaces.push(...facesForFile(filename))
            continue
        }
        const ext = extname(name)
        let filename = name
        const target = join(dest, filename)
        await copyFile(source.path, target)
        if (profile === 'web' && canWoff2 && ext.toLowerCase() !== '.ttc' && name !== 'NotoColorEmoji.ttf') {
            filename = name.replace(/\.(ttf|otf)$/i, '.woff2')
            await compressWoff2(target, join(dest, filename))
            await rm(target, { force: true })
        }
        used.add(filename)
        outputFaces.push(...facesForFile(filename))
    }

    if (oflSource) await copyFile(oflSource, join(dest, 'OFL.txt'))
    await writeFile(join(dest, 'faces.css'), renderFacesCss(outputFaces))
    const size = await dirSize(dest)
    log(`${profile}: ${used.size} files, ${(size / 1024 / 1024).toFixed(1)} MB`)
    if (profile === 'web' && (size < 20 * 1024 * 1024 || size > 60 * 1024 * 1024)) {
        log(`warning: web font bundle is ${(size / 1024 / 1024).toFixed(1)} MB, expected ~40-50 MB`)
    }
    if (profile === 'desktop' && (size < 50 * 1024 * 1024 || size > 150 * 1024 * 1024)) {
        log(`warning: desktop font bundle is ${(size / 1024 / 1024).toFixed(1)} MB, expected ~80-120 MB`)
    }
}

async function dirSize(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    let total = 0
    for (const entry of entries) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) total += await dirSize(full)
        else total += (await stat(full)).size
    }
    return total
}

async function alreadyPrepared() {
    if (force) return false
    const desktopCss = join(fontRoot, 'desktop', 'faces.css')
    const webCss = join(fontRoot, 'web', 'faces.css')
    return await pathExists(desktopCss) && await pathExists(webCss)
}

export async function prepareNotoFonts() {
    await mkdir(fontRoot, { recursive: true })
    const ofl = join(fontRoot, 'OFL.txt')
    if (await alreadyPrepared()) {
        log('Noto fonts already prepared, skip (pass --force to rebuild)')
        return
    }
    const files = await ensureSources()
    await writeProfile('desktop', files, ofl)
    await writeProfile('web', files, ofl)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    await prepareNotoFonts()
}
