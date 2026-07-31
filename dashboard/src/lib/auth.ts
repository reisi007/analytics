const TOKEN_KEY = 'analytics_token'
const USER_KEY = 'analytics_user'

const authListeners = new Set<() => void>()

function notifyAuthChange(): void {
  for (const listener of authListeners) listener()
}

export function onAuthChange(listener: () => void): () => void {
  authListeners.add(listener)
  return () => {
    authListeners.delete(listener)
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  notifyAuthChange()
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  notifyAuthChange()
}

export function getUser(): any | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    throw new Error('Login fehlgeschlagen')
  }
  const json = (await response.json()) as { token?: string; user?: unknown }
  if (json.token) setToken(json.token)
  if (json.user) setUser(json.user)
}

export async function logout(): Promise<void> {
  const token = getToken()
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {}
  }
  clearToken()
  clearUser()
}
