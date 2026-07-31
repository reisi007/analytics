import { useEffect, useState } from 'react'
import { fetchEvents, type EventRow, type Paginator } from '../lib/api'
import { currentSite } from '../lib/site'

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function EventsPage() {
  const site = currentSite()
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginator<EventRow> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetchEvents({ site, name: name || undefined, page })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
          setResult(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [site, name, page])

  const from = result?.from ?? 0
  const to = result?.to ?? 0
  const total = result?.total ?? 0
  const hasPrev = page > 1 && Boolean(result?.prev_page_url)
  const hasNext = Boolean(result?.next_page_url)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">Events</h1>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setPage(1)
          }}
          placeholder="Event-Name filtern"
          className="input input-bordered input-sm w-full max-w-xs"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Payload</th>
                  <th>Zeitpunkt</th>
                </tr>
              </thead>
              <tbody>
                {(result?.data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.name}</td>
                    <td className="font-mono text-xs">{row.url}</td>
                    <td className="font-mono text-xs">{row.payload != null ? JSON.stringify(row.payload) : '–'}</td>
                    <td className="text-xs">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/60">
              {total > 0 ? `${from}–${to} von ${total}` : 'Keine Events'}
            </span>
            <div className="join">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!hasPrev}
                className="btn btn-sm join-item"
              >
                Zurück
              </button>
              <span className="btn btn-sm join-item btn-disabled">Seite {result?.current_page ?? 1}</span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasNext}
                className="btn btn-sm join-item"
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
