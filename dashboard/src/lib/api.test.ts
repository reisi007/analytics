import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  fetchEvents,
  fetchJson,
  fetchRealtime,
  fetchSites,
  fetchSitesConfig,
  fetchSummary,
} from './api'

describe('api helpers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    localStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function headersOf(callIndex: number): Headers {
    const init = fetchMock.mock.calls[callIndex][1] as RequestInit
    return init.headers as Headers
  }

  function urlOf(callIndex: number): string {
    return String(fetchMock.mock.calls[callIndex][0])
  }

  describe('fetchJson', () => {
    it('returns parsed JSON on success', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ hello: 'world' }) })
      await expect(fetchJson<{ hello: string }>('/x')).resolves.toEqual({ hello: 'world' })
    })

    it('always sends an Accept: application/json header', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchJson('/x')
      expect(headersOf(0).get('Accept')).toBe('application/json')
    })

    it('throws an ApiError with a fallback message when the body is not JSON', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })

      await expect(fetchJson('/x')).rejects.toThrow(ApiError)
      const error = (await fetchJson('/x').catch((err: unknown) => err)) as ApiError
      expect(error.message).toBe('Request fehlgeschlagen: 500')
      expect(error.status).toBe(500)
      expect(error.details).toBeNull()
    })

    it('parses the Laravel error body into ApiError details', async () => {
      const body = JSON.stringify({
        message: 'Route [login] not defined.',
        exception: 'Symfony\\Component\\Routing\\Exception\\RouteNotFoundException',
        file: '/srv/analytics/routes/api.php',
        line: 42,
        trace: [{ function: 'route' }],
      })
      fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error', text: async () => body })

      const error = (await fetchJson('/x').catch((err: unknown) => err)) as ApiError

      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(500)
      expect(error.details?.message).toBe('Route [login] not defined.')
      expect(error.details?.exception).toBe('Symfony\\Component\\Routing\\Exception\\RouteNotFoundException')
      expect(error.details?.file).toBe('/srv/analytics/routes/api.php')
      expect(error.details?.line).toBe(42)
      expect(error.details?.trace).toHaveLength(1)
      expect(error.message).toBe('Route [login] not defined.')
    })

    it('attaches the Authorization header when a token is set', async () => {
      localStorage.setItem('analytics_token', 'test-token')
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })

      await fetchJson('/x')

      expect(headersOf(0).get('Authorization')).toBe('Bearer test-token')
      expect(headersOf(0).get('Accept')).toBe('application/json')
    })

    it('omits the Authorization header when no token is set', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })

      await fetchJson('/x')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(headersOf(0).get('Authorization')).toBeNull()
      expect(headersOf(0).get('Accept')).toBe('application/json')
    })
  })

  describe('URL construction', () => {
    it('builds the summary URL with site/from/to', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchSummary({ site: 'example.com', from: '2026-07-01', to: '2026-07-31' })
      expect(urlOf(0)).toBe('/api/stats/summary?site=example.com&from=2026-07-01&to=2026-07-31')
    })

    it('omits empty params from the summary URL', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchSummary({ site: 'example.com' })
      expect(urlOf(0)).toBe('/api/stats/summary?site=example.com')
    })

    it('omits the site param when it is null', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchSummary({ site: null })
      expect(urlOf(0)).toBe('/api/stats/summary')
    })

    it('omits the site param when it is an empty string', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchSummary({ site: '' })
      expect(urlOf(0)).toBe('/api/stats/summary')
    })

    it('builds the events URL with name and page', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchEvents({ site: 'example.com', name: 'download', page: 3 })
      expect(urlOf(0)).toBe('/api/stats/events?site=example.com&name=download&page=3')
    })

    it('builds the realtime URL with minutes', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchRealtime({ site: 'example.com', minutes: 30 })
      expect(urlOf(0)).toBe('/api/stats/realtime?site=example.com&minutes=30')
    })
  })

  describe('fetchSites', () => {
    it('hits /api/stats/sites and returns the site list', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ['reisinger.pictures', 'all-the.rest'],
      })

      await expect(fetchSites()).resolves.toEqual(['reisinger.pictures', 'all-the.rest'])
      expect(urlOf(0)).toBe('/api/stats/sites')
    })
  })

  describe('fetchSitesConfig', () => {
    it('hits /api/config/sites with the auth header and returns the aliases map', async () => {
      localStorage.setItem('analytics_token', 'test-token')
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ 'reisinger.pictures': ['stats.reisinger.pictures'] }),
      })

      await expect(fetchSitesConfig()).resolves.toEqual({ 'reisinger.pictures': ['stats.reisinger.pictures'] })

      expect(urlOf(0)).toBe('/api/config/sites')
      expect(headersOf(0).get('Authorization')).toBe('Bearer test-token')
    })
  })
})
