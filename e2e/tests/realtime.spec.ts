import { expect, test } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'

test('realtime page shows live counters and the activity feed', async ({ page }) => {
  await new AuthHelper(page).login()
  await page.goto('/realtime')

  await expect(page.locator('.stat', { hasText: 'Seitenaufrufe' })).toBeVisible()
  await expect(page.locator('.stat', { hasText: 'Unique Besucher' })).toBeVisible()
  await expect(page.locator('.stat', { hasText: 'Events' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aktuelle Aktivität' })).toBeVisible()
})
