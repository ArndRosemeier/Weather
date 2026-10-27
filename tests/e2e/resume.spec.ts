import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('showing the app again refetches instead of keeping the old state', async ({ page }) => {
  let requests = 0
  page.on('request', (request) => {
    if (request.url().includes('/v1/forecast')) requests += 1
  })

  await boot(page)
  expect(requests).toBe(1)

  // Let the resume debounce window pass, then emulate the PWA being shown again.
  await page.waitForTimeout(1600)
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => requests, { timeout: 5000 }).toBe(2)

  // A back/forward-cache restore arrives as pageshow(persisted) and must also refresh,
  // once the debounce window has passed.
  await page.waitForTimeout(1600)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
  await expect.poll(() => requests, { timeout: 5000 }).toBe(3)
})

test('reconnecting refreshes the forecast', async ({ page }) => {
  let requests = 0
  page.on('request', (request) => {
    if (request.url().includes('/v1/forecast')) requests += 1
  })
  await boot(page)
  expect(requests).toBe(1)

  await page.waitForTimeout(1600)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect.poll(() => requests, { timeout: 5000 }).toBe(2)
})
