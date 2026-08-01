import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SiteHelper, uniqueSite } from '../helpers/SiteHelper'
import { SiteSwitcherHelper } from '../helpers/SiteSwitcherHelper'

const BASE_URL = 'http://localhost:8081'
const SITE = uniqueSite('e2e-switcher')

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

test('site switcher lists all sites and "Alle Webseiten" aggregates', async ({ page }) => {
  await new AuthHelper(page).login()

  const switcher = new SiteSwitcherHelper(page)
  await switcher.expectMenuContains('Alle Webseiten')
  await switcher.expectMenuContains(SITE)

  await switcher.select('Alle Webseiten')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alle Webseiten')
})
