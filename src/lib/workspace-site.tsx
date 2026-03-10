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

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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

// ─── Static Registry ────────────────────────────────────────────────────────

/**
 * The canonical workspace site registry.
 * Add new sites here as they become ready for local workspace management.
 *
 * IMPORTANT: The Founder-Hub entry uses the SAME key prefix as the existing
 * system, so zero data migration is needed.
 */
export const WORKSPACE_SITES: WorkspaceSite[] = [
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
  // Future sites will be added here:
  // {
  //   siteId: 'tillerstead',
  //   label: 'Tillerstead',
  //   storageNamespace: 'tillerstead',
  //   previewUrl: 'http://localhost:4321',
  //   domain: 'tillerstead.com',
  //   description: 'Tillerstead Ventures portfolio',
  //   hasSchemas: false,
  //   contentKeys: [],
  // },
]

/** Default site when none is selected */
export const DEFAULT_SITE_ID = 'founder-hub'

// ─── Lookup Helpers ─────────────────────────────────────────────────────────

/** Get a workspace site by ID. Returns undefined if not found. */
export function getWorkspaceSite(siteId: string): WorkspaceSite | undefined {
  return WORKSPACE_SITES.find(s => s.siteId === siteId)
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
  const [activeSiteId, setActiveSiteId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_SITE_STORAGE_KEY)
      if (stored && WORKSPACE_SITES.some(s => s.siteId === stored)) {
        return stored
      }
    } catch { /* ignore */ }
    return DEFAULT_SITE_ID
  })

  const [switchPending, setSwitchPending] = useState<string | null>(null)
  const [dirtyGuard, setDirtyGuard] = useState<(() => boolean) | null>(null)

  const activeSite = getWorkspaceSite(activeSiteId) ?? WORKSPACE_SITES[0]

  const switchSite = useCallback((siteId: string): boolean => {
    if (siteId === activeSiteId) return true

    const target = getWorkspaceSite(siteId)
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
      sites: WORKSPACE_SITES,
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
