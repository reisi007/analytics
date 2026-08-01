import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useEffect, useState } from 'react'
import { ApiErrorAlert } from '../components/ApiErrorAlert'
import { SeriesChart } from '../components/SeriesChart'
import { StatCard } from '../components/StatCard'
import { useSite } from '../context/SiteContext'
import { fetchSummary, type Summary } from '../lib/api'

function rangeOptions() {
  return [
    { days: 7, label: t`7 Tage` },
    { days: 30, label: t`30 Tage` },
    { days: 90, label: t`90 Tage` },
  ]
}

function toDateParam(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangeParams(days: number): { from: string; to: string } {
  const to = new Date()
  to.setUTCHours(0, 0, 0, 0)
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - (days - 1))
  return { from: toDateParam(from), to: toDateParam(to) }
}

export function OverviewPage() {
  const { site } = useSite()
  const [range, setRange] = useState(30)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    const { from, to } = rangeParams(range)
    fetchSummary({ site: site || undefined, from, to })
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err)
          setSummary(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [site, range])

  const totals = summary?.totals
  const ranges = rangeOptions()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{site === '' ? t`Alle Webseiten` : site}</h1>
        <div className="join">
          {ranges.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => setRange(option.days)}
              className={`btn btn-sm join-item ${range === option.days ? 'btn-active' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error != null && <ApiErrorAlert error={error} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title={t`Seitenaufrufe`} value={totals?.pageviews ?? 0} />
        <StatCard title={t`Unique Besucher`} value={totals?.unique ?? 0} />
        <StatCard title={t`Events`} value={totals?.events ?? 0} />
      </div>

      <SeriesChart series={summary?.series ?? []} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title"><Trans>Top-Seiten</Trans></h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
              <thead>
                <tr>
                  <th><Trans>Seite</Trans></th>
                  <th className="text-right"><Trans>Aufrufe</Trans></th>
                </tr>
              </thead>
              <tbody>
                {(summary?.top_pages ?? []).map((page) => (
                  <tr key={page.url}>
                    <td className="font-mono text-xs">
                      <span className="block max-w-[24rem] truncate" title={page.url}>{page.url}</span>
                    </td>
                    <td className="text-right">{page.pageviews}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title"><Trans>Top-Referrer</Trans></h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
              <thead>
                <tr>
                  <th><Trans>Referrer</Trans></th>
                  <th className="text-right"><Trans>Aufrufe</Trans></th>
                </tr>
              </thead>
              <tbody>
                {(summary?.top_referrers ?? []).map((referrer) => (
                  <tr key={referrer.referrer}>
                    <td className="font-mono text-xs">
                      <span className="block max-w-[24rem] truncate" title={referrer.referrer}>{referrer.referrer}</span>
                    </td>
                    <td className="text-right">{referrer.pageviews}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title"><Trans>Top-Events</Trans></h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
              <thead>
                <tr>
                  <th><Trans>Event</Trans></th>
                  <th className="text-right"><Trans>Anzahl</Trans></th>
                </tr>
              </thead>
              <tbody>
                {(summary?.top_events ?? []).map((event) => (
                  <tr key={event.name}>
                    <td className="font-mono text-xs">{event.name}</td>
                    <td className="text-right">{event.events}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
