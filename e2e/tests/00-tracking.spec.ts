import { expect, test } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { NetworkHelper } from '../helpers/NetworkHelper'

test('tracked pageview shows up in the overview stats', async ({ page }) => {
  const network = new NetworkHelper(page)

  const pageviewTrack = network.waitForTrack()
  await page.goto('/track-test.html')
  await page.waitForFunction(() => (window as any).__trackerLoaded === true)
  await pageviewTrack

  const eventTrack = network.waitForTrack()
  await page.click('#track-event')
  await eventTrack

  await new AuthHelper(page).login()

  const pageviews = page.locator('.stat', { hasText: 'Seitenaufrufe' }).locator('.stat-value')
  const unique = page.locator('.stat', { hasText: 'Unique Besucher' }).locator('.stat-value')
  const events = page.locator('.stat', { hasText: 'Events' }).locator('.stat-value')

  await expect(pageviews).toHaveText('1')
  await expect(unique).toHaveText('1')
  await expect(events).toHaveText('1')
})
