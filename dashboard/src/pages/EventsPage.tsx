import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useEffect, useState } from 'react'
import { ApiErrorAlert } from '../components/ApiErrorAlert'
import { useSite } from '../context/SiteContext'
import { fetchEvents, type EventRow, type Paginator } from '../lib/api'

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function EventsPage() {
  const { site } = useSite()
  const [name, setName] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginator<EventRow> | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetchEvents({ site: site || undefined, name: name || undefined, page })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err)
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
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold"><Trans>Events</Trans></h1>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setPage(1)
          }}
          placeholder={t`Event-Name filtern`}
          className="input input-bordered input-sm w-full"
        />
      </div>

      {error != null && <ApiErrorAlert error={error} />}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th><Trans>Name</Trans></th>
                  <th><Trans>URL</Trans></th>
                  <th><Trans>Payload</Trans></th>
                  <th><Trans>Zeitpunkt</Trans></th>
                </tr>
              </thead>
              <tbody>
                {(result?.data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.name}</td>
                    <td className="font-mono text-xs">
                      <span className="block max-w-[24rem] truncate" title={row.url}>{row.url}</span>
                    </td>
                    <td className="font-mono text-xs">{row.payload != null ? JSON.stringify(row.payload) : '–'}</td>
                    <td className="text-xs">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/60">
              {total > 0 ? t`${from}–${to} von ${total}` : t`Keine Events`}
            </span>
            <div className="join">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!hasPrev}
                className="btn btn-sm join-item"
              >
                <Trans>Zurück</Trans>
              </button>
              <span className="btn btn-sm join-item btn-disabled">{t`Seite ${result?.current_page ?? 1}`}</span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasNext}
                className="btn btn-sm join-item"
              >
                <Trans>Weiter</Trans>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
