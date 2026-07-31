import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearToken, clearUser, getToken, getUser, isAuthenticated, login, logout, setToken, setUser } from './auth'

describe('auth helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores and retrieves the token and user', () => {
    setToken('abc')
    setUser({ id: 1, email: 'a@b.c' })
    expect(getToken()).toBe('abc')
    expect(isAuthenticated()).toBe(true)
    expect(getUser()).toEqual({ id: 1, email: 'a@b.c' })
  })

  it('clearToken and clearUser reset the session', () => {
    setToken('abc')
    setUser({ id: 1 })
    clearToken()
    clearUser()
    expect(getToken()).toBeNull()
    expect(getUser()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('login stores token and user on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'jwt', user: { email: 'admin@example.com' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await login('admin@example.com', 'secret')

    expect(fetchMock).toHaveBeenCalledWith('/ingest/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'secret' }),
    })
    expect(getToken()).toBe('jwt')
    expect(getUser()).toEqual({ email: 'admin@example.com' })
  })

  it('login throws and stores nothing on a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(login('a@b.c', 'wrong')).rejects.toThrow('Login fehlgeschlagen')
    expect(getToken()).toBeNull()
    expect(getUser()).toBeNull()
  })

  it('logout calls the endpoint and clears the session', async () => {
    setToken('jwt')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await logout()

    expect(fetchMock).toHaveBeenCalledWith('/ingest/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer jwt' },
    })
    expect(getToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('logout clears the session even when the request fails', async () => {
    setToken('jwt')
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(logout()).resolves.toBeUndefined()
    expect(getToken()).toBeNull()
  })
})
