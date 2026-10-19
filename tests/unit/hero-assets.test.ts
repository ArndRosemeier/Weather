import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { HeroKey } from '../../src/lib/wmo'

const PUBLIC = path.join(process.cwd(), 'public')
const HERO_KEYS: HeroKey[] = [
  'clear-day', 'clear-night', 'partly-cloudy-day', 'partly-cloudy-night',
  'overcast', 'fog', 'drizzle', 'rain', 'heavy-rain', 'thunderstorm',
  'snow', 'wind', 'heat', 'frost',
]

function header(file: string, bytes: number): Buffer {
  return fs.readFileSync(file).subarray(0, bytes)
}

describe('generated hero assets', () => {
  it('ships every hero family at three widths as real WebP', () => {
    for (const key of HERO_KEYS) {
      // Size floors are a degenerate-output alarm, not a quality bar: a smooth
      // sky at 320 px legitimately compresses to ~4 KB.
      const floors: Record<number, number> = { 320: 2_000, 800: 6_000, 1600: 20_000 }
      for (const width of [320, 800, 1600]) {
        const file = path.join(PUBLIC, 'heroes', `${key}-${width}.webp`)
        expect(fs.existsSync(file), `${file} is missing — run pnpm heroes`).toBe(true)
        const buffer = fs.readFileSync(file)
        expect(buffer.length, `${file} is suspiciously small`).toBeGreaterThan(floors[width] ?? 0)
        expect(buffer.subarray(0, 4).toString('ascii')).toBe('RIFF')
        expect(buffer.subarray(8, 12).toString('ascii')).toBe('WEBP')
      }
    }
  })

  it('ships the app icons referenced by the manifest and the HTML', () => {
    const icons = ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png']
    for (const icon of icons) {
      const file = path.join(PUBLIC, icon)
      expect(fs.existsSync(file), `${file} is missing — run pnpm heroes`).toBe(true)
      expect(header(file, 8).subarray(1, 4).toString('ascii')).toBe('PNG')
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'manifest.webmanifest'), 'utf8')) as {
      icons: { src: string; purpose?: string }[]
    }
    for (const icon of manifest.icons) {
      expect(fs.existsSync(path.join(PUBLIC, icon.src)), `${icon.src} is listed in the manifest but missing`).toBe(true)
    }
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
    expect(html).toContain('/apple-touch-icon.png')
  })
})
