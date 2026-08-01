import { expect, type Locator, type Page } from '@playwright/test'

export class SiteSwitcherHelper {
  constructor(private page: Page) {}

  trigger(): Locator {
    return this.page.getByLabel('Webseite auswählen')
  }

  private async open(): Promise<void> {
    const menu = this.page.getByRole('menu')
    if (!(await menu.isVisible().catch(() => false))) {
      await this.trigger().click()
    }
    await expect(menu).toBeVisible()
  }

  async select(site: string): Promise<void> {
    await this.open()
    await this.page.getByRole('menuitem', { name: site, exact: true }).click()
  }

  async expectMenuContains(site: string): Promise<void> {
    await this.open()
    await expect(this.page.getByRole('menuitem', { name: site, exact: true })).toBeVisible()
  }

  async expectMenuExcludes(site: string): Promise<void> {
    await this.open()
    await expect(this.page.getByRole('menuitem', { name: site, exact: true })).toHaveCount(0)
  }
}
