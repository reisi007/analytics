import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

describe('RealtimePage', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('analytics_token', 'test')
    MockEventSource.instances = []
    vi.stubGlobal('EventSource', MockEventSource)
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens an SSE stream for the current site with the auth token', () => {
    render(
      <MemoryRouter>
        <RealtimePage />
      </MemoryRouter>,
    )
    expect(MockEventSource.instances).toHaveLength(1)
    expect(MockEventSource.instances[0].url).toContain('/api/stream?')
    expect(MockEventSource.instances[0].url).toContain('token=test')
    expect(MockEventSource.instances[0].url).toContain('site=')
  })

  it('updates counters from snapshot items and the feed from activity messages', async () => {
    render(
      <MemoryRouter>
        <RealtimePage />
      </MemoryRouter>,
    )
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
      const first = MockEventSource.instances.at(-1)!
      first.emit('error')

      vi.advanceTimersByTime(3000)

      expect(MockEventSource.instances).toHaveLength(2)
      expect(MockEventSource.instances[0].closed).toBe(true)
      expect(MockEventSource.instances[1].url).toContain('/api/stream?')
      expect(MockEventSource.instances[1].url).toContain('token=test')
    } finally {
      vi.useRealTimers()
    }
  })
})
