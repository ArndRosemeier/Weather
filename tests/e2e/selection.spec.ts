import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('deselecting a model removes it from chart and average, and persists', async ({ page }) => {
  await boot(page)
  await expect(page.getByTestId('legend-model')).toHaveCount(11)

  const icon = page.locator('[data-testid="model-chip"][data-model-id="icon_global"]')
  await expect(icon).toHaveAttribute('aria-checked', 'true')
  await icon.scrollIntoViewIfNeeded()
  await icon.click()

  await expect(icon).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('legend-model')).toHaveCount(10)
  await expect(page.getByTestId('hero-meta')).toContainText('10 of 10')

  await page.reload()
  await page.getByTestId('hero-temp').waitFor()
  await expect(page.getByTestId('legend-model')).toHaveCount(10)

  await page.getByRole('button', { name: 'All 11' }).click()
  await expect(page.getByTestId('legend-model')).toHaveCount(11)
})

test('at least one model always stays selected', async ({ page }) => {
  await boot(page)
  await page.getByRole('button', { name: 'AI only' }).click()
  await expect(page.getByTestId('legend-model')).toHaveCount(2)

  const chips = page.locator('[data-testid="model-chip"][aria-checked="true"]')
  await expect(chips).toHaveCount(2)
  await chips.first().click()
  await expect(page.getByTestId('legend-model')).toHaveCount(1)

  const remaining = page.locator('[data-testid="model-chip"][aria-checked="true"]')
  await remaining.click()
  await expect(page.getByTestId('legend-model')).toHaveCount(1)
})
