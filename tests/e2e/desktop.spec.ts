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

  await page.getByRole('button', { name: '7 days', exact: true }).click()
  // 168 hours from 16:00 touches eight calendar days; seven midnights are borders.
  await expect(page.getByTestId('axis-day')).toHaveCount(8)
  await expect(page.getByTestId('day-separator')).toHaveCount(7)
  // A week is labelled in days: no hour ticks at all.
  await expect(page.getByTestId('axis-hour')).toHaveCount(0)

  await page.locator('#hourly').screenshot({ path: 'artifacts/desktop-7day.png' })
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
