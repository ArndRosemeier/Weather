import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('works offline after one controlled visit', async ({ page, context }) => {
  await boot(page)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  // A second, service-worker-controlled visit caches the hashed assets.
  await page.reload()
  await page.getByTestId('hero-temp').waitFor()
  await expect(page.getByTestId('legend-model')).toHaveCount(11)

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByTestId('hero-temp')).toBeVisible()
  await expect(page.getByText(/You are offline/i)).toBeVisible()
  await expect(page.getByTestId('legend-model')).toHaveCount(11)

  await context.setOffline(false)
})

test('manifest exposes an installable app', async ({ page }) => {
  await boot(page)
  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest')
    return response.json()
  })
  expect(manifest.name).toBe('Weather Compare')
  expect(manifest.display).toBe('standalone')
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
  expect(sizes).toContain('192x192')
  expect(sizes).toContain('512x512')
  const registered = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return Boolean(registration.active)
  })
  expect(registered).toBe(true)
})
