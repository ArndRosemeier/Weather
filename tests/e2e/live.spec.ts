import fs from 'node:fs'
import { expect, test } from '@playwright/test'

test('live Open-Meteo contract holds', async ({ page }) => {
  test.skip(!process.env.LIVE, 'opt-in network spec: run with LIVE=1')
  test.setTimeout(90_000)

  const response = await page.request.get(
    'https://api.open-meteo.com/v1/forecast?latitude=52.5244&longitude=13.4105&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto&models=ecmwf_ifs,ecmwf_aifs025,gfs_global,gfs_graphcast025,icon_global,gem_global,jma_gsm,ukmo_global_deterministic_10km,meteofrance_arpege_world,cma_grapes_global,bom_access_global',
  )
  expect(response.status()).toBe(200)
  const body = await response.json()
  const ids = ['ecmwf_ifs', 'ecmwf_aifs025', 'gfs_global', 'gfs_graphcast025', 'icon_global', 'gem_global', 'jma_gsm', 'ukmo_global_deterministic_10km', 'meteofrance_arpege_world', 'cma_grapes_global', 'bom_access_global']
  const horizons = ids.map((id) => {
    const series: (number | null)[] = body.hourly[`temperature_2m_${id}`] ?? []
    return { id, hours: series.reduce<number>((last, value, index) => (value === null ? last : index + 1), 0) }
  })
  const available = horizons.filter((entry) => entry.hours > 0)
  expect(available.length).toBeGreaterThanOrEqual(6)
  const spread = Math.max(...available.map((entry) => entry.hours)) - Math.min(...available.map((entry) => entry.hours))
  expect(spread).toBeGreaterThan(24)

  await page.goto('/')
  await page.getByTestId('hero-temp').waitFor({ timeout: 30_000 })
  // Wait for the data-driven condition, then for the bitmap that is mounted AFTER
  // it: the <img> remounts when the hero family changes, so a wait started too
  // early resolves on the placeholder and screenshots a decoding image.
  await expect(page.getByTestId('hero-condition')).not.toHaveText('No data')
  await page.waitForTimeout(500)
  const heroImage = await page.locator('.hero__image').evaluate(
    (node) =>
      new Promise<{ src: string; width: number }>((resolve) => {
        const image = node as HTMLImageElement
        const report = () => resolve({ src: image.currentSrc, width: image.naturalWidth })
        if (image.complete && image.naturalWidth > 0) report()
        else image.addEventListener('load', report, { once: true })
      }),
  )
  expect(heroImage.width).toBeGreaterThan(0)
  await page.screenshot({ path: 'artifacts/live-desktop.png', fullPage: true })

  fs.mkdirSync('artifacts', { recursive: true })
  fs.writeFileSync(
    'artifacts/live-smoke.json',
    JSON.stringify({ at: new Date().toISOString(), timezone: body.timezone, horizons, available: available.length, heroImage }, null, 2),
  )
})
