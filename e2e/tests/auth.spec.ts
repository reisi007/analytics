import { expect, test } from '@playwright/test'
import { AuthHelper } from '../helpers/AuthHelper'
import { ToastHelper } from '../helpers/ToastHelper'

test('unauthenticated users are redirected to /login', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('/login')
  await expect(page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible()
})

test('wrong password shows the error alert', async ({ page }) => {
  const ok = await new AuthHelper(page).attemptLogin('admin@e2e.local', 'wrong-password')
  expect(ok).toBe(false)

  await new ToastHelper(page).expectToast('Login fehlgeschlagen')
})

test('correct credentials land on / and the site switcher contains "Alle Webseiten"', async ({ page }) => {
  await new AuthHelper(page).login('admin@e2e.local', 'password')
  await expect(page.getByLabel('Site auswählen')).toContainText('Alle Webseiten')
})
