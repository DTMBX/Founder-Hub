/**
 * Hybrid Storage System
 * 
 * - Production (GitHub Pages): Reads from static /data/*.json files
 * - Development (localhost): Uses localStorage for admin editing
 * 
 * Admin panel only works on localhost. Export data to commit for deployment.
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_PREFIX = 'xtx396:'

// Map KV keys to static JSON file paths
const STATIC_DATA_MAP: Record<string, string> = {
  'founder-hub-settings': '/data/settings.json',
  'founder-hub-sections': '/data/sections.json',
  'founder-hub-projects': '/data/projects.json',
  'founder-hub-court-cases': '/data/court-cases.json',
  'founder-hub-proof-links': '/data/links.json',
  'founder-hub-profile': '/data/profile.json',
  'founder-hub-about': '/data/about.json',
  'founder-hub-pdfs': '/data/documents.json',
  'founder-hub-document-types': '/data/document-types.json',
  'founder-hub-offerings': '/data/offerings.json',
  'founder-hub-investor': '/data/investor.json',
  'founder-hub-sites-config': '/data/sites.json',
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
 */
export function useKV<T>(key: string, defaultValue: T): [T, (value: T) => void] {
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

  const setStoredValue = useCallback((newValue: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newValue))
      setValue(newValue)
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

// Make kv available globally for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).spark = { kv }
}

