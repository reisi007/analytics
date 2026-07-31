import { expect, test } from '@playwright/test'
import { login } from '../helpers/login'

test('unauthenticated users are redirected to /login', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL('/login')
  await expect(page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible()
})

test('wrong password shows the error alert', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'admin@e2e.local')
  await page.fill('input[type="password"]', 'wrong-password')
  await page.click('button[type="submit"]')
  await expect(page.locator('.alert-error')).toHaveText('Login fehlgeschlagen')
})

test('correct credentials land on / and the site switcher contains "Alle Sites"', async ({ page }) => {
  await login(page, 'admin@e2e.local', 'password')
  await expect(page.getByLabel('Site auswählen')).toContainText('Alle Sites')
})
