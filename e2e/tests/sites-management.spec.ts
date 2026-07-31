import { expect, test, type Page } from '@playwright/test'
import { login } from '../helpers/login'

const SITE = 'e2e-sites.local'
const SITE_PATTERN = /e2e-sites\.local/
const DATA_SITE = 'e2e-sites-data.local'
const DATA_SITE_PATTERN = /e2e-sites-data\.local/

async function expectToast(page: Page, message: string) {
  await expect(page.getByText(message, { exact: true })).toBeVisible()
}

async function deleteSiteIfPresent(page: Page, pattern: RegExp) {
  await page.goto('/sites')
  await expect(page.getByRole('row', { name: /localhost/ })).toBeVisible()
  const row = page.getByRole('row', { name: pattern })
  if ((await row.count()) > 0) {
    await row.getByRole('button', { name: 'Löschen' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click()
    await expect(row).toHaveCount(0)
  }
}

async function ensureSiteExists(page: Page, site: string, pattern: RegExp) {
  await page.goto('/sites')
  await expect(page.getByRole('row', { name: /localhost/ })).toBeVisible()
  const row = page.getByRole('row', { name: pattern })
  if ((await row.count()) === 0) {
    await page.getByLabel('Site-Name').fill(site)
    await page.getByLabel('Aliases').fill(`${site},www.${site}`)
    await page.getByRole('button', { name: 'Site hinzufügen' }).click()
    await expect(row).toBeVisible()
  }
}

test('Site anlegen', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await page.getByRole('link', { name: 'Sites' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sites' })).toBeVisible()

  await deleteSiteIfPresent(page, SITE_PATTERN)

  await page.getByLabel('Site-Name').fill(SITE)
  await page.getByLabel('Aliases').fill('e2e-sites.local,www.e2e-sites.local')
  await page.getByRole('button', { name: 'Site hinzufügen' }).click()

  const row = page.getByRole('row', { name: SITE_PATTERN })
  await expect(row).toBeVisible()
  await expect(row.getByText('www.e2e-sites.local')).toBeVisible()
  await expectToast(page, 'Site angelegt')
})

test('neue Site ist im Site-Switcher sichtbar', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await ensureSiteExists(page, SITE, SITE_PATTERN)

  await page.goto('/')
  const switcher = page.getByLabel('Site auswählen')
  await expect(switcher).toContainText(SITE)
  await switcher.selectOption(SITE)
  await expect(switcher).toHaveValue(SITE)
})

test('Aliases einer Site editieren', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await ensureSiteExists(page, SITE, SITE_PATTERN)

  const row = page.getByRole('row', { name: SITE_PATTERN })
  await row.getByRole('button', { name: 'Bearbeiten' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Site bearbeiten')
  await dialog.locator('#edit-aliases').fill('e2e-sites.local,blog.e2e-sites.local')
  await dialog.getByRole('button', { name: 'Speichern' }).click()

  await expect(row.getByText('blog.e2e-sites.local')).toBeVisible()
  await expect(row.getByText('www.e2e-sites.local')).toHaveCount(0)
  await expectToast(page, 'Site aktualisiert')
})

test('Site ohne Daten löschen', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await ensureSiteExists(page, SITE, SITE_PATTERN)

  const row = page.getByRole('row', { name: SITE_PATTERN })
  await row.getByRole('button', { name: 'Löschen' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Site löschen')
  await dialog.getByRole('button', { name: 'Löschen' }).click()

  await expect(row).toHaveCount(0)
  await expectToast(page, 'Site gelöscht')
  await expect(page.getByLabel('Site auswählen')).not.toContainText(SITE)
})

test('Site mit Daten löschen', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await deleteSiteIfPresent(page, DATA_SITE_PATTERN)

  await page.getByLabel('Site-Name').fill(DATA_SITE)
  await page.getByLabel('Aliases').fill(DATA_SITE)
  await page.getByRole('button', { name: 'Site hinzufügen' }).click()

  const row = page.getByRole('row', { name: DATA_SITE_PATTERN })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Löschen' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Getrackte Daten mitlöschen (unwiderruflich)').check()
  await dialog.getByRole('button', { name: 'Löschen' }).click()

  await expect(row).toHaveCount(0)
  await expectToast(page, 'Site und Daten gelöscht')
})

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage()
  try {
    await login(page, 'admin@e2e.local', 'password')
    await deleteSiteIfPresent(page, SITE_PATTERN)
    await deleteSiteIfPresent(page, DATA_SITE_PATTERN)
  } finally {
    await page.close()
  }
})
