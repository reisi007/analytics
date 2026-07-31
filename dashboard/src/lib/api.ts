import { clearToken, clearUser, getToken } from './auth'
import type { SitesConfig } from './site'

export interface Totals {
  pageviews: number
  unique: number
  events: number
}

export interface SeriesPoint {
  date: string
  pageviews: number
  unique: number
  events: number
}

export interface TopPage {
  url: string
  pageviews: number
}

export interface TopReferrer {
  referrer: string
  pageviews: number
}

export interface TopEvent {
  name: string
  events: number
}

export interface Summary {
  site: string
  from: string
  to: string
  totals: Totals
  series: SeriesPoint[]
  top_pages: TopPage[]
  top_referrers: TopReferrer[]
  top_events: TopEvent[]
}

export interface EventRow {
  id: number
  name: string
  url: string
  payload: Record<string, unknown> | null
  created_at: string
}

export interface PaginatorLink {
  url: string | null
  label: string
  active: boolean
}

export interface Paginator<T> {
  data: T[]
  current_page: number
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: PaginatorLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export interface RecentActivity {
  type: 'pageview' | 'event'
  url: string
  title?: string
  name?: string
  time: string
}

export interface Realtime {
  window_minutes: number
  pageviews: number
  unique: number
  events: number
  recent: RecentActivity[]
}

export interface ApiErrorDetails {
  message: string
  exception?: string
  file?: string
  line?: number
  trace?: unknown[]
}

export class ApiError extends Error {
  readonly status: number
  readonly details: ApiErrorDetails | null

  constructor(status: number, details: ApiErrorDetails | null) {
    super(details?.message ?? `Request fehlgeschlagen: ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(headersFrom(init))
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...init, headers })

  if (response.status === 401) {
    clearToken()
    clearUser()
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  let details: ApiErrorDetails | null = null
  if (typeof response.text === 'function') {
    try {
      const body: unknown = JSON.parse(await response.text())
      if (isRecord(body) && typeof body.message === 'string') {
        details = {
          message: body.message,
          exception: typeof body.exception === 'string' ? body.exception : undefined,
          file: typeof body.file === 'string' ? body.file : undefined,
          line: typeof body.line === 'number' ? body.line : undefined,
          trace: Array.isArray(body.trace) ? body.trace : undefined,
        }
      }
    } catch {
      // body was not JSON — fall back to the generic message
    }
  }
  return new ApiError(response.status, details)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function headersFrom(init?: RequestInit): Record<string, string> {
  if (!init?.headers) return {}
  if (init.headers instanceof Headers) {
    return Object.fromEntries(init.headers.entries())
  }
  if (Array.isArray(init.headers)) {
    return Object.fromEntries(init.headers)
  }
  return init.headers as Record<string, string>
}

function buildQuery(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export interface SummaryParams {
  site?: string | null
  from?: string
  to?: string
}

export interface EventsParams {
  site?: string | null
  from?: string
  to?: string
  name?: string
  page?: number
}

export interface RealtimeParams {
  site?: string | null
  minutes?: number
}

export function summaryUrl(params: SummaryParams): string {
  return `/api/stats/summary${buildQuery(params)}`
}

export function eventsUrl(params: EventsParams): string {
  return `/api/stats/events${buildQuery(params)}`
}

export function realtimeUrl(params: RealtimeParams): string {
  return `/api/stats/realtime${buildQuery(params)}`
}

export function fetchSummary(params: SummaryParams): Promise<Summary> {
  return fetchJson<Summary>(summaryUrl(params))
}

export function fetchEvents(params: EventsParams): Promise<Paginator<EventRow>> {
  return fetchJson<Paginator<EventRow>>(eventsUrl(params))
}

export function fetchRealtime(params: RealtimeParams): Promise<Realtime> {
  return fetchJson<Realtime>(realtimeUrl(params))
}

export function fetchSites(): Promise<string[]> {
  return fetchJson<string[]>('/api/stats/sites')
}

export function fetchSitesConfig(): Promise<SitesConfig> {
  return fetchJson<SitesConfig>('/api/config/sites')
}
