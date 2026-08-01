import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteProvider, useSite } from './SiteContext'

function Probe() {
  const { site, sites, setSite } = useSite()
  return (
    <div>
      <span data-testid="site">{site}</span>
      <span data-testid="sites">{sites.join(',')}</span>
      <button type="button" onClick={() => setSite('a.example')}>
        select-a
      </button>
    </div>
  )
}

describe('SiteContext', () => {
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

  it('defaults to all sites (empty selection) instead of auto-selecting a detected site', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ 'a.example': ['a.example'], 'b.example': [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ['a.example', 'b.example'] })

    render(
      <SiteProvider>
        <Probe />
      </SiteProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('sites')).toHaveTextContent('a.example,b.example'))
    expect(screen.getByTestId('site')).toHaveTextContent('')
  })

  it('keeps an explicitly selected site', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ 'a.example': ['a.example'] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ['a.example'] })

    render(
      <SiteProvider>
        <Probe />
      </SiteProvider>,
    )

    fireEvent.click(screen.getByText('select-a'))
    expect(screen.getByTestId('site')).toHaveTextContent('a.example')
  })
})
