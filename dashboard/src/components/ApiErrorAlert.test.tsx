import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError, type ApiErrorDetails } from '../lib/api'
import { ApiErrorAlert } from './ApiErrorAlert'

describe('ApiErrorAlert', () => {
  it('renders a generic message for non-ApiError errors', () => {
    render(<ApiErrorAlert error={new Error('kaputt')} />)
    expect(screen.getByText('kaputt')).toBeInTheDocument()
  })

  it('renders the status badge and message for an ApiError without details', () => {
    render(<ApiErrorAlert error={new ApiError(500, null)} />)
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('Request fehlgeschlagen: 500')).toBeInTheDocument()
  })

  it('shows Laravel exception details with location', () => {
    const details: ApiErrorDetails = {
      message: 'Route [login] not defined.',
      exception: 'Symfony\\Component\\Routing\\Exception\\RouteNotFoundException',
      file: '/srv/analytics/routes/api.php',
      line: 42,
      trace: [{ function: 'route' }],
    }
    render(<ApiErrorAlert error={new ApiError(500, details)} />)
    expect(screen.getByText(/RouteNotFoundException/)).toBeInTheDocument()
    expect(screen.getByText(/routes\/api\.php:42/)).toBeInTheDocument()
  })

  it('renders nothing when error is null', () => {
    const { container } = render(<ApiErrorAlert error={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
