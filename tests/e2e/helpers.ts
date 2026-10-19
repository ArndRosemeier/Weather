import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

const FIXTURE_DIR = path.join(process.cwd(), 'tests', 'fixtures')
export const ARTIFACTS = path.join(process.cwd(), 'artifacts')

fs.mkdirSync(ARTIFACTS, { recursive: true })

export function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8')
}

function shiftDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** The app requests one day more than it displays so that "7 days" is 168 hours
 *  from now. The recorded fixture is a 7-day capture, so extend it by repeating
 *  the last day — deterministic test data, never shipped. */
function extendFixture(source: any, targetDays: number): any {
  const have = source.hourly.time.length / 24
  if (targetDays <= have) return source
  const out = structuredClone(source)
  for (let day = have; day < targetDays; day += 1) {
    const dayStart = (day - 1) * 24
    for (const [key, values] of Object.entries(out.hourly)) {
      if (key === 'time') continue
      const series = values as (number | null)[]
      for (let hour = 0; hour < 24; hour += 1) series.push(series[dayStart + hour] ?? null)
    }
    for (let hour = 0; hour < 24; hour += 1) {
      const base = out.hourly.time[dayStart + hour] as string
      out.hourly.time.push(`${shiftDate(base.slice(0, 10), day - (day - 1))}${base.slice(10)}`)
    }
    for (const [key, values] of Object.entries(out.daily)) {
      if (key === 'time') continue
      const series = values as (string | number | null)[]
      series.push(series[series.length - 1] ?? null)
    }
    out.daily.time.push(shiftDate(out.daily.time[out.daily.time.length - 1] as string, 1))
  }
  return out
}

const fixtureCache = new Map<string, string>()

export interface BootOptions {
  fixtureName?: string
  settings?: Record<string, unknown>
  forecastOverride?: string
}

/** Routes the live API to a recorded fixture, so every UI test is deterministic
 *  and no test except the opt-in live spec touches the network. */
export async function boot(page: Page, options: BootOptions = {}): Promise<void> {
  const body = options.forecastOverride ?? fixture(options.fixtureName ?? 'berlin-7d-all.json')

  await page.route('**/v1/forecast**', (route) => {
    const requested = Number(new URL(route.request().url()).searchParams.get('forecast_days') ?? '7')
    const key = `${options.fixtureName ?? 'berlin-7d-all.json'}:${requested}`
    let extended = fixtureCache.get(key)
    if (!extended) {
      extended = JSON.stringify(extendFixture(JSON.parse(body), requested))
      fixtureCache.set(key, extended)
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: extended, headers: { 'access-control-allow-origin': '*' } })
  })
  await page.route('**/v1/search**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        results: [
          { id: 1, name: 'Oxford', country: 'United Kingdom', admin1: 'England', latitude: 51.7522, longitude: -1.25596, timezone: 'Europe/London' },
          { id: 2, name: 'Oxford', country: 'United States', admin1: 'Ohio', latitude: 39.50699, longitude: -84.74523, timezone: 'America/New_York' },
        ],
      }),
    }),
  )
  // The fixtures were captured for 2026-10-19. Pin the browser clock so the
  // "now" index, and therefore every day-boundary assertion, stays deterministic.
  await page.clock.setFixedTime(new Date('2026-10-19T14:00:00Z'))

  if (options.settings) {
    await page.addInitScript((settings) => {
      window.localStorage.setItem('weather-compare:v1:settings', JSON.stringify(settings))
    }, options.settings)
  }

  await page.goto('/')
  await page.getByTestId('hero-temp').waitFor()
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

export async function chartTooltipText(page: Page, index: number): Promise<string> {
  const plot = page.getByTestId('chart-plot')
  const box = await plot.boundingBox()
  if (!box) throw new Error('chart has no box')
  const x = box.x + 60 + ((box.width - 90) * index) / 23
  await page.mouse.move(x, box.y + box.height / 2)
  const tooltip = page.locator('.chart__tooltip')
  await tooltip.waitFor()
  return (await tooltip.textContent()) ?? ''
}
