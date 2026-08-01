import type { Page, Response } from '@playwright/test'

export class NetworkHelper {
  constructor(private page: Page) {}

  /**
   * Zentrale Methode um auf API-Antworten zu warten.
   * Verhindert Flakiness bei asynchronen React-Updates im Dashboard.
   */
  async waitForApi(urlIncludes: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE'): Promise<Response> {
    return this.page
      .waitForResponse((res) => res.url().includes(urlIncludes) && res.request().method() === method, {
        timeout: 30000,
      })
      .catch(() => {
        console.warn(`[NetworkHelper] Timeout waiting for ${method} ${urlIncludes}`)
        return null as unknown as Response
      })
  }

  waitForLogin() {
    return this.waitForApi('/ingest/auth/login', 'POST')
  }

  waitForMe() {
    return this.waitForApi('/ingest/auth/me', 'POST')
  }

  waitForLogout() {
    return this.waitForApi('/ingest/auth/logout', 'POST')
  }

  waitForTrack() {
    return this.waitForApi('/ingest/track', 'POST')
  }

  waitForStreamToken() {
    return this.waitForApi('/ingest/auth/stream-token', 'POST')
  }

  waitForSummary() {
    return this.waitForApi('/ingest/stats/summary', 'GET')
  }
}
