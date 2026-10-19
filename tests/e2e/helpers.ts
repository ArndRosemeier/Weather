import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

const FIXTURE_DIR = path.join(process.cwd(), 'tests', 'fixtures')
export const ARTIFACTS = path.join(process.cwd(), 'artifacts')

fs.mkdirSync(ARTIFACTS, { recursive: true })

export function fixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf8')
}

export interface BootOptions {
  fixtureName?: string
  settings?: Record<string, unknown>
  forecastOverride?: string
}

/** Routes the live API to a recorded fixture, so every UI test is deterministic
 *  and no test except the opt-in live spec touches the network. */
export async function boot(page: Page, options: BootOptions = {}): Promise<void> {
  const body = options.forecastOverride ?? fixture(options.fixtureName ?? 'berlin-7d-all.json')

  await page.route('**/v1/forecast**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body, headers: { 'access-control-allow-origin': '*' } }),
  )
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
