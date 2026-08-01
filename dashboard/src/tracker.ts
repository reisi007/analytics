export type TrackType = 'pageview' | 'event'

export interface TrackData {
  type: TrackType
  url: string
  title?: string
  referrer?: string
  screen?: { width: number; height: number }
  lang?: string
  name?: string
  payload?: unknown
}

declare global {
  interface Window {
    trackEvent: (name: string, payload?: unknown) => void
  }
}

export function resolveApiBase(currentSrc: string | null, origin: string): string {
  if (currentSrc) {
    try {
      return new URL(currentSrc).origin
    } catch {
      return origin
    }
  }
  return origin
}

export function sendTrack(apiBase: string, data: TrackData): void {
  const url = `${apiBase}/ingest/track`
  const body = JSON.stringify(data)
  const blob = new Blob([body], { type: 'text/plain' })

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    if (navigator.sendBeacon(url, blob)) {
      return
    }
  }

  fetch(url, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'text/plain' },
    body,
  }).catch(() => {})
}

function safeReferrer(): string {
  const raw = document.referrer
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.origin + url.pathname
  } catch {
    return ''
  }
}

export function pageviewData(): TrackData {
  return {
    type: 'pageview',
    url: location.pathname + location.search,
    title: document.title,
    referrer: safeReferrer(),
    screen: { width: screen.width, height: screen.height },
    lang: navigator.language,
  }
}

export function trackEvent(name: string, payload?: unknown): void {
  sendTrack(API_BASE, {
    type: 'event',
    name,
    url: location.pathname + location.search,
    payload,
  })
}

const API_BASE = resolveApiBase((document.currentScript as HTMLScriptElement | null)?.src ?? null, location.origin)

if (typeof window !== 'undefined') {
  window.trackEvent = trackEvent
  const send = () => sendTrack(API_BASE, pageviewData())
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', send, { once: true })
  } else {
    send()
  }
}
