/**
 * workspace-site.ts — Multi-site workspace namespace registry.
 *
 * Defines the content namespace for each managed site in the workspace.
 * Each WorkspaceSite maps a siteId to:
 *  - a deterministic KV key prefix (storageNamespace)
 *  - a set of known content keys (contentKeys)
 *  - a preview entry point
 *  - human-readable metadata
 *
 * This is ORTHOGONAL to site-context.tsx / ManagedSite which handles
 * GitHub repo routing. WorkspaceSite handles content namespacing.
 *
 * No dynamic discovery. No plugin framework. Explicit typed registry.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { loadWorkspaces, type WorkspaceDef } from './workspace-registry'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WorkspaceSite {
  /** Unique site identifier (kebab-case) */
  siteId: string
  /** Human-readable label */
  label: string
  /** KV key prefix for this site's content (e.g. 'founder-hub') */
  storageNamespace: string
  /** URL path or full URL for preview iframe */
  previewUrl: string
  /** Optional domain (informational only) */
  domain?: string
  /** Optional description */
  description?: string
  /** Whether this site has content schemas registered */
  hasSchemas: boolean
  /** Content key suffixes this site uses (without the namespace prefix) */
  contentKeys: string[]
}

// ─── Static Registry (built-in fallback) ────────────────────────────────────

/**
 * Built-in workspace sites. This is the baseline that always exists.
 * Additional sites are loaded from the dynamic workspace-registry.
 */
const STATIC_WORKSPACE_SITES: WorkspaceSite[] = [
  {
    siteId: 'founder-hub',
    label: 'Founder Hub',
    storageNamespace: 'founder-hub',
    previewUrl: '/',
    domain: 'devon-tyler.com',
    description: 'Personal founder portfolio and investor portal',
    hasSchemas: true,
    contentKeys: [
      'settings', 'sections', 'projects', 'court-cases',
      'proof-links', 'contact-links', 'profile', 'about',
      'offerings', 'investor',
    ],
  },
]

/**
 * Convert a WorkspaceDef from the registry into a WorkspaceSite.
 */
function toWorkspaceSite(ws: WorkspaceDef): WorkspaceSite {
  return {
    siteId: ws.id,
    label: ws.name,
    storageNamespace: ws.namespace,
    previewUrl: ws.previewUrl || '/',
    domain: ws.domain,
    description: ws.description,
    hasSchemas: ws.contentKeys.length > 0,
    contentKeys: ws.contentKeys.map(k => k.suffix),
  }
}

/**
 * Load all workspace sites from the dynamic registry.
 * Merges built-in sites (from STATIC_WORKSPACE_SITES) with
 * user-added workspaces from workspace-registry.
 */
export function loadAllWorkspaceSites(): WorkspaceSite[] {
  const staticIds = new Set(STATIC_WORKSPACE_SITES.map(s => s.siteId))
  let dynamic: WorkspaceSite[] = []
  try {
    const registryWorkspaces = loadWorkspaces()
    // Only add workspaces that aren't already in the static list
    dynamic = registryWorkspaces
      .filter(ws => !staticIds.has(ws.id) && ws.enabled)
      .map(toWorkspaceSite)
  } catch { /* workspace-registry not available */ }
  return [...STATIC_WORKSPACE_SITES, ...dynamic]
}

/** Exported for backward compatibility — includes only static entries */
export const WORKSPACE_SITES: WorkspaceSite[] = STATIC_WORKSPACE_SITES

/** Default site when none is selected */
export const DEFAULT_SITE_ID = 'founder-hub'

// ─── Lookup Helpers ─────────────────────────────────────────────────────────

/** Get a workspace site by ID. Checks static + dynamic entries. */
export function getWorkspaceSite(siteId: string): WorkspaceSite | undefined {
  return loadAllWorkspaceSites().find(s => s.siteId === siteId)
}

