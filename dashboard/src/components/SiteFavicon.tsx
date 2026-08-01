import { useEffect, useRef, useState } from 'react'

const FAVICON_PATHS = ['favicon.ico', 'favicon.svg', 'favicon.png', 'apple-touch-icon.png']

export function faviconUrl(site: string, index = 0): string {
  const path = FAVICON_PATHS[index] ?? FAVICON_PATHS[0]
  return `https://${site}/${path}`
}

function GlobeIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

interface SiteFaviconProps {
  site: string
  className?: string
}

export function SiteFavicon({ site, className = 'h-5 w-5' }: SiteFaviconProps) {
  const [attempt, setAttempt] = useState(0)
  const loadedRef = useRef(false)
  const exhausted = attempt >= FAVICON_PATHS.length

  useEffect(() => {
    setAttempt(0)
    loadedRef.current = false
  }, [site])

  useEffect(() => {
    if (site === '' || exhausted) return
    loadedRef.current = false
    const timer = setTimeout(() => {
      setAttempt((current) => (loadedRef.current ? current : current + 1))
    }, 4000)
    return () => clearTimeout(timer)
  }, [site, attempt, exhausted])

  if (site === '') {
    return (
      <span className={`${className} inline-flex items-center justify-center rounded bg-base-200 text-base-content/60`}>
        <GlobeIcon className="h-3.5 w-3.5" />
      </span>
    )
  }

  if (exhausted) {
    return (
      <span
        aria-hidden="true"
        className={`${className} inline-flex items-center justify-center rounded bg-base-200 text-xs font-semibold text-base-content/70`}
      >
        {site.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      key={attempt}
      src={faviconUrl(site, attempt)}
      alt=""
      className={`${className} rounded object-contain`}
      onError={() => setAttempt((current) => current + 1)}
      onLoad={() => {
        loadedRef.current = true
      }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )
}
