import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SidebarHelper } from '../helpers/SidebarHelper'
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

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth)
}

test('kein horizontaler Scroll auf Login, Dashboard und Sites', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible()
  await expectNoHorizontalScroll(page)

  await new AuthHelper(page).login()
  await expectNoHorizontalScroll(page)

  await page.goto('/sites')
  await expect(page.getByRole('heading', { level: 1, name: 'Webseiten' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('Hamburger öffnet das Menü und navigiert zu Webseiten', async ({ page }) => {
  await new AuthHelper(page).login()

  const hamburger = page.getByLabel('Menü öffnen')
  await expect(hamburger).toBeVisible()
  await expect(page.getByRole('link', { name: 'Übersicht', exact: true })).toHaveCount(0)

  await new SidebarHelper(page).open('Webseiten')
  await expect(page).toHaveURL(/\/sites$/)

  const drawer = page.locator('#app-drawer')
  await expect(drawer).not.toBeChecked()
})

test('Menü lässt sich über das Overlay schließen', async ({ page }) => {
  await new AuthHelper(page).login()

  const sidebar = new SidebarHelper(page)
  await sidebar.openMenu()
  await sidebar.closeMenu()
})

test('Site-Switcher und Logout funktionieren auf Mobile', async ({ page }) => {
  const site = uniqueSite('e2e-mobile')
  await siteHelper.ensureSite(site)

  await new AuthHelper(page).login()

  const switcher = new SiteSwitcherHelper(page)
  await switcher.expectMenuContains(site)
  await switcher.select(site)
  await expect(switcher.trigger()).toContainText(site)

  await new AuthHelper(page).logout()
  await expect(page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible()
})
