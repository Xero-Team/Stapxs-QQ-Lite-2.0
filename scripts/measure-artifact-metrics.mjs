import { readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = process.argv[2]
if (!root) throw new Error('Usage: node scripts/measure-artifact-metrics.mjs <directory>')

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await files(path))
    else if (entry.isFile() && entry.name !== 'build-metrics.json') result.push(path)
  }
  return result
}

const paths = await files(root)
const records = await Promise.all(paths.map(async (path) => ({
  path: relative(root, path).replaceAll('\\', '/'),
  bytes: (await stat(path)).size,
})))
records.sort((a, b) => b.bytes - a.bytes)
const totalBytes = records.reduce((sum, item) => sum + item.bytes, 0)
const metrics = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  artifactDir: root,
  fileCount: records.length,
  totalBytes,
  largestFiles: records.slice(0, 10),
  runtimeMeasurements: {
    startupMs: null,
    memoryRssBytes: null,
    note: 'Native startup and memory measurements are supplied by hosted runtime jobs.',
  },
}
await writeFile(join(root, 'build-metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`)
console.log(JSON.stringify(metrics, null, 2))