/**
 * Build a fully-qualified KV key for a site.
 * e.g. resolveKey('founder-hub', 'sections') → 'founder-hub-sections'
 */
export function resolveKey(namespace: string, suffix: string): string {
  return `${namespace}-${suffix}`
}

/**
 * Build all KV content keys for a site.
 * e.g. resolveContentKeys('founder-hub') → ['founder-hub-settings', 'founder-hub-sections', ...]
 */
export function resolveContentKeys(site: WorkspaceSite): string[] {
  return site.contentKeys.map(k => resolveKey(site.storageNamespace, k))
}

// ─── React Context ──────────────────────────────────────────────────────────

interface WorkspaceSiteContextValue {
  /** The currently active workspace site */
  activeSite: WorkspaceSite
  /** All registered workspace sites */
  sites: WorkspaceSite[]
  /** Switch to a different site. Returns false if blocked (e.g. by dirty state). */
  switchSite: (siteId: string) => boolean
  /** Whether a site switch is being guarded (dirty state check pending) */
  switchPending: string | null
  /** Confirm a pending switch (bypass dirty guard) */
  confirmSwitch: () => void
  /** Cancel a pending switch */
  cancelSwitch: () => void
  /** External dirty-state checker. Set by the admin shell. */
  setDirtyGuard: (guard: (() => boolean) | null) => void
}

const WorkspaceSiteContext = createContext<WorkspaceSiteContextValue | null>(null)

const ACTIVE_SITE_STORAGE_KEY = 'workspace-active-site'

export function WorkspaceSiteProvider({ children }: { children: ReactNode }) {
  // Load all sites dynamically (static + user-added from registry)
  const allSites = useMemo(() => loadAllWorkspaceSites(), [])

  const [activeSiteId, setActiveSiteId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SITE_STORAGE_KEY)
      if (stored && allSites.some(s => s.siteId === stored)) {
        return stored
      }
    } catch { /* ignore */ }
    return DEFAULT_SITE_ID
  })

  const [switchPending, setSwitchPending] = useState<string | null>(null)
  const [dirtyGuard, setDirtyGuard] = useState<(() => boolean) | null>(null)

  const activeSite = allSites.find(s => s.siteId === activeSiteId) ?? allSites[0]

  const switchSite = useCallback((siteId: string): boolean => {
    if (siteId === activeSiteId) return true

    const target = allSites.find(s => s.siteId === siteId)
    if (!target) return false

    // Check dirty guard
    if (dirtyGuard && dirtyGuard()) {
      setSwitchPending(siteId)
      return false
    }

    // Clean switch
    setActiveSiteId(siteId)
    localStorage.setItem(ACTIVE_SITE_STORAGE_KEY, siteId)
    setSwitchPending(null)
    return true
  }, [activeSiteId, dirtyGuard])

  const confirmSwitch = useCallback(() => {
    if (switchPending) {
      setActiveSiteId(switchPending)
      localStorage.setItem(ACTIVE_SITE_STORAGE_KEY, switchPending)
      setSwitchPending(null)
    }
  }, [switchPending])

  const cancelSwitch = useCallback(() => {
    setSwitchPending(null)
  }, [])

  const setGuard = useCallback((guard: (() => boolean) | null) => {
    setDirtyGuard(() => guard)
  }, [])

  return (
    <WorkspaceSiteContext.Provider value={{
      activeSite,
      sites: allSites,
      switchSite,
      switchPending,
      confirmSwitch,
      cancelSwitch,
      setDirtyGuard: setGuard,
    }}>
      {children}
    </WorkspaceSiteContext.Provider>
  )
}

/**
 * Access the active workspace site context.
 * Must be used within a WorkspaceSiteProvider.
 */
export function useWorkspaceSite(): WorkspaceSiteContextValue {
  const ctx = useContext(WorkspaceSiteContext)
  if (!ctx) {
    throw new Error('useWorkspaceSite must be used within a WorkspaceSiteProvider')
  }
  return ctx
}
