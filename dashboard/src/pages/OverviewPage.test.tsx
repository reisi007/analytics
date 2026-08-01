import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/render'
import { OverviewPage } from './OverviewPage'

const summaryFixture = {
  site: 'reisinger.pictures',
  from: '2026-07-01T00:00:00+00:00',
  to: '2026-07-31T00:00:00+00:00',
  totals: { pageviews: 150, unique: 42, events: 7 },
  series: [
    { date: '2026-07-01', pageviews: 10, unique: 5, events: 1 },
    { date: '2026-07-02', pageviews: 20, unique: 8, events: 2 },
  ],
  top_pages: [
    { url: '/', pageviews: 80 },
    { url: '/about', pageviews: 30 },
  ],
  top_referrers: [{ referrer: 'https://google.com', pageviews: 60 }],
  top_events: [{ name: 'download', events: 5 }],
}

describe('OverviewPage', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('analytics_token', 'test')
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders totals, chart and top lists from the summary', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => summaryFixture })
    renderWithProviders(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Seitenaufrufe')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('/about')).toBeInTheDocument()
    expect(screen.getByText('https://google.com')).toBeInTheDocument()
    expect(screen.getByText('download')).toBeInTheDocument()
  })

  it('shows an error alert when the request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) })
    renderWithProviders(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Request fehlgeschlagen/)).toBeInTheDocument()
  })

  it('refetches with a new range when a range button is clicked', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => summaryFixture })
    renderWithProviders(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>,
    )
    await screen.findByText('150')
    const callsBefore = fetchMock.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: '7 Tage' }))

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore))
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('/ingest/stats/summary?')
  })

  it('keeps the full URL text and title for truncated long URLs', async () => {
    const longUrl = '/shootings/akt/?subject_prefix=AKT&message=Hallo+Florian%2C%0A%0AWie+geht%27s%3F'
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ...summaryFixture, top_pages: [{ url: longUrl, pageviews: 5 }] }),
    })
    renderWithProviders(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>,
    )

    const cell = await screen.findByTitle(longUrl)
    expect(cell).toHaveTextContent(longUrl)
    expect(cell.className).toContain('truncate')
  })
})
