import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchSites, fetchSitesConfig } from '../lib/api'
import { getToken, onAuthChange } from '../lib/auth'
import { detectSite, type SitesConfig } from '../lib/site'

export interface SiteContextValue {
  site: string
  setSite: (site: string) => void
  sites: string[]
  sitesConfig: SitesConfig
  loading: boolean
}

export const SiteContext = createContext<SiteContextValue>({
  site: window.location.hostname,
  setSite: () => {},
  sites: [],
  sitesConfig: {},
  loading: false,
})

export function useSite(): SiteContextValue {
  return useContext(SiteContext)
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSiteState] = useState(window.location.hostname)
  const [sites, setSites] = useState<string[]>([])
  const [sitesConfig, setSitesConfig] = useState<SitesConfig>({})
  const [loading, setLoading] = useState(false)
  const [authVersion, setAuthVersion] = useState(0)
  const explicitlySet = useRef(false)

  const setSite = (next: string) => {
    explicitlySet.current = true
    setSiteState(next)
  }

  useEffect(() => {
    return onAuthChange(() => setAuthVersion((version) => version + 1))
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!getToken()) {
      setSiteState(window.location.hostname)
      setSites([])
      setSitesConfig({})
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)
    void (async () => {
      try {
        const [config, statsSites] = await Promise.all([
          fetchSitesConfig().catch(() => ({})),
          fetchSites().catch(() => []),
        ])
        if (cancelled) return
        const merged = Array.from(new Set([...Object.keys(config), ...statsSites])).sort()
        setSitesConfig(config)
        setSites(merged)
        if (!explicitlySet.current) {
          setSiteState(detectSite(window.location.host, config))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authVersion])

  return <SiteContext.Provider value={{ site, setSite, sites, sitesConfig, loading }}>{children}</SiteContext.Provider>
}
