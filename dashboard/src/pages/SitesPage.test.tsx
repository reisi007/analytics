import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteProvider } from '../context/SiteContext'
import { ToastProvider } from '../context/ToastContext'
import type { SiteRow } from '../lib/api'
import { SitesPage } from './SitesPage'

const sitesFixture: SiteRow[] = [
  { id: 1, site: 'reisinger.pictures', aliases: ['reisinger.pictures', 'www.reisinger.pictures'], created_at: '2026-07-30T10:00:00Z' },
  { id: 2, site: 'all-the.rest', aliases: [], created_at: '2026-07-31T10:00:00Z' },
]

describe('SitesPage', () => {
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

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <SiteProvider>
            <SitesPage />
          </SiteProvider>
        </ToastProvider>
      </MemoryRouter>,
    )

  const providerResponse = (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/ingest/stats/sites') return Promise.resolve({ ok: true, status: 200, json: async () => [] })
    if (url === '/ingest/config/sites') return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    return null
  }

  it('renders the site list with names and aliases', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const provider = providerResponse(input)
      if (provider) return provider
      return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
    })
    renderPage()

    expect((await screen.findAllByText('reisinger.pictures')).length).toBeGreaterThan(0)
    expect(screen.getByText('all-the.rest')).toBeInTheDocument()
    expect(screen.getByText('www.reisinger.pictures')).toBeInTheDocument()
    expect(screen.getAllByText('–').length).toBeGreaterThan(0)
  })

  it('creates a site and reloads the list', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url === '/ingest/sites' && method === 'POST') {
        return Promise.resolve({ ok: true, status: 201, json: async () => sitesFixture[0] })
      }
      if (url === '/ingest/sites' && method === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.change(screen.getByLabelText('Site-Name'), { target: { value: '  neue.example  ' } })
    fireEvent.change(screen.getByLabelText('Aliases'), {
      target: { value: ' neue.example , www.neue.example , , sub.neue.example' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Site hinzufügen' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
      expect(post).toBeDefined()
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({
        site: 'neue.example',
        aliases: ['neue.example', 'www.neue.example', 'sub.neue.example'],
      })
    })
    const postIndex = fetchMock.mock.calls.findIndex(([, init]) => init?.method === 'POST')
    await waitFor(() => {
      const reloadCalls = fetchMock.mock.calls
        .slice(postIndex + 1)
        .filter(([input]) => String(input) === '/ingest/sites' && input !== null)
      expect(reloadCalls.length).toBeGreaterThan(0)
      expect(reloadCalls.at(-1)?.[1]?.method ?? 'GET').toBe('GET')
    })
    expect(await screen.findByText('Site angelegt')).toBeInTheDocument()
  })

  it('rejects an invalid site hostname with a toast and does not POST', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      if (String(input) === '/ingest/sites' && (init?.method ?? 'GET') === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.change(screen.getByLabelText('Site-Name'), { target: { value: 'bad domain' } })
    fireEvent.click(screen.getByRole('button', { name: 'Site hinzufügen' }))

    expect(await screen.findByText('Ungültiger Hostname')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('normalizes an uppercase scheme-prefixed hostname before submitting', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url === '/ingest/sites' && method === 'POST') {
        return Promise.resolve({ ok: true, status: 201, json: async () => sitesFixture[0] })
      }
      if (url === '/ingest/sites' && method === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.change(screen.getByLabelText('Site-Name'), { target: { value: 'HTTPS://EXAMPLE.COM' } })
    fireEvent.click(screen.getByRole('button', { name: 'Site hinzufügen' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
      expect(post).toBeDefined()
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({ site: 'example.com', aliases: [] })
    })
  })

  it('rejects a submit where every alias is invalid with a toast and does not POST', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      if (String(input) === '/ingest/sites' && (init?.method ?? 'GET') === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.change(screen.getByLabelText('Site-Name'), { target: { value: 'example.com' } })
    fireEvent.change(screen.getByLabelText('Aliases'), { target: { value: 'not a host, also_bad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Site hinzufügen' }))

    expect(await screen.findByText('Alle Aliases sind ungültig')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })

  it('edits aliases via the modal', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url === '/ingest/sites/1' && method === 'PUT') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture[0] })
      }
      if (url === '/ingest/sites' && method === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.click(screen.getAllByRole('button', { name: 'Bearbeiten' })[0])
    const modal = await screen.findByText('Site bearbeiten')
    expect(modal).toBeInTheDocument()
    expect(screen.getByText('reisinger.pictures', { selector: 'p' })).toBeInTheDocument()

    const aliasesInput = screen.getByLabelText('Aliases (kommagetrennt)') as HTMLInputElement
    expect(aliasesInput.value).toBe('reisinger.pictures, www.reisinger.pictures')

    fireEvent.change(aliasesInput, { target: { value: 'reisinger.pictures, shop.reisinger.pictures' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
      expect(put).toBeDefined()
      expect(JSON.parse(String(put?.[1]?.body))).toEqual({
        aliases: ['reisinger.pictures', 'shop.reisinger.pictures'],
      })
    })
    expect(await screen.findByText('Site aktualisiert')).toBeInTheDocument()
  })

  it('deletes a site without data', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url === '/ingest/sites/2' && method === 'DELETE') {
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) })
      }
      if (url === '/ingest/sites' && method === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findByText('all-the.rest')

    fireEvent.click(screen.getAllByRole('button', { name: 'Löschen' })[1])
    await screen.findByText('Site löschen')
    const dialog = screen.getAllByRole('dialog')[0]
    fireEvent.click(within(dialog).getByRole('button', { name: 'Löschen' }))

    await waitFor(() => {
      const del = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')
      expect(del).toBeDefined()
      expect(String(del?.[0])).toBe('/ingest/sites/2')
    })
    expect(await screen.findByText('Site gelöscht')).toBeInTheDocument()
  })

  it('deletes a site including data', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url === '/ingest/sites/1?delete_data=1' && method === 'DELETE') {
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) })
      }
      if (url === '/ingest/sites' && method === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.click(screen.getAllByRole('button', { name: 'Löschen' })[0])
    await screen.findByText('Site löschen')
    const dialog = screen.getAllByRole('dialog')[0]
    fireEvent.click(within(dialog).getByLabelText('Getrackte Daten mitlöschen (unwiderruflich)'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Löschen' }))

    await waitFor(() => {
      const del = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')
      expect(del).toBeDefined()
      expect(String(del?.[0])).toBe('/ingest/sites/1?delete_data=1')
    })
    expect(await screen.findByText('Site und Daten gelöscht')).toBeInTheDocument()
  })

  it('shows an error alert when loading fails', async () => {
    fetchMock.mockRejectedValue(new Error('Netzwerkfehler'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Netzwerkfehler')
  })

  it('shows an error toast when adding fails', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const provider = providerResponse(input)
      if (provider) return provider
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url === '/ingest/sites' && method === 'POST') {
        return Promise.reject(new Error('Site bereits vorhanden'))
      }
      if (url === '/ingest/sites' && method === 'GET') {
        return Promise.resolve({ ok: true, status: 200, json: async () => sitesFixture })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })
    renderPage()

    await screen.findAllByText('reisinger.pictures')

    fireEvent.change(screen.getByLabelText('Site-Name'), { target: { value: 'duplicate.example' } })
    fireEvent.click(screen.getByRole('button', { name: 'Site hinzufügen' }))

    expect(await screen.findByText('Site bereits vorhanden')).toBeInTheDocument()
  })
})
