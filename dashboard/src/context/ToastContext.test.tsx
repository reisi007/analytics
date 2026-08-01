import { act, fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/render'
import { ToastProvider, useToast } from './ToastContext'

function TestConsumer() {
  const toast = useToast()
  return (
    <div>
      <button type="button" onClick={() => toast.error('Fehlermeldung')}>
        Fehler zeigen
      </button>
      <button type="button" onClick={() => toast.success('Erfolgreich')}>
        Erfolg zeigen
      </button>
    </div>
  )
}

function OutsideConsumer() {
  useToast()
  return null
}

describe('ToastContext', () => {
  it('renders toasts with the correct alert class and container position', () => {
    const { container } = renderWithProviders(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fehler zeigen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Erfolg zeigen' }))

    expect(screen.getByText('Fehlermeldung')).toBeInTheDocument()
    expect(screen.getByText('Erfolgreich')).toBeInTheDocument()

    const errorAlert = screen.getByText('Fehlermeldung').closest('[role="alert"]')
    expect(errorAlert).toHaveClass('alert-error')

    const successAlert = screen.getByText('Erfolgreich').closest('[role="alert"]')
    expect(successAlert).toHaveClass('alert-success')

    const toastContainer = container.querySelector('.toast')
    expect(toastContainer).not.toBeNull()
    expect(toastContainer).toHaveClass('toast-top')
    expect(toastContainer).toHaveClass('toast-end')
  })

  it('auto-dismisses a toast after 5000 ms', () => {
    vi.useFakeTimers()
    try {
      renderWithProviders(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Fehler zeigen' }))
      expect(screen.getByText('Fehlermeldung')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(screen.queryByText('Fehlermeldung')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('dismisses a toast manually via the close button', () => {
    renderWithProviders(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fehler zeigen' }))
    expect(screen.getByText('Fehlermeldung')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }))

    expect(screen.queryByText('Fehlermeldung')).not.toBeInTheDocument()
  })

  it('throws when used outside the provider', () => {
    expect(() => renderWithProviders(<OutsideConsumer />)).toThrow('useToast muss innerhalb von <ToastProvider> verwendet werden')
  })
})
