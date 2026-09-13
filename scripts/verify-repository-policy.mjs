import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const maxLines = Number(process.env.MAX_SOURCE_LINES ?? 3000)
const sourceRoots = ['src', 'scripts', 'tests']
const extensions = new Set(['.ts', '.tsx', '.vue', '.js', '.jsx', '.mjs', '.cjs'])
const ignored = new Set(['node_modules', 'dist', 'out', 'coverage', '.git'])

function collect(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collect(full))
    else if (extensions.has(path.extname(entry.name))) files.push(full)
  }
  return files
}

const oversized = sourceRoots
  .flatMap((name) => collect(path.join(root, name)))
  .map((file) => ({ file, lines: fs.readFileSync(file, 'utf8').split('\n').length }))
  .filter(({ lines }) => lines > maxLines)

if (oversized.length) {
  for (const { file, lines } of oversized) {
    console.error(`source file exceeds ${maxLines} lines: ${path.relative(root, file)} (${lines})`)
  }
  process.exit(1)
}

const subject = execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf8' }).trim()
const conventional = /^(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\([^)]+\))?!?: .+$/
if (!conventional.test(subject)) {
  console.error(`latest commit is not Conventional Commits compliant: ${subject}`)
  process.exit(1)
}

console.log(`repository policy verified: ${sourceRoots.join(', ')} <= ${maxLines} lines; commit subject compliant`)
