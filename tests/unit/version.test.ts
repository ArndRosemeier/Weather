import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { VERSION, VERSION_HISTORY, semverOf, versionNumber } from '../../src/lib/version'

describe('version history', () => {
  it('starts at the newest entry and lists versions newest first, 0.01 apart', () => {
    expect(VERSION_HISTORY[0]?.version).toBe(VERSION)
    for (let index = 1; index < VERSION_HISTORY.length; index += 1) {
      const newer = versionNumber(VERSION_HISTORY[index - 1]?.version ?? '0')
      const older = versionNumber(VERSION_HISTORY[index]?.version ?? '0')
      expect(newer - older).toBe(1)
    }
  })

  it('uses a two-decimal version and a matching semver in package.json', () => {
    expect(VERSION).toMatch(/^\d+\.\d{2}$/)
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string }
    expect(pkg.version).toBe(semverOf(VERSION))
    expect(semverOf('1.00')).toBe('1.0.0')
    expect(semverOf('1.09')).toBe('1.0.9')
    expect(semverOf('1.10')).toBe('1.1.0')
  })

  it('gives every entry a real date, a title and at least one change', () => {
    for (const entry of VERSION_HISTORY) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.title.length).toBeGreaterThan(3)
      expect(entry.changes.length).toBeGreaterThan(0)
      for (const change of entry.changes) expect(change.length).toBeGreaterThan(8)
    }
  })

  it('release --dry-run proposes exactly the next hundredth', () => {
    const next = (versionNumber(VERSION) + 1) / 100
    const output = execFileSync(process.execPath, ['scripts/release.mjs', '--dry-run'], { encoding: 'utf8' })
    expect(output).toContain(`next version: ${next.toFixed(2)}`)
  })
})
