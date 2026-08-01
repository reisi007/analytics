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

export function RealtimePage() {
  const { site } = useSite()
  const [realtime, setRealtime] = useState<Realtime | null>(null)
  const [feed, setFeed] = useState<RecentActivity[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let source: EventSource | null = null
    let disposed = false

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
        setError('Verbindung getrennt – erneuter Versuch in 3s…')
        retryTimer.current = setTimeout(() => void connect(), 3000)
        return
      }

      const params = new URLSearchParams({ token: streamToken })
      if (site) params.set('site', site)
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
        } else if (isActivity(item)) {
          const entry: RecentActivity = {
            type: item.type,
            url: item.url ?? '',
            title: item.title,
            name: item.name,
            time: item.time,
          }
          setFeed((prev) => [entry, ...prev].slice(0, 50))
        }
      })
      source.addEventListener('error', () => {
        source?.close()
        setConnected(false)
        setError('Verbindung getrennt – erneuter Versuch in 3s…')
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
        <h1 className="text-lg font-semibold">Echtzeit</h1>
        <span className={`badge ${connected ? 'badge-success' : 'badge-error'}`}>{connected ? 'Live' : 'Getrennt'}</span>
        {realtime && <span className="badge badge-ghost">Fenster: {realtime.window_minutes} min</span>}
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Seitenaufrufe" value={realtime?.pageviews ?? 0} />
        <StatCard title="Unique Besucher" value={realtime?.unique ?? 0} />
        <StatCard title="Events" value={realtime?.events ?? 0} />
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Aktuelle Aktivität</h2>
          {feed.length === 0 ? (
            <p className="text-sm text-base-content/60">Noch keine Aktivität in diesem Fenster.</p>
          ) : (
            <ul className="menu menu-sm rounded-box bg-base-200 w-full">
              {feed.map((entry, index) => (
                <li key={`${entry.time}-${index}`}>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-xs ${entry.type === 'event' ? 'badge-secondary' : 'badge-primary'}`}>
                      {entry.type === 'event' ? 'Event' : 'Pageview'}
                    </span>
                    <span className="font-mono text-xs">{entry.url}</span>
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
