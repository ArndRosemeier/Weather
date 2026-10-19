import { expect, test } from '@playwright/test'
import { boot, collectErrors } from './helpers'

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

test('phone layout at 390px has no horizontal overflow', async ({ page }) => {
  const errors = collectErrors(page)
  await boot(page)

  await expect(page.getByTestId('hero-temp')).toHaveText(/^-?\d+°$/)
  await page.screenshot({ path: 'artifacts/mobile-hero-390.png' })
  // A wide child can make a mobile browser widen its LAYOUT viewport and scale the
  // whole page down — scrollWidth then equals innerWidth and a naive overflow check
  // passes while the page is unusable. Pin the layout viewport instead.
  const layout = await page.evaluate(() => ({ innerWidth: window.innerWidth, overflow: document.documentElement.scrollWidth - window.innerWidth }))
  expect(layout.innerWidth).toBeLessThanOrEqual(430)
  expect(layout.overflow).toBeLessThanOrEqual(1)

  // The chart is readable on a phone, not scaled down to fit a wide table.
  await page.getByTestId('chart-plot').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'artifacts/mobile-chart-390.png' })

  // A week on a 390 px screen: day labels must not collide.
  await page.getByTestId('range-all').click()
  await expect(page.getByTestId('axis-day')).toHaveCount(8)
  await expect(page.getByTestId('axis-hour')).toHaveCount(0)
  // Labels are staggered across two rows on a phone; compare only same-row pairs.
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
  await page.locator('#hourly').screenshot({ path: 'artifacts/mobile-7day.png' })

  // The model picker is reachable and usable on a phone.
  await page.getByTestId('model-chip').first().scrollIntoViewIfNeeded()
  await expect(page.getByTestId('model-chip').first()).toBeVisible()

  await page.screenshot({ path: 'artifacts/mobile-390.png', fullPage: true })
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
