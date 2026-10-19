import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('models with no data are shown as unavailable, never as zero', async ({ page }) => {
  // The real 2026-10-19 capture: AIFS, GraphCast and BOM returned no values.
  await boot(page, { fixtureName: 'berlin-7d.json' })

  await expect(page.getByTestId('hero-meta')).toContainText('8 of 11')
  await expect(page.getByTestId('legend-model')).toHaveCount(8)
  await expect(page.getByTestId('stat-now')).not.toHaveText('—')

  for (const id of ['ecmwf_aifs025', 'gfs_graphcast025', 'bom_access_global']) {
    const chip = page.locator(`[data-testid="model-chip"][data-model-id="${id}"]`)
    await expect(chip).toHaveClass(/is-offline/)
    await expect(chip).toContainText('No data right now')
  }
  await expect(page.getByTestId('comparison-row').filter({ hasText: 'No data' })).toHaveCount(3)
})
