import fs from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import process from 'node:process'

const artifactDir = path.resolve(process.argv[2] ?? 'dist')
const outputFile = process.argv[3] ? path.resolve(process.argv[3]) : undefined

function collectFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(file) : [file]
  })
}

if (!fs.existsSync(artifactDir) || !fs.statSync(artifactDir).isDirectory()) {
  throw new Error(`Build artifact directory not found: ${artifactDir}`)
}

const files = collectFiles(artifactDir)
  .map((file) => {
    const content = fs.readFileSync(file)
    return {
      path: path.relative(artifactDir, file).split(path.sep).join('/'),
      bytes: content.byteLength,
      gzipBytes: gzipSync(content, { level: 9 }).byteLength,
    }
  })
  .sort((left, right) => right.bytes - left.bytes)

const metrics = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  artifactDir,
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  totalGzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
  largestFiles: files.slice(0, 10),
  runtimeMeasurements: {
    startupMs: null,
    memoryRssBytes: null,
    note: 'Browser or native runtime measurements must be supplied by the platform CI job.',
  },
}

const serialized = `${JSON.stringify(metrics, null, 2)}\n`
if (outputFile) fs.writeFileSync(outputFile, serialized)
process.stdout.write(serialized)
