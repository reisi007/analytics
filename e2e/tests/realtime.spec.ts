import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SiteHelper, uniqueSite } from '../helpers/SiteHelper'
import { SiteSwitcherHelper } from '../helpers/SiteSwitcherHelper'

const BASE_URL = 'http://localhost:8081'

let requestContext: APIRequestContext
let siteHelper: SiteHelper

test.beforeAll(async ({ playwright }) => {
  requestContext = await playwright.request.newContext({ baseURL: BASE_URL })
  siteHelper = new SiteHelper(requestContext)
})

test.afterAll(async () => {
  await siteHelper?.teardown()
  await requestContext?.dispose()
})

test('realtime page shows live counters and the activity feed', async ({ page }) => {
  await new AuthHelper(page).login()
  await page.goto('/realtime')

  await expect(page.locator('.stat', { hasText: 'Seitenaufrufe' })).toBeVisible()
  await expect(page.locator('.stat', { hasText: 'Unique Besucher' })).toBeVisible()
  await expect(page.locator('.stat', { hasText: 'Events' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aktuelle Aktivität' })).toBeVisible()
})

test('tracked event is pushed to the realtime feed via SSE', async ({ page }) => {
  const site = uniqueSite('e2e-realtime')
  await siteHelper.ensureSite(site)

  await new AuthHelper(page).login()
  await page.goto('/realtime')
  await new SiteSwitcherHelper(page).select(site)

  const eventUrl = `https://${site}/realtime-push`
  await siteHelper.track(`https://${site}/`, {
    type: 'event',
    name: 'realtime-click',
    url: eventUrl,
    payload: { source: 'e2e' },
  })

  await expect(page.getByText(eventUrl)).toBeVisible({ timeout: 10000 })
})
