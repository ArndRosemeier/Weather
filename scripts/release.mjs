#!/usr/bin/env node
/**
 * The ONLY writer of the app version. Run before every push:
 *
 *   pnpm release --title "Provider tooltips" \
 *     --note "Hover a provider name for who they are" \
 *     --note "Coverage now reports the window, not the fetch cap"
 *
 * It bumps src/data/version.json by 0.01, prepends a history entry (which the
 * What's-new dialog reads) and syncs package.json to the same semver. Then
 * commit, gate, push.
 *
 *   --dry-run   print the next version without touching a file
 */
import fs from 'node:fs'

const VERSION_FILE = 'src/data/version.json'
const PACKAGE_FILE = 'package.json'

function parse(version) {
  if (!/^\d+\.\d{2}$/.test(version)) throw new Error(`Bad version "${version}" — expected 1.00`)
  return Math.round(Number(version) * 100)
}

function format(value) {
  return (value / 100).toFixed(2)
}

function semverOf(value) {
  const major = Math.floor(value / 100)
  const rest = value % 100
  return `${major}.${Math.floor(rest / 10)}.${rest % 10}`
}

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const valueAfter = (flag) => {
  const index = argv.indexOf(flag)
  return index >= 0 ? argv[index + 1] : undefined
}
const notes = argv.flatMap((arg, index) => (arg === '--note' ? [argv[index + 1]] : [])).filter(Boolean)
const title = valueAfter('--title') ?? 'Changes'
const date = valueAfter('--date') ?? new Date().toISOString().slice(0, 10)

const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'))
const current = parse(data.version)
const nextValue = current + 1
const nextVersion = format(nextValue)

if (dryRun) {
  console.log(`current ${data.version} → next version: ${nextVersion} (package ${semverOf(nextValue)})`)
  process.exit(0)
}
if (notes.length === 0) {
  console.error('Refusing to release without notes. Add at least one --note "what changed".')
  process.exit(1)
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Bad date "${date}"`)

data.version = nextVersion
data.history.unshift({ version: nextVersion, date, title, changes: notes })
fs.writeFileSync(VERSION_FILE, `${JSON.stringify(data, null, 2)}\n`)

const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'))
pkg.version = semverOf(nextValue)
fs.writeFileSync(PACKAGE_FILE, `${JSON.stringify(pkg, null, 2)}\n`)

console.log(`Version ${nextVersion} written (package ${pkg.version}), history entry "${title}".`)
console.log('Next: commit both files, run the gate, push.')
