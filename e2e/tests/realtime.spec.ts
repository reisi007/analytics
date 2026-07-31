import { expect, test } from '@playwright/test'
import { login } from '../helpers/login'

test('realtime page shows live counters and the activity feed', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await page.goto('/realtime')

  await expect(page.locator('.stat', { hasText: 'Seitenaufrufe' })).toBeVisible()
  await expect(page.locator('.stat', { hasText: 'Unique Besucher' })).toBeVisible()
  await expect(page.locator('.stat', { hasText: 'Events' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aktuelle Aktivität' })).toBeVisible()
})
