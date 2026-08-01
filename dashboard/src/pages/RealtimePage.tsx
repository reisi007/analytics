import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useEffect, useRef, useState } from 'react'
import { StatCard } from '../components/StatCard'
import { useSite } from '../context/SiteContext'
import { ApiError, fetchStreamToken, type Realtime, type RecentActivity } from '../lib/api'

interface StreamSnapshot {
  type: 'snapshot'
  data: Realtime
  time: string
}

interface StreamActivity {
  type: 'pageview' | 'event'
  id?: number
  site?: string
  url?: string
  title?: string
  name?: string
  payload?: unknown
  time: string
}

type StreamItem = StreamSnapshot | StreamActivity

function isActivity(item: StreamItem): item is StreamActivity {
  return item.type === 'pageview' || item.type === 'event'
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('de-DE')
}

export function RealtimePage() {
  const { site } = useSite()
  const [realtime, setRealtime] = useState<Realtime | null>(null)
  const [feed, setFeed] = useState<RecentActivity[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIds = useRef({ pv: 0, event: 0 })

  useEffect(() => {
    let source: EventSource | null = null
    let disposed = false
    lastIds.current = { pv: 0, event: 0 }
    setFeed([])

    const connect = async () => {
      if (disposed) return
      setError(null)

      let streamToken: string
      try {
        const { token } = await fetchStreamToken()
        if (disposed) return
        streamToken = token
      } catch (err) {
        if (disposed) return
        setConnected(false)
        if (err instanceof ApiError && err.status === 401) {
          return
        }
        setError(t`Verbindung getrennt – erneuter Versuch in 3s…`)
        retryTimer.current = setTimeout(() => void connect(), 3000)
        return
      }

      const params = new URLSearchParams({ token: streamToken })
      if (site) params.set('site', site)
      if (lastIds.current.pv > 0) params.set('last_pv_id', String(lastIds.current.pv))
      if (lastIds.current.event > 0) params.set('last_event_id', String(lastIds.current.event))
      source = new EventSource(`/ingest/stream?${params.toString()}`)
      source.addEventListener('open', () => setConnected(true))
      source.addEventListener('message', (event) => {
        let item: StreamItem
        try {
          item = JSON.parse((event as MessageEvent<string>).data) as StreamItem
        } catch {
          return
        }
        if (item.type === 'snapshot') {
          setRealtime(item.data)
          setFeed((prev) => (prev.length > 0 ? prev : (item.data.recent ?? [])))
          for (const entry of item.data.recent ?? []) {
            if (entry.id == null) continue
            if (entry.type === 'event') {
              lastIds.current.event = Math.max(lastIds.current.event, entry.id)
            } else {
              lastIds.current.pv = Math.max(lastIds.current.pv, entry.id)
            }
          }
        } else if (isActivity(item)) {
          if (item.id != null) {
            if (item.type === 'event') {
              lastIds.current.event = Math.max(lastIds.current.event, item.id)
            } else {
              lastIds.current.pv = Math.max(lastIds.current.pv, item.id)
            }
          }
          const entry: RecentActivity = {
            type: item.type,
            id: item.id,
            url: item.url ?? '',
            title: item.title,
            name: item.name,
            time: item.time,
          }
          setFeed((prev) =>
            entry.id != null && prev.some((e) => e.id === entry.id)
              ? prev
              : [entry, ...prev].slice(0, 50),
          )
        }
      })
      source.addEventListener('error', () => {
        source?.close()
        setConnected(false)
        setError(t`Verbindung getrennt – erneuter Versuch in 3s…`)
        retryTimer.current = setTimeout(() => void connect(), 3000)
      })
    }

    void connect()

    return () => {
      disposed = true
      if (retryTimer.current) clearTimeout(retryTimer.current)
      source?.close()
    }
  }, [site])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold"><Trans>Echtzeit</Trans></h1>
        <span className={`badge ${connected ? 'badge-success' : 'badge-error'}`}>{connected ? t`Live` : t`Getrennt`}</span>
        {realtime && <span className="badge badge-ghost">{t`Fenster: ${realtime.window_minutes} min`}</span>}
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title={t`Seitenaufrufe`} value={realtime?.pageviews ?? 0} />
        <StatCard title={t`Unique Besucher`} value={realtime?.unique ?? 0} />
        <StatCard title={t`Events`} value={realtime?.events ?? 0} />
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title"><Trans>Aktuelle Aktivität</Trans></h2>
          {feed.length === 0 ? (
            <p className="text-sm text-base-content/60"><Trans>Noch keine Aktivität in diesem Fenster.</Trans></p>
          ) : (
            <ul className="menu menu-sm rounded-box bg-base-200 w-full">
              {feed.map((entry, index) => (
                <li key={`${entry.time}-${index}`}>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-xs ${entry.type === 'event' ? 'badge-secondary' : 'badge-primary'}`}>
                      {entry.type === 'event' ? t`Event` : t`Pageview`}
                    </span>
                    <span className="tooltip font-mono text-xs inline-block max-w-[24rem] truncate" data-tip={formatTime(entry.time)} title={entry.url}>
                      {entry.url}
                    </span>
                    <span className="text-xs text-base-content/60">
                      {entry.type === 'event' ? (entry.name ?? '') : (entry.title ?? '')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
