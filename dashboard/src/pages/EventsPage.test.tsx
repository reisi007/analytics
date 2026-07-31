import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventsPage } from './EventsPage'

const paginatorFixture = {
  data: [
    { id: 1, name: 'download', url: '/files/a.zip', payload: { file: 'a.zip' }, created_at: '2026-07-30T10:00:00Z' },
    { id: 2, name: 'signup', url: '/signup', payload: null, created_at: '2026-07-30T11:00:00Z' },
  ],
  current_page: 1,
  from: 1,
  last_page: 3,
  first_page_url: '/api/stats/events?page=1',
  last_page_url: '/api/stats/events?page=3',
  next_page_url: '/api/stats/events?site=example&page=2',
  prev_page_url: null,
  path: '/api/stats/events',
  per_page: 20,
  to: 2,
  total: 42,
  links: [],
}

describe('EventsPage', () => {
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

  it('renders event rows and payloads from the paginator', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => paginatorFixture })
    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('download')).toBeInTheDocument()
    expect(screen.getByText('/files/a.zip')).toBeInTheDocument()
    expect(screen.getByText('{"file":"a.zip"}')).toBeInTheDocument()
    expect(screen.getByText('signup')).toBeInTheDocument()
    expect(screen.getByText('1–2 von 42')).toBeInTheDocument()
  })

  it('disables prev on the first page and enables next', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => paginatorFixture })
    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('download')).toBeInTheDocument()
    const prev = screen.getByRole('button', { name: 'Zurück' })
    const next = screen.getByRole('button', { name: 'Weiter' })
    expect(prev).toBeDisabled()
    expect(next).toBeEnabled()
  })

  it('filters by name and navigates to the next page', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => paginatorFixture })
    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>,
    )
    await screen.findByText('download')

    fireEvent.change(screen.getByPlaceholderText('Event-Name filtern'), { target: { value: 'download' } })
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('name=download'))

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('page=2'))
  })
})
