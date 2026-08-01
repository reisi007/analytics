import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Navigations-Helper, der die Viewport-Größe abstrahiert.
 *
 * - Desktop: Die Nav-Links liegen direkt in der Navbar (`menu menu-horizontal`) und
 *   sind sichtbar → direkter Klick.
 * - Mobile: Die Links liegen im Drawer (geschlossen: `visibility: hidden`) →
 *   zuerst den Hamburger öffnen, dann klicken.
 *
 * Alle E2E-Tests nutzen diesen Helper für Nav-Klicks, damit die Specs
 * unabhängig vom Viewport dieselben Schritte verwenden.
 */
export class SidebarHelper {
  constructor(private page: Page) {}

  private get drawerToggle(): Locator {
    return this.page.locator('#app-drawer')
  }

  private get hamburger(): Locator {
    return this.page.getByLabel('Menü öffnen')
  }

  private get closeOverlay(): Locator {
    return this.page.getByLabel('Menü schließen')
  }

  private navLink(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true })
  }

  /** Navigiert zu einem Nav-Link — viewport-agnostisch. */
  async open(name: string): Promise<void> {
    const link = this.navLink(name)
    if ((await link.count()) > 0) {
      await link.click()
      return
    }
    await this.openMenu()
    await link.click()
    await expect(this.drawerToggle).not.toBeChecked()
  }

  /** Öffnet das mobile Drawer-Menü über den Hamburger. */
  async openMenu(): Promise<void> {
    await this.hamburger.click()
    await expect(this.drawerToggle).toBeChecked()
  }

  /** Schließt das mobile Drawer-Menü über das Overlay. */
  async closeMenu(): Promise<void> {
    if (await this.drawerToggle.isChecked()) {
      // Overlay am rechten Rand klicken — die Mitte liegt hinter dem Drawer-Menü.
      const width = this.page.viewportSize()?.width ?? 1000
      await this.closeOverlay.click({ position: { x: width - 10, y: 20 } })
    }
    await expect(this.drawerToggle).not.toBeChecked()
  }
}
