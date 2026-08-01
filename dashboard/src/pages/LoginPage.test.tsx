import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../context/ToastContext'
import { renderWithProviders } from '../test/render'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return renderWithProviders(
    <ToastProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: email } })
  fireEvent.change(screen.getByLabelText(/passwort/i), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the brand logo and name', () => {
    renderLogin()

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByAltText('Analytics Logo')).toBeInTheDocument()
  })

  it('stores the token and navigates home on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'jwt', user: { email: 'a@b.c' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderLogin()
    fillForm('a@b.c', 'secret')

    expect(await screen.findByText('Home')).toBeInTheDocument()
    expect(localStorage.getItem('analytics_token')).toBe('jwt')
  })

  it('shows an error toast on a 401 and stays on the login page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    renderLogin()
    fillForm('a@b.c', 'wrong')

    expect(await screen.findByText('Login fehlgeschlagen')).toBeInTheDocument()
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(localStorage.getItem('analytics_token')).toBeNull()
  })
})
