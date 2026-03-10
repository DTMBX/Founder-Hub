/**
 * useClientSites — React hook for the multi-tenant site registry.
 *
 * Wraps SiteRegistry with React state management.
 * Handles:
 *  - Auto-migration from legacy single-instance keys
 *  - Persisting active site selection to localStorage
 *  - CRUD operations with automatic list refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SiteSummary, SiteType } from '@/lib/types'
import { getSiteRegistry } from '@/lib/site-registry'
import { migrateToMultiInstance, isMigrated } from '@/lib/site-migration'
import { createStorageAdapter } from '@/lib/storage-adapter'

const ACTIVE_CLIENT_SITE_KEY = 'founder-hub:active-client-site'

export function useClientSites() {
  const [sites, setSites] = useState<SiteSummary[]>([])
  const [activeSiteId, setActiveSiteIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_CLIENT_SITE_KEY)
  })
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const registryRef = useRef(getSiteRegistry())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const adapter = createStorageAdapter()

      // Run one-time migration if needed
      if (!(await isMigrated(adapter))) {
        setMigrating(true)
        await migrateToMultiInstance(adapter)
        setMigrating(false)
      }

      const list = await registryRef.current.list()
      setSites(list)

      // Validate persisted selection
      setActiveSiteIdState((prev) => {
        if (prev && list.find((s) => s.siteId === prev)) return prev
        return list.length > 0 ? list[0].siteId : null
      })
    } catch (err) {
      console.error('[useClientSites] Error loading sites:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setActiveSiteId = useCallback((id: string | null) => {
    setActiveSiteIdState(id)
    if (id) {
      localStorage.setItem(ACTIVE_CLIENT_SITE_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_CLIENT_SITE_KEY)
    }
  }, [])

  const activeSite = sites.find((s) => s.siteId === activeSiteId) ?? null

  const createSite = useCallback(
    async (type: SiteType, name: string, slug?: string) => {
      const summary = await registryRef.current.create(type, name, slug)
      await load()
      setActiveSiteId(summary.siteId)
      return summary
    },
    [load, setActiveSiteId],
  )

  const updateSite = useCallback(
    async (siteId: string, updates: Partial<Pick<SiteSummary, 'name' | 'slug' | 'status' | 'domain'>>) => {
      const updated = await registryRef.current.update(siteId, updates)
      await load()
      return updated
    },
    [load],
  )

  const deleteSite = useCallback(
    async (siteId: string) => {
      await registryRef.current.delete(siteId)
      if (activeSiteId === siteId) {
        setActiveSiteId(null)
      }
      await load()
    },
    [activeSiteId, load, setActiveSiteId],
  )

  return {
    sites,
    activeSite,
    activeSiteId,
    setActiveSiteId,
    createSite,
    updateSite,
    deleteSite,
    loading,
    migrating,
    refresh: load,
    registry: registryRef.current,
  }
}
