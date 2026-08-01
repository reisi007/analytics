import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { faviconUrl, SiteFavicon } from './SiteFavicon'

describe('faviconUrl', () => {
  it('tries common favicon paths in order', () => {
    expect(faviconUrl('reisinger.pictures', 0)).toBe('https://reisinger.pictures/favicon.ico')
    expect(faviconUrl('reisinger.pictures', 1)).toBe('https://reisinger.pictures/favicon.svg')
    expect(faviconUrl('reisinger.pictures', 2)).toBe('https://reisinger.pictures/favicon.png')
    expect(faviconUrl('reisinger.pictures', 3)).toBe('https://reisinger.pictures/apple-touch-icon.png')
  })
})

describe('SiteFavicon', () => {
  it('renders the first favicon candidate', () => {
    const { container } = render(<SiteFavicon site="reisinger.pictures" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', 'https://reisinger.pictures/favicon.ico')
  })

  it('advances to the next candidate when the favicon cannot be loaded', () => {
    const { container } = render(<SiteFavicon site="reisinger.pictures" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://reisinger.pictures/favicon.svg')
  })

  it('falls back to a letter after all candidates fail', () => {
    const { container } = render(<SiteFavicon site="reisinger.pictures" />)
    for (let i = 0; i < 4; i++) {
      fireEvent.error(container.querySelector('img')!)
    }
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('shows a globe placeholder for the empty (Alle Sites) entry without an image', () => {
    const { container } = render(<SiteFavicon site="" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
