import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('units switch converts every surface and persists', async ({ page }) => {
  await boot(page)
  const metricTemp = (await page.getByTestId('hero-temp').textContent()) ?? ''
  await expect(page.getByTestId('stat-wind')).toContainText('km/h')

  await page.getByTestId('unit-imperial').click()
  await expect(page.getByTestId('stat-wind')).toContainText('mph')
  const imperialTemp = (await page.getByTestId('hero-temp').textContent()) ?? ''
  expect(imperialTemp).not.toBe(metricTemp)
  await expect(page.getByTestId('unit-imperial')).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await page.getByTestId('hero-temp').waitFor()
  await expect(page.getByTestId('stat-wind')).toContainText('mph')
  await expect(page.getByTestId('unit-imperial')).toHaveAttribute('aria-pressed', 'true')
})
