/**
 * Hybrid Storage System
 * 
 * - Production (GitHub Pages): Reads from static /data/*.json files
 * - Development (localhost): Uses localStorage for admin editing
 * 
 * Admin panel only works on localhost. Export data to commit for deployment.
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_PREFIX = 'founder-hub:'

// Map KV keys to static JSON file paths
const STATIC_DATA_MAP: Record<string, string> = {
  // Core content
  'founder-hub-settings': '/data/settings.json',
  'founder-hub-sections': '/data/sections.json',
  'founder-hub-projects': '/data/projects.json',
  'founder-hub-court-cases': '/data/court-cases.json',
  'founder-hub-proof-links': '/data/links.json',
  'founder-hub-contact-links': '/data/contact-links.json',
  'founder-hub-profile': '/data/profile.json',
  'founder-hub-about': '/data/about.json',
  'founder-hub-pdfs': '/data/documents.json',
  'founder-hub-document-types': '/data/document-types.json',
  'founder-hub-offerings': '/data/offerings.json',
  'founder-hub-investor': '/data/investor.json',
  // Case management
  'founder-hub-filing-types': '/data/filing-types.json',
  'founder-hub-naming-rules': '/data/naming-rules.json',
  // Multi-site
  'founder-hub-sites-config': '/data/sites.json',
  // Honor Flag Bar
  'honor-flag-bar-settings': '/data/honor-flag-bar.json',
  'honor-flag-bar-enabled': '/data/honor-flag-bar-enabled.json',
  'honor-flag-bar-animation': '/data/honor-flag-bar-animation.json',
  'honor-flag-bar-parallax': '/data/honor-flag-bar-parallax.json',
  'honor-flag-bar-rotation': '/data/honor-flag-bar-rotation.json',
  'honor-flag-bar-max-desktop': '/data/honor-flag-bar-max-desktop.json',
  'honor-flag-bar-max-mobile': '/data/honor-flag-bar-max-mobile.json',
  'honor-flag-bar-alignment': '/data/honor-flag-bar-alignment.json',
  // Visual modules
  'hero-accent-settings': '/data/hero-accent-settings.json',
  'flag-gallery-settings': '/data/flag-gallery-settings.json',
  'map-spotlight-settings': '/data/map-spotlight-settings.json',
  // Asset management
  'asset-metadata': '/data/asset-metadata.json',
  'asset-usage-policy': '/data/asset-usage-policy.json',
  // Audit trail (append-only)
  'founder-hub-audit-log': '/data/audit-log.json',
  // Frameworks (private)
  'law-firm-showcase': '/data/law-firm-showcase.json',
  'smb-template': '/data/smb-template.json',
  'agency-framework': '/data/agency-framework.json',
  // Multi-tenant site registry
  'sites:index': '/data/sites-index.json',
}

// Check if running on localhost (admin allowed)
export const isLocalhost = () => {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')
}

// Cache for static data fetches
const staticDataCache: Record<string, any> = {}

/**
 * Fetch static JSON data (production mode)
 */
async function fetchStaticData<T>(key: string): Promise<T | null> {
  const path = STATIC_DATA_MAP[key]
  if (!path) return null
  
  if (staticDataCache[key] !== undefined) {
    return staticDataCache[key]
  }
  
  try {
    const response = await fetch(path)
    if (response.ok) {
      const data = await response.json()
      staticDataCache[key] = data
      return data
    }
  } catch (error) {
    console.warn(`[fetchStaticData] Error loading ${path}:`, error)
  }
  return null
}

/**
 * React hook for hybrid storage.
 * Uses localStorage with static JSON fallback for content files.
 * Setter accepts a value OR an updater function (prev => next).
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = STORAGE_PREFIX + key
  const [value, setValue] = useState<T>(defaultValue)
  const [initialized, setInitialized] = useState(false)

  // Initialize value from appropriate source
  useEffect(() => {
    const loadData = async () => {
      try {
        const item = localStorage.getItem(storageKey)
        if (item !== null) {
          setValue(JSON.parse(item) as T)
        } else {
          // Try loading from static data as initial value
          const staticData = await fetchStaticData<T>(key)
          if (staticData !== null) {
            setValue(staticData)
            // Also save to localStorage for editing
            localStorage.setItem(storageKey, JSON.stringify(staticData))
          }
        }
      } catch (error) {
        console.warn(`[useKV] Error reading ${key}:`, error)
      }
      setInitialized(true)
    }
    loadData()
  }, [key, storageKey])

  // Sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [storageKey, defaultValue])

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setValue(prev => {
        const resolved = typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(prev)
          : newValue
        localStorage.setItem(storageKey, JSON.stringify(resolved))
        return resolved
      })
    } catch (error) {
      console.error(`[useKV] Error writing ${key}:`, error)
    }
  }, [storageKey, key])

  return [value, setStoredValue]
}

/**
 * Direct KV API (for async functions)
 */
