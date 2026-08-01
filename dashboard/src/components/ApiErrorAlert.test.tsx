import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError, type ApiErrorDetails } from '../lib/api'
import { renderWithProviders } from '../test/render'
import { ApiErrorAlert } from './ApiErrorAlert'

describe('ApiErrorAlert', () => {
  it('renders a generic message for non-ApiError errors', () => {
    renderWithProviders(<ApiErrorAlert error={new Error('kaputt')} />)
    expect(screen.getByText('kaputt')).toBeInTheDocument()
  })

  it('renders the status badge and message for an ApiError without details', () => {
    renderWithProviders(<ApiErrorAlert error={new ApiError(500, null)} />)
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('Request fehlgeschlagen: 500')).toBeInTheDocument()
  })

  it('shows only the message without server internals', () => {
    const details: ApiErrorDetails = {
      message: 'Route [login] not defined.',
    }
    renderWithProviders(<ApiErrorAlert error={new ApiError(500, details)} />)
    expect(screen.getByText('Route [login] not defined.')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.queryByText(/RouteNotFoundException/)).not.toBeInTheDocument()
    expect(screen.queryByText(/routes\/api\.php/)).not.toBeInTheDocument()
    expect(screen.queryByRole('details')).not.toBeInTheDocument()
  })

  it('renders nothing when error is null', () => {
    const { container } = renderWithProviders(<ApiErrorAlert error={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
