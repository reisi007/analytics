import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SiteHelper, uniqueSite } from '../helpers/SiteHelper'

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

test('site switcher lists all sites and "Alle Sites" aggregates', async ({ page }) => {
  await new AuthHelper(page).login()

  const switcher = page.getByLabel('Site auswählen')
  await expect(switcher).toContainText('Alle Sites')
  await expect(switcher).toContainText(SITE)

  await switcher.selectOption('')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alle Sites')
})
