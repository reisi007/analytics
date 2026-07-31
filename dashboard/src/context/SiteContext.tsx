import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchSites } from '../lib/api'
import defaultSite from '../lib/site'

export interface SiteContextValue {
  site: string
  setSite: (site: string) => void
  sites: string[]
  loading: boolean
}

export const SiteContext = createContext<SiteContextValue>({
  site: defaultSite,
  setSite: () => {},
  sites: [],
  loading: false,
})

export function useSite(): SiteContextValue {
  return useContext(SiteContext)
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState(defaultSite)
  const [sites, setSites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSites()
      .then((list) => {
        if (!cancelled) setSites(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <SiteContext.Provider value={{ site, setSite, sites, loading }}>{children}</SiteContext.Provider>
}
