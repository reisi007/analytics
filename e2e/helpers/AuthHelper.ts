import { expect, type Page } from '@playwright/test'
import { NetworkHelper } from './NetworkHelper'

const DEFAULT_EMAIL = 'admin@e2e.local'
const DEFAULT_PASSWORD = 'password'

export class AuthHelper {
  private network: NetworkHelper

  constructor(private page: Page) {
    this.network = new NetworkHelper(page)
  }

  /**
   * Füllt das Login-Formular aus und sendet es ab.
   * Gibt true zurück, wenn das Backend den Login akzeptiert hat.
   */
  async attemptLogin(email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD): Promise<boolean> {
    await this.page.goto('/login')

    const emailInput = this.page.locator('input[type="email"]')
    const passwordInput = this.page.locator('input[type="password"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    await emailInput.fill(email)
    await passwordInput.fill(password)

    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/ingest/auth/login') && res.request().method() === 'POST',
    )
    await this.page.getByRole('button', { name: 'Anmelden' }).click()

    return (await responsePromise).ok()
  }

  async login(email = DEFAULT_EMAIL, password = DEFAULT_PASSWORD): Promise<void> {
    const ok = await this.attemptLogin(email, password)
    if (!ok) {
      throw new Error(`AuthHelper.login fehlgeschlagen für ${email}`)
    }
    await this.page.waitForURL('/')
    await expect(this.page.getByLabel('Webseite auswählen')).toBeVisible()
  }

  async logout(): Promise<void> {
    const logoutPromise = this.network.waitForLogout()
    await this.page.getByRole('button', { name: 'Abmelden' }).click()
    await logoutPromise
    await this.page.waitForURL('/login')
    await expect(this.page.getByRole('heading', { name: 'Anmeldung' })).toBeVisible()
  }
}
