import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const distDir = path.resolve(root, process.argv[2] ?? 'dist')

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
}

const packageJson = readJson('package.json')
const sbom = readJson('docs/SBOM.cdx.json')
if (sbom.bomFormat !== 'CycloneDX' || sbom.specVersion !== '1.5') {
  throw new Error('SBOM must be CycloneDX 1.5')
}
if (sbom.metadata?.component?.name !== packageJson.name
    || sbom.metadata?.component?.version !== packageJson.version) {
  throw new Error('SBOM application metadata does not match package.json')
}

const directDependencies = Object.entries({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.optionalDependencies,
})
const components = new Map((sbom.components ?? []).map((component) => [component.name, component]))
for (const [name, requested] of directDependencies) {
  const component = components.get(name)
  const optional = packageJson.optionalDependencies?.[name] === requested
  if (!component && optional) continue
  if (!component || !component.version || (component.version === 'uninstalled' && !optional)) {
    throw new Error(`SBOM is missing installed direct dependency: ${name}`)
  }
  if (component.version === 'uninstalled') continue
  if (!component.licenses?.length) {
    throw new Error(`SBOM is missing license metadata for direct dependency: ${name}`)
  }
}

const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
const csp = html.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+>/i)?.[0] ?? ''
if (!/script-src\s+'self'/.test(csp) || /object-src\s+'none'/.test(csp) === false) {
  throw new Error('Built renderer is missing the required self-only script/object CSP')
}

const checksumFile = process.env.RELEASE_CHECKSUM_FILE
if (checksumFile && !fs.existsSync(path.resolve(checksumFile))) {
  throw new Error(`Release checksum file does not exist: ${checksumFile}`)
}

console.log(`release metadata verified: ${directDependencies.length} direct dependencies, CSP present`)
