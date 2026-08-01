import { expect, test, type APIRequestContext } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { SiteHelper } from '../helpers/SiteHelper'
import { ToastHelper } from '../helpers/ToastHelper'

const RUN = Date.now()
const SITE = `e2e-sites-${RUN}.local`
const SITE_PATTERN = new RegExp(`e2e-sites-${RUN}\\.local`)
const SITE_CREATE = `e2e-sites-create-${RUN}.local`
const SITE_CREATE_PATTERN = new RegExp(`e2e-sites-create-${RUN}\\.local`)
const DATA_SITE = `e2e-sites-data-${RUN}.local`
const DATA_SITE_PATTERN = new RegExp(`e2e-sites-data-${RUN}\\.local`)
const BASE_URL = 'http://localhost:8081'

let requestContext: APIRequestContext
let siteHelper: SiteHelper

test.beforeAll(async ({ playwright }) => {
  requestContext = await playwright.request.newContext({ baseURL: BASE_URL })
  siteHelper = new SiteHelper(requestContext)
  await siteHelper.deleteSite(SITE_CREATE)
  await siteHelper.ensureSite(SITE)
  await siteHelper.ensureSite(DATA_SITE)
  siteHelper.trackSite(SITE_CREATE)
})

test.afterAll(async () => {
  await siteHelper?.teardown()
  await requestContext?.dispose()
})

test('Site anlegen', async ({ page }) => {
  await new AuthHelper(page).login()
  await page.getByRole('link', { name: 'Sites' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sites' })).toBeVisible()

  await page.getByLabel('Site-Name').fill(SITE_CREATE)
  await page.getByLabel('Aliases').fill(`${SITE_CREATE},www.${SITE_CREATE}`)
  await page.getByRole('button', { name: 'Site hinzufügen' }).click()

  const row = page.getByRole('row', { name: SITE_CREATE_PATTERN })
  await expect(row).toBeVisible()
  await expect(row.getByText(`www.${SITE_CREATE}`)).toBeVisible()
  await new ToastHelper(page).expectToast('Site angelegt')
})

test('neue Site ist im Site-Switcher sichtbar', async ({ page }) => {
  await new AuthHelper(page).login()

  const switcher = page.getByLabel('Site auswählen')
  await expect(switcher).toContainText(SITE)
  await switcher.selectOption(SITE)
  await expect(switcher).toHaveValue(SITE)
})

test('Aliases einer Site editieren', async ({ page }) => {
  await new AuthHelper(page).login()
  await page.goto('/sites')

  const row = page.getByRole('row', { name: SITE_PATTERN })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Bearbeiten' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Site bearbeiten')
  await dialog.locator('#edit-aliases').fill(`${SITE},blog.${SITE}`)
  await dialog.getByRole('button', { name: 'Speichern' }).click()

  await expect(row.getByText(`blog.${SITE}`)).toBeVisible()
  await expect(row.getByText(`www.${SITE}`)).toHaveCount(0)
  await new ToastHelper(page).expectToast('Site aktualisiert')
})

test('Site ohne Daten löschen', async ({ page }) => {
  await new AuthHelper(page).login()
  await page.goto('/sites')

  const row = page.getByRole('row', { name: SITE_PATTERN })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Löschen' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Site löschen')
  await dialog.getByRole('button', { name: 'Löschen' }).click()

  await expect(row).toHaveCount(0)
  await new ToastHelper(page).expectToast('Site gelöscht')
  await expect(page.getByLabel('Site auswählen')).not.toContainText(SITE)
})

test('Site mit Daten löschen', async ({ page }) => {
  await new AuthHelper(page).login()
  await page.goto('/sites')

  const row = page.getByRole('row', { name: DATA_SITE_PATTERN })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Löschen' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Getrackte Daten mitlöschen (unwiderruflich)').check()
  await dialog.getByRole('button', { name: 'Löschen' }).click()

  await expect(row).toHaveCount(0)
  await new ToastHelper(page).expectToast('Site und Daten gelöscht')
})
