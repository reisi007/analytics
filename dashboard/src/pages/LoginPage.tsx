import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { login } from '../lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="card-title">Anmeldung</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">E-Mail</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Passwort</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="input input-bordered w-full"
              />
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" disabled={submitting} className={`btn btn-primary w-full ${submitting ? 'btn-disabled' : ''}`}>
              {submitting ? 'Anmelden…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
