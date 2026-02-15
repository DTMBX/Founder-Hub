import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ManagedSite, SatelliteApp, SitesConfig } from './types'

interface SiteContextValue {
  sites: ManagedSite[]
  activeSite: ManagedSite | null
  activeSatellite: SatelliteApp | null
  setActiveSite: (siteId: string) => void
  setActiveSatellite: (satelliteId: string | null) => void
  loading: boolean
  error: string | null
  refreshSites: () => Promise<void>
  
  // Computed helpers
  getActiveRepo: () => string | null
  getActiveDataPath: () => string | null
  getActiveLocalPath: () => string | null
}

const SiteContext = createContext<SiteContextValue | null>(null)

const SITES_STORAGE_KEY = 'founder-hub-sites-config'
const ACTIVE_SITE_KEY = 'founder-hub-active-site'
const ACTIVE_SATELLITE_KEY = 'founder-hub-active-satellite'

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<ManagedSite[]>([])
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null)
  const [activeSatelliteId, setActiveSatelliteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSites = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Try localStorage first
      const cached = localStorage.getItem(SITES_STORAGE_KEY)
      if (cached) {
        const config: SitesConfig = JSON.parse(cached)
        setSites(config.sites)
        
        // Load persisted active selections
        const savedSite = localStorage.getItem(ACTIVE_SITE_KEY)
        const savedSatellite = localStorage.getItem(ACTIVE_SATELLITE_KEY)
        
        setActiveSiteId(savedSite || config.activeSiteId || config.sites[0]?.id || null)
        setActiveSatelliteId(savedSatellite || null)
      } else {
        // Fallback to static file
        const response = await fetch('/data/sites.json')
        if (response.ok) {
          const config: SitesConfig = await response.json()
          setSites(config.sites)
          setActiveSiteId(config.activeSiteId || config.sites[0]?.id || null)
          
          // Cache in localStorage
          localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(config))
        } else {
          throw new Error('Failed to load sites configuration')
        }
      }
    } catch (e) {
      console.error('Error loading sites:', e)
      setError(e instanceof Error ? e.message : 'Unknown error')
      
      // Default to empty state
      setSites([])
      setActiveSiteId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSites()
  }, [])

  const setActiveSite = (siteId: string) => {
    setActiveSiteId(siteId)
    setActiveSatelliteId(null) // Reset satellite when changing site
    localStorage.setItem(ACTIVE_SITE_KEY, siteId)
    localStorage.removeItem(ACTIVE_SATELLITE_KEY)
  }

  const setActiveSatellite = (satelliteId: string | null) => {
    setActiveSatelliteId(satelliteId)
    if (satelliteId) {
      localStorage.setItem(ACTIVE_SATELLITE_KEY, satelliteId)
    } else {
      localStorage.removeItem(ACTIVE_SATELLITE_KEY)
    }
  }

  const activeSite = sites.find(s => s.id === activeSiteId) || null
  const activeSatellite = activeSite?.satellites?.find(s => s.id === activeSatelliteId) || null

  const getActiveRepo = () => {
    return activeSite?.repo || null
  }

  const getActiveDataPath = () => {
    if (activeSatellite) {
      return `${activeSatellite.path}${activeSatellite.dataPath}`
    }
    return activeSite?.dataPath || null
  }

  const getActiveLocalPath = () => {
    if (activeSatellite && activeSite) {
      return `${activeSite.localPath}/${activeSatellite.path}`
    }
    return activeSite?.localPath || null
  }

  const value: SiteContextValue = {
    sites,
    activeSite,
    activeSatellite,
    setActiveSite,
    setActiveSatellite,
    loading,
    error,
    refreshSites: loadSites,
    getActiveRepo,
    getActiveDataPath,
    getActiveLocalPath,
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider')
  }
  return context
}

// Hook for getting site-specific GitHub sync config
export function useSiteGitHub() {
  const { activeSite, activeSatellite, getActiveRepo, getActiveDataPath } = useSite()
  
  return {
    repo: getActiveRepo(),
    dataPath: getActiveDataPath(),
    owner: activeSite?.repo.split('/')[0] || null,
    repoName: activeSite?.repo.split('/')[1] || null,
    isSatellite: !!activeSatellite,
    satellitePath: activeSatellite?.path || null,
  }
}
