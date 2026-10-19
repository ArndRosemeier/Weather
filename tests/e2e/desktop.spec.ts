import { expect, test } from '@playwright/test'
import { boot, collectErrors } from './helpers'

test('desktop shows the full comparison at 1440px', async ({ page }) => {
  const errors = collectErrors(page)
  await boot(page)

  await expect(page.getByTestId('hero-temp')).toHaveText(/^-?\d+°$/)
  await expect(page.getByTestId('hero-condition')).not.toHaveText('No data')
  await expect(page.getByTestId('hero-meta')).toContainText('11 of 11')

  const legend = page.getByTestId('legend-model')
  await expect(legend).toHaveCount(11)
  await expect(page.getByTestId('model-chip')).toHaveCount(11)
  await expect(page.getByTestId('day-card')).toHaveCount(7)
  await expect(page.getByTestId('comparison-row')).toHaveCount(11)
  await expect(page.getByTestId('stat-now')).not.toHaveText('—')

  await page.screenshot({ path: 'artifacts/desktop-1440.png', fullPage: true })
  expect(errors).toEqual([])
})

test('day boundaries are marked on 48-hour and 7-day views', async ({ page }) => {
  await boot(page)
  await page.locator('#hourly').screenshot({ path: 'artifacts/desktop-48h.png' })

  // Default 48 h window from 16:00 local: two midnights inside the plot.
  await expect(page.getByTestId('axis-day')).toHaveCount(3)
  await expect(page.getByTestId('day-separator')).toHaveCount(2)
  await expect(page.getByTestId('axis-hour').first()).toBeVisible()

  await page.getByTestId('range-all').click()
  // 168 hours from 16:00 touches eight calendar days; seven midnights are borders.
  await expect(page.getByTestId('axis-day')).toHaveCount(8)
  await expect(page.getByTestId('day-separator')).toHaveCount(7)
  // A week is labelled in days: no hour ticks at all.
  await expect(page.getByTestId('axis-hour')).toHaveCount(0)

  await page.locator('#hourly').screenshot({ path: 'artifacts/desktop-7day.png' })
})

test('the version and its What\'s new history are visible', async ({ page }) => {
  await boot(page)
  await expect(page.getByTestId('app-version')).toHaveText(/^v\d+\.\d{2}$/)
  await page.getByTestId('whats-new').click()

  const dialog = page.getByRole('dialog', { name: /What.?s new/ })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/Version \d+\.\d{2}/)
  await expect(dialog).toContainText('First numbered release')
  await expect(dialog.locator('.history__entry').first()).toHaveClass(/is-current/)
  await page.screenshot({ path: 'artifacts/desktop-whatsnew.png' })

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a 16-day horizon is selectable, fetched once, and coverage is in the legend', async ({ page }) => {
  const request = page.waitForRequest((url) => url.url().includes('forecast_days=16'))
  await boot(page)
  await request
  await expect(page.getByTestId('day-card')).toHaveCount(7)

  // The legend names each model and how many days it actually covers.
  await expect(page.locator('[data-testid="legend-model"][data-model-id="meteofrance_arpege_world"]')).toContainText('4.6 d')
  await expect(page.locator('[data-testid="legend-model"][data-model-id="ecmwf_ifs"]')).toContainText('16.0 d')

  await page.getByTestId('horizon-16').click()
  await expect(page.getByTestId('day-card')).toHaveCount(16)
  await page.getByTestId('range-all').click()
  await expect(page.getByTestId('axis-day')).toHaveCount(16)
  await expect(page.getByTestId('axis-hour')).toHaveCount(0)
  // Sixteen labels are staggered; no two on the same row may overlap.
  const boxes = await page.getByTestId('axis-day').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect()
      return { left: rect.left, right: rect.right, top: Math.round(rect.top) }
    }),
  )
  const rows = new Map<number, typeof boxes>()
  for (const box of boxes) rows.set(box.top, [...(rows.get(box.top) ?? []), box])
  for (const row of rows.values()) {
    for (let index = 1; index < row.length; index += 1) {
      expect(row[index]?.left ?? 0).toBeGreaterThan((row[index - 1]?.right ?? 0) - 1)
    }
  }
  await page.locator('#hourly').screenshot({ path: 'artifacts/desktop-legend.png' })

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'artifacts/desktop-16day.png', fullPage: true })
})

test('changing the horizon changes the view without refetching', async ({ page }) => {
  let forecastRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/v1/forecast')) forecastRequests += 1
  })
  await boot(page)
  const afterBoot = forecastRequests
  expect(afterBoot).toBe(1)

  await page.getByTestId('horizon-10').click()
  await expect(page.getByTestId('day-card')).toHaveCount(10)
  await page.waitForTimeout(300)
  expect(forecastRequests).toBe(afterBoot)

  await page.getByTestId('horizon-7').click()
  await expect(page.getByTestId('day-card')).toHaveCount(7)
  await page.waitForTimeout(300)
  expect(forecastRequests).toBe(afterBoot)
})

test('provider names explain the organisation behind a model', async ({ page }) => {
  await boot(page)
  const trigger = page.locator('[data-testid="provider-trigger"][data-provider-id="ecmwf"]').first()
  await trigger.scrollIntoViewIfNeeded()
  await trigger.hover()

  const tooltip = page.getByRole('tooltip')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toContainText('European Centre for Medium-Range Weather Forecasts')
  await expect(tooltip).toContainText('Reading, United Kingdom')
  await expect(tooltip).toContainText('Models here: ECMWF IFS, ECMWF AIFS')
  await expect(tooltip).toContainText('Official site')
  await page.screenshot({ path: 'artifacts/desktop-provider-tooltip.png' })

  await page.mouse.move(4, 4)
  await expect(tooltip).toBeHidden()

  // Keyboard users get the same explanation, and Escape dismisses it.
  await trigger.focus()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tooltip).toBeHidden()
})

test('hovering and keyboarding the chart exposes per-model values', async ({ page }) => {
  await boot(page)
  const plot = page.getByTestId('chart-plot')
  await plot.scrollIntoViewIfNeeded()
  await plot.hover({ position: { x: 400, y: 120 } })
  const tooltip = page.locator('.chart__tooltip')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toContainText('Average')
  await expect(tooltip.locator('li')).toHaveCount(11)
  await page.screenshot({ path: 'artifacts/desktop-chart-tooltip.png' })

  await page.mouse.move(10, 10)
  await plot.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(tooltip).toBeVisible()
})
