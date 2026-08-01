import type { APIRequestContext } from '@playwright/test'

export interface SiteRow {
  id: number
  site: string
  aliases: string[]
  created_at: string
}

export interface Summary {
  totals: { pageviews: number; unique: number; events: number }
  top_pages: { url: string; pageviews: number }[]
}

export function bearerAuth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Zentrales Session-/Site-Management über die API.
 * Holt den Admin-Token, legt Sites an, tracked Daten und räumt
 * alle angelegten Sites im teardown wieder ab.
 */
export class SiteHelper {
  private adminToken: string | null = null
  private siteNames: string[] = []

  constructor(private request: APIRequestContext) {}

  async login(email = 'admin@e2e.local', password = 'password'): Promise<string> {
    if (this.adminToken) return this.adminToken
    const res = await this.request.post('/ingest/auth/login', { data: { email, password } })
    if (!res.ok()) {
      throw new Error(`SiteHelper.login fehlgeschlagen (${res.status()}): ${await res.text()}`)
    }
    const body = (await res.json()) as { token: string }
    this.adminToken = body.token
    return body.token
  }

  getToken(): string {
    return this.adminToken ?? ''
  }

  async findSite(site: string): Promise<SiteRow | null> {
    await this.login()
    const res = await this.request.get('/ingest/sites', { headers: bearerAuth(this.adminToken!) })
    if (!res.ok()) {
      throw new Error(`GET /ingest/sites fehlgeschlagen (${res.status()}): ${await res.text()}`)
    }
    const rows = (await res.json()) as SiteRow[]
    return rows.find((row) => row.site === site) ?? null
  }

  /** Registriert einen Site-Namen für das zentrale Cleanup im teardown. */
  trackSite(site: string): void {
    if (site && !this.siteNames.includes(site)) {
      this.siteNames.push(site)
    }
  }

  /** Legt eine Site über die API an, falls sie nicht existiert. */
  async ensureSite(site: string, aliases?: string[]): Promise<SiteRow> {
    await this.login()
    this.trackSite(site)

    const existing = await this.findSite(site)
    if (existing) return existing

    const res = await this.request.post('/ingest/sites', {
      headers: { ...bearerAuth(this.adminToken!), 'Content-Type': 'application/json' },
      data: { site, aliases: aliases ?? [site, `www.${site}`] },
    })
    if (res.status() === 422) {
      const raced = await this.findSite(site)
      if (raced) return raced
    }
    if (!res.ok()) {
      throw new Error(`ensureSite fehlgeschlagen für ${site} (${res.status()}): ${await res.text()}`)
    }
    return (await res.json()) as SiteRow
  }

  /** Sendet einen Track-Request (Referer-basiert, text/plain wie der Tracker). */
  async track(referer: string, payload: object): Promise<void> {
    const res = await this.request.post('/ingest/track', {
      headers: { Referer: referer, 'Content-Type': 'text/plain' },
      data: JSON.stringify(payload),
    })
    if (res.status() !== 204) {
      throw new Error(`track fehlgeschlagen (${res.status()}): ${await res.text()}`)
    }
  }

  async summary(params: Record<string, string>): Promise<Summary> {
    await this.login()
    const res = await this.request.get('/ingest/stats/summary', {
      headers: bearerAuth(this.adminToken!),
      params,
    })
    if (!res.ok()) {
      throw new Error(`summary fehlgeschlagen (${res.status()}): ${await res.text()}`)
    }
    return (await res.json()) as Summary
  }

  /** UTC-Kalendertag-Range (from/to als YYYY-MM-DD) über einen Zeitraum vor heute. */
  utcRange(): { from: string; to: string } {
    const ts = Date.now()
    const to = new Date()
    to.setUTCDate(to.getUTCDate() + 1 + (ts % 3))
    const from = new Date(to)
    from.setUTCDate(from.getUTCDate() - (40 + (ts % 90)))
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
  }

  /** Löscht eine Site via API (404 = bereits gelöscht, kein Fehler). */
  async deleteSite(site: string, deleteData = true): Promise<void> {
    await this.login()
    const row = await this.findSite(site)
    if (!row) return
    const query = deleteData ? '?delete_data=1' : ''
    const res = await this.request.delete(`/ingest/sites/${row.id}${query}`, {
      headers: bearerAuth(this.adminToken!),
    })
    if (res.status() !== 204 && res.status() !== 404) {
      throw new Error(`deleteSite fehlgeschlagen für ${site} (${res.status()}): ${await res.text()}`)
    }
  }

  /** Löscht alle getrackten Sites (für test.afterAll). */
  async teardown(): Promise<void> {
    const sites = [...this.siteNames]
    this.siteNames = []
    for (const site of sites) {
      await this.deleteSite(site).catch((err) => {
        console.warn(`[SiteHelper] teardown: Löschen von ${site} fehlgeschlagen`, err)
      })
    }
  }
}
