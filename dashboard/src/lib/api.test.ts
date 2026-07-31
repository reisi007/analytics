import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchEvents, fetchJson, fetchRealtime, fetchSummary } from './api'

describe('api helpers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchJson', () => {
    it('returns parsed JSON on success', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ hello: 'world' }) })
      await expect(fetchJson<{ hello: string }>('/x')).resolves.toEqual({ hello: 'world' })
    })

    it('throws an ApiError on non-ok responses', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) })
      await expect(fetchJson('/x')).rejects.toThrow(ApiError)
      await expect(fetchJson('/x')).rejects.toThrowError('500')
    })
  })

  describe('URL construction', () => {
    it('builds the summary URL with site/from/to', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchSummary({ site: 'example.com', from: '2026-07-01', to: '2026-07-31' })
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/stats/summary?site=example.com&from=2026-07-01&to=2026-07-31',
        undefined,
      )
    })

    it('omits empty params from the summary URL', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchSummary({ site: 'example.com' })
      expect(fetchMock).toHaveBeenCalledWith('/api/stats/summary?site=example.com', undefined)
    })

    it('builds the events URL with name and page', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchEvents({ site: 'example.com', name: 'download', page: 3 })
      expect(fetchMock).toHaveBeenCalledWith('/api/stats/events?site=example.com&name=download&page=3', undefined)
    })

    it('builds the realtime URL with minutes', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
      await fetchRealtime({ site: 'example.com', minutes: 30 })
      expect(fetchMock).toHaveBeenCalledWith('/api/stats/realtime?site=example.com&minutes=30', undefined)
    })
  })
})
