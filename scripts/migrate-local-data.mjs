#!/usr/bin/env node

/**
 * Convert legacy local data exports into the versioned Dexie import format.
 *
 * The command is deliberately file based: it never opens or deletes the source
 * file, so an export can always be used to roll back an unsuccessful upgrade.
 */
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const MAX_NAMESPACE_LENGTH = 128
const MAX_KEY_LENGTH = 512

function parseArgs(argv) {
  const args = { input: undefined, output: undefined, namespace: 'legacy-localstorage', force: false }
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]
    if (flag === '--force') {
      args.force = true
      continue
    }
    if (flag === '--input' || flag === '--output' || flag === '--namespace') {
      const value = argv[++index]
      if (!value) throw new Error(`${flag} requires a value`)
      if (flag === '--input') args.input = value
      if (flag === '--output') args.output = value
      if (flag === '--namespace') args.namespace = value
      continue
    }
    throw new Error(`Unknown option: ${flag}`)
  }
  if (!args.input || !args.output) throw new Error('Both --input and --output are required')
  return args
}

function isPlainRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateRecord(value) {
  if (!isPlainRecord(value)) throw new TypeError('Each migrated item must be an object')
  const namespace = value.namespace
  const key = value.key
  const updatedAt = value.updatedAt
  if (typeof namespace !== 'string' || namespace.length === 0 || namespace.length > MAX_NAMESPACE_LENGTH) {
    throw new TypeError('Invalid namespace in local data export')
  }
  if (typeof key !== 'string' || key.length === 0 || key.length > MAX_KEY_LENGTH) {
    throw new TypeError('Invalid key in local data export')
  }
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt < 0) {
    throw new TypeError('Invalid updatedAt in local data export')
  }
  return { namespace, key, value: value.value, updatedAt }
}

function normalizeInput(input, namespace, updatedAt) {
  if (Array.isArray(input)) return input.map(validateRecord)
  if (!isPlainRecord(input)) {
    throw new TypeError('Input must be a Dexie export array or a legacy key/value object')
  }
  return Object.entries(input).map(([key, value]) => {
    if (key.length === 0 || key.length > MAX_KEY_LENGTH) throw new TypeError('Invalid key in legacy local data')
    return { namespace, key, value, updatedAt }
  })
}

function deduplicate(records) {
  const latest = new Map()
  for (const record of records) {
    const identity = `${record.namespace}\u0000${record.key}`
    const previous = latest.get(identity)
    if (!previous || record.updatedAt >= previous.updatedAt) latest.set(identity, record)
  }
  return [...latest.values()].sort((left, right) =>
    left.namespace.localeCompare(right.namespace) || left.key.localeCompare(right.key),
  )
}

const args = parseArgs(process.argv.slice(2))
const inputPath = path.resolve(args.input)
const outputPath = path.resolve(args.output)
if (!args.force && inputPath === outputPath) throw new Error('Input and output must be different files')
if (!args.force) {
  try {
    await stat(outputPath)
    throw new Error('Output already exists; pass --force to replace it')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

const raw = await readFile(inputPath, 'utf8')
let parsed
try {
  parsed = JSON.parse(raw)
} catch {
  throw new Error('Input is not valid JSON')
}
const fileStat = await stat(inputPath)
const records = deduplicate(normalizeInput(parsed, args.namespace, fileStat.mtimeMs))
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, { encoding: 'utf8', flag: args.force ? 'w' : 'wx' })
console.log(`Migrated ${records.length} local data records.`)
