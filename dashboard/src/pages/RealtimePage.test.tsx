import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RealtimePage } from './RealtimePage'

class MockEventSource {
  static instances: MockEventSource[] = []
  listeners: Record<string, Array<(event: Event) => void>> = {}
  closed = false
  url: string

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners[type] = this.listeners[type] ?? []
    this.listeners[type].push(listener)
  }

  close(): void {
    this.closed = true
  }

  emit(type: 'open' | 'error' | 'message', data?: unknown): void {
    const event = type === 'message' ? new MessageEvent('message', { data: JSON.stringify(data) }) : new Event(type)
    for (const listener of this.listeners[type] ?? []) {
      listener(event)
    }
  }
}

const streamTokenResponse = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (String(input) === '/ingest/auth/stream-token' && init?.method === 'POST') {
    return { ok: true, status: 200, json: async () => ({ token: 'stream-token' }) }
  }
  return { ok: true, status: 200, json: async () => ({}) }
}

describe('RealtimePage', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('analytics_token', 'test')
    MockEventSource.instances = []
    fetchMock.mockReset()
    fetchMock.mockImplementation(streamTokenResponse)
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('EventSource', MockEventSource)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches a stream token and opens an SSE stream for the all-sites default', async () => {
    render(
      <MemoryRouter>
        <RealtimePage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))
    expect(String(fetchMock.mock.calls[0][0])).toBe('/ingest/auth/stream-token')
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
    expect(MockEventSource.instances[0].url).toContain('/ingest/stream?')
    expect(MockEventSource.instances[0].url).toContain('token=stream-token')
    expect(MockEventSource.instances[0].url).not.toContain('site=')
  })

  it('updates counters from snapshot items and the feed from activity messages', async () => {
    render(
      <MemoryRouter>
        <RealtimePage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))
    const source = MockEventSource.instances.at(-1)!

    source.emit('message', {
      type: 'snapshot',
      data: { window_minutes: 30, pageviews: 100, unique: 25, events: 3, recent: [] },
      time: '2026-07-31T08:00:00Z',
    })

    expect(await screen.findByText('100')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    source.emit('message', {
      id: 1,
      type: 'pageview',
      site: 'reisinger.pictures',
      url: '/blog',
      title: 'Blog',
      time: '2026-07-31T08:00:01Z',
    })

    expect(await screen.findByText('/blog')).toBeInTheDocument()
  })

  it('seeds the feed from the snapshot recent activity', async () => {
    render(
      <MemoryRouter>
        <RealtimePage />
      </MemoryRouter>,
    )
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1))
    const source = MockEventSource.instances.at(-1)!

    source.emit('message', {
      type: 'snapshot',
      data: {
        window_minutes: 30,
        pageviews: 10,
        unique: 2,
        events: 1,
        recent: [{ type: 'event', name: 'download', url: '/files', time: '2026-07-31T08:00:00Z' }],
      },
      time: '2026-07-31T08:00:00Z',
    })

    expect(await screen.findByText('download')).toBeInTheDocument()
    expect(screen.getByText('/files')).toBeInTheDocument()
  })

  it('reconnects after an error event', async () => {
    vi.useFakeTimers()
    try {
      render(
        <MemoryRouter>
          <RealtimePage />
        </MemoryRouter>,
      )
      await act(async () => {})
      const first = MockEventSource.instances.at(-1)!
      first.emit('error')

      await act(async () => {
        vi.advanceTimersByTime(3000)
      })
      await act(async () => {})

      expect(MockEventSource.instances).toHaveLength(2)
      expect(MockEventSource.instances[0].closed).toBe(true)
      expect(MockEventSource.instances[1].url).toContain('/ingest/stream?')
      expect(MockEventSource.instances[1].url).toContain('token=stream-token')
    } finally {
      vi.useRealTimers()
    }
  })

  it('resumes after reconnect via last ids and deduplicates feed entries', async () => {
    vi.useFakeTimers()
    try {
      render(
        <MemoryRouter>
          <RealtimePage />
        </MemoryRouter>,
      )
      await act(async () => {})
      const first = MockEventSource.instances.at(-1)!

      await act(async () => {
        first.emit('message', {
          id: 10,
          type: 'pageview',
          url: '/a',
          title: 'A',
          time: '2026-07-31T08:00:01Z',
        })
      })
      expect(screen.getByText('/a')).toBeInTheDocument()

      await act(async () => {
        first.emit('error')
        vi.advanceTimersByTime(3000)
      })
      await act(async () => {})

      const second = MockEventSource.instances.at(-1)!
      expect(second.url).toContain('last_pv_id=10')

      await act(async () => {
        second.emit('message', {
          id: 10,
          type: 'pageview',
          url: '/a',
          title: 'A',
          time: '2026-07-31T08:00:01Z',
        })
        second.emit('message', {
          id: 11,
          type: 'pageview',
          url: '/b',
          title: 'B',
          time: '2026-07-31T08:00:02Z',
        })
      })

      expect(screen.getAllByText('/a')).toHaveLength(1)
      expect(screen.getByText('/b')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not reconnect and redirects to /login when the stream-token request returns 401', async () => {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { pathname: '/realtime', assign },
    })
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthenticated.' }),
    })

    render(
      <MemoryRouter>
        <RealtimePage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'))
    expect(localStorage.getItem('analytics_token')).toBeNull()
    expect(MockEventSource.instances).toHaveLength(0)
  })
})
