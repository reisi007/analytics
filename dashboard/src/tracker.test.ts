import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pageviewData, resolveApiBase, sendTrack } from './tracker'

describe('tracker', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('resolveApiBase', () => {
    it('derives the API base from the tracker script origin', () => {
      expect(resolveApiBase('https://stats.example.com/tracker.js', 'http://page.example')).toBe(
        'https://stats.example.com',
      )
    })

    it('falls back to the page origin when the script src is missing or invalid', () => {
      expect(resolveApiBase(null, 'http://page.example')).toBe('http://page.example')
      expect(resolveApiBase('not a url', 'http://page.example')).toBe('http://page.example')
    })
  })

  describe('sendTrack', () => {
    it('sends a text/plain beacon to /ingest/track', () => {
      const sendBeacon = vi.fn((_url: string, _blob: Blob) => true)
      vi.stubGlobal('navigator', { ...navigator, sendBeacon })

      sendTrack('https://stats.example.com', { type: 'pageview', url: '/', title: 'Home' })

      expect(sendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = sendBeacon.mock.calls[0]
      expect(url).toBe('https://stats.example.com/ingest/track')
      expect(blob.type).toBe('text/plain')
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('falls back to a keepalive fetch with Content-Type text/plain when the beacon is rejected', () => {
      vi.stubGlobal('navigator', { ...navigator, sendBeacon: vi.fn(() => false) })

      sendTrack('https://stats.example.com', { type: 'event', name: 'click', url: '/' })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://stats.example.com/ingest/track',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ type: 'event', name: 'click', url: '/' }),
        }),
      )
    })
  })

  describe('pageviewData', () => {
    it('strips the query string and hash from the referrer', () => {
      Object.defineProperty(document, 'referrer', {
        configurable: true,
        value: 'https://ref.example/page?utm_source=newsletter#fragment',
      })
      vi.stubGlobal('location', { pathname: '/blog', search: '?page=2' })

      const data = pageviewData()

      expect(data.referrer).toBe('https://ref.example/page')
      expect(data.url).toBe('/blog?page=2')
    })

    it('returns an empty referrer when document.referrer is empty or not parseable', () => {
      Object.defineProperty(document, 'referrer', { configurable: true, value: 'not a url' })
      expect(pageviewData().referrer).toBe('')

      Object.defineProperty(document, 'referrer', { configurable: true, value: '' })
      expect(pageviewData().referrer).toBe('')
    })
  })
})
