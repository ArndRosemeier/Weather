import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('no serious or critical axe violations on desktop', async ({ page }) => {
  await boot(page)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length, help: violation.help }))
  expect(serious).toEqual([])
})