export const kv = {
  async get<T>(key: string): Promise<T | null> {
    try {
      // Always check localStorage first (for auth data, preferences, etc.)
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      if (item !== null) {
        return JSON.parse(item) as T
      }
      // Fall back to static data for content files
      return await fetchStaticData<T>(key)
    } catch (error) {
      console.warn(`[kv.get] Error reading ${key}:`, error)
    }
    return null
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (error) {
      console.error(`[kv.set] Error writing ${key}:`, error)
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (error) {
      console.error(`[kv.delete] Error deleting ${key}:`, error)
    }
  },

  async keys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key.slice(STORAGE_PREFIX.length))
      }
    }
    return keys
  },

  async clear(): Promise<void> {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
}

/**
 * Export all localStorage data as JSON files for committing.
 * Returns a map of filename -> JSON content.
 */
export function exportDataForCommit(): Record<string, string> {
  const exports: Record<string, string> = {}
  
  for (const [kvKey, filePath] of Object.entries(STATIC_DATA_MAP)) {
    const data = localStorage.getItem(STORAGE_PREFIX + kvKey)
    if (data) {
      const filename = filePath.split('/').pop() || `${kvKey}.json`
      exports[filename] = data
    }
  }
  
  return exports
}

/**
 * Download all data as individual JSON files.
 */
export function downloadDataFiles(): void {
  const exports = exportDataForCommit()
  
  for (const [filename, content] of Object.entries(exports)) {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/**
 * Persist a single KV key to its corresponding public/data JSON file via workspace API.
 * Only works on localhost with the dev server running.
 * Returns true on success, false if file write failed or key has no mapped file.
 */
export async function persistToFile(kvKey: string): Promise<boolean> {
  if (!isLocalhost()) return false
  const filePath = STATIC_DATA_MAP[kvKey]
  if (!filePath) return false

  const raw = localStorage.getItem(STORAGE_PREFIX + kvKey)
  if (!raw) return false

  try {
    // Pretty-print for readable diffs in git
    const pretty = JSON.stringify(JSON.parse(raw), null, 2)
    const { workspaceApi } = await import('@/lib/workspace-api')
    await workspaceApi.write(`Founder-Hub/public${filePath}`, pretty)
    return true
  } catch (e) {
    console.warn(`[persistToFile] Failed for ${kvKey}:`, e)
    return false
  }
}

/**
 * Persist ALL KV data to their corresponding public/data JSON files.
 * Returns { succeeded: number, failed: string[] }.
 */
export async function persistAllToFiles(): Promise<{ succeeded: number; failed: string[] }> {
  if (!isLocalhost()) return { succeeded: 0, failed: ['Not on localhost'] }

  const { workspaceApi } = await import('@/lib/workspace-api')
  let succeeded = 0
  const failed: string[] = []

  for (const [kvKey, filePath] of Object.entries(STATIC_DATA_MAP)) {
    const raw = localStorage.getItem(STORAGE_PREFIX + kvKey)
    if (!raw) continue

    try {
      const pretty = JSON.stringify(JSON.parse(raw), null, 2)
      await workspaceApi.write(`Founder-Hub/public${filePath}`, pretty)
      succeeded++
    } catch (e) {
      failed.push(filePath)
      console.warn(`[persistAllToFiles] Failed for ${filePath}:`, e)
    }
  }

  return { succeeded, failed }
}

// Make kv available globally for backward compatibility
// Window.spark already declared in vite-end.d.ts with index signature
if (typeof window !== 'undefined') {
  window.spark = { ...window.spark, kv } as Window['spark']
}

