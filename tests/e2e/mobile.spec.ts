import { expect, test } from '@playwright/test'
import { boot, collectErrors } from './helpers'

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

test('phone layout at 390px has no horizontal overflow', async ({ page }) => {
  const errors = collectErrors(page)
  await boot(page)

  await expect(page.getByTestId('hero-temp')).toHaveText(/^-?\d+°$/)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  // The model picker is reachable and usable on a phone.
  await page.getByTestId('model-chip').first().scrollIntoViewIfNeeded()
  await expect(page.getByTestId('model-chip').first()).toBeVisible()

  await page.screenshot({ path: 'artifacts/mobile-390.png', fullPage: true })
  await page.screenshot({ path: 'artifacts/mobile-hero-390.png' })
  expect(errors).toEqual([])
})

test('the location sheet works on a phone', async ({ page }) => {
  await boot(page)
  await page.locator('.hero__place').click()
  const dialog = page.getByRole('dialog', { name: 'Choose a location' })
  await expect(dialog).toBeVisible()
  await page.getByLabel('Search for a location').fill('Oxford')
  await page.getByRole('button', { name: /Oxford/ }).first().click()
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('hero-meta')).toBeVisible()
  await expect(page.locator('.hero__place')).toContainText('Oxford')
})
