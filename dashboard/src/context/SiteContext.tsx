import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchSites, fetchSitesConfig } from '../lib/api'
import { getToken, onAuthChange } from '../lib/auth'
import type { SitesConfig } from '../lib/site'

export interface SiteContextValue {
  site: string
  setSite: (site: string) => void
  sites: string[]
  sitesConfig: SitesConfig
  loading: boolean
  refresh: () => void
}

export const SiteContext = createContext<SiteContextValue>({
  site: '',
  setSite: () => {},
  sites: [],
  sitesConfig: {},
  loading: false,
  refresh: () => {},
})

export function useSite(): SiteContextValue {
  return useContext(SiteContext)
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSiteState] = useState('')
  const [sites, setSites] = useState<string[]>([])
  const [sitesConfig, setSitesConfig] = useState<SitesConfig>({})
  const [loading, setLoading] = useState(false)
  const [authVersion, setAuthVersion] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const setSite = (next: string) => {
    setSiteState(next)
  }

  const refresh = () => setRefreshVersion((version) => version + 1)

  useEffect(() => {
    return onAuthChange(() => setAuthVersion((version) => version + 1))
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!getToken()) {
      setSiteState('')
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
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authVersion, refreshVersion])

  return (
    <SiteContext.Provider value={{ site, setSite, sites, sitesConfig, loading, refresh }}>{children}</SiteContext.Provider>
  )
}
