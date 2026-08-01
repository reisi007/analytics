import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { NetworkHelper } from '../helpers/NetworkHelper'
import { SiteHelper, uniqueSite } from '../helpers/SiteHelper'
import { SiteSwitcherHelper } from '../helpers/SiteSwitcherHelper'

const BASE_URL = 'http://localhost:8081'
const SITE = uniqueSite('e2e-track')

let requestContext: APIRequestContext
let siteHelper: SiteHelper

test.beforeAll(async ({ playwright }) => {
  requestContext = await playwright.request.newContext({ baseURL: BASE_URL })
  siteHelper = new SiteHelper(requestContext)
  await siteHelper.ensureSite(SITE)
})

test.afterAll(async () => {
  await siteHelper?.teardown()
  await requestContext?.dispose()
})

test('tracked pageview shows up in the overview stats', async ({ page }) => {
  const network = new NetworkHelper(page)

  // Die Track-Test-Seite läuft unter der isolierten Test-Site → der Server erkennt
  // die Site über den Referer ohne Abhängigkeit von Seed-/Fremd-Daten.
  const pageviewTrack = network.waitForTrack()
  await page.goto(`http://${SITE}:8081/track-test.html`)
  await page.waitForFunction(() => (window as any).__trackerLoaded === true)
  await pageviewTrack

  const eventTrack = network.waitForTrack()
  await page.click('#track-event')
  await eventTrack

  await new AuthHelper(page).login()
  await new SiteSwitcherHelper(page).select(SITE)

  const pageviews = page.locator('.stat', { hasText: 'Seitenaufrufe' }).locator('.stat-value')
  const unique = page.locator('.stat', { hasText: 'Unique Besucher' }).locator('.stat-value')
  const events = page.locator('.stat', { hasText: 'Events' }).locator('.stat-value')

  await expect(pageviews).toHaveText('1')
  await expect(unique).toHaveText('1')
  await expect(events).toHaveText('1')
})
