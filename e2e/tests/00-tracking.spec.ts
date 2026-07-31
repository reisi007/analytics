import { expect, test } from '@playwright/test'
import { login } from '../helpers/login'

test('tracked pageview shows up in the overview stats', async ({ page }) => {
  await page.goto('/track-test.html')
  await page.waitForFunction(() => (window as any).__trackerLoaded === true)

  await page.click('#track-event')
  await page.waitForTimeout(500)

  await login(page, 'admin@e2e.local', 'password')
  await page.goto('/')

  const pageviews = page.locator('.stat', { hasText: 'Seitenaufrufe' }).locator('.stat-value')
  await expect(pageviews).not.toHaveText('0')
})
