import raw from '../data/version.json'

export interface VersionEntry {
  version: string
  date: string
  title: string
  changes: string[]
}

interface VersionFile {
  version: string
  history: VersionEntry[]
}

const data = raw as VersionFile

export const VERSION = data.version
export const VERSION_HISTORY: VersionEntry[] = data.history

/** 1.00 → 100, so "+0.01" is integer arithmetic and never a float accident. */
export function versionNumber(version: string): number {
  return Math.round(Number(version) * 100)
}

/** package.json needs semver: 1.00 → 1.0.0, 1.01 → 1.0.1, 1.10 → 1.1.0. */
export function semverOf(version: string): string {
  const value = versionNumber(version)
  const major = Math.floor(value / 100)
  const rest = value % 100
  return `${major}.${Math.floor(rest / 10)}.${rest % 10}`
}
