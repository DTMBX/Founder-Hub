/**
 * Hybrid Storage System
 * 
 * - Production (GitHub Pages): Reads from static /data/*.json files
 * - Development (localhost): Uses localStorage for admin editing
 * 
 * Sensitive keys (auth, sessions) are encrypted at rest via AES-256-GCM.
 * Admin panel only works on localhost. Export data to commit for deployment.
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_PREFIX = 'founder-hub:'

// Keys that are encrypted at rest in localStorage.
// Crypto module is loaded lazily to avoid circular dependency.
const SENSITIVE_KEYS = new Set([
  'founder-hub-session',
  'founder-hub-users',
  'founder-hub-pending-2fa',
  'founder-hub-login-attempts',
])

// Lazy-loaded encryption functions (crypto.ts imports are deferred to break circular dep)
let _encryptData: (<T>(data: T) => Promise<string>) | null = null
let _decryptData: (<T>(enc: string) => Promise<T>) | null = null

async function getEncryptFns() {
  if (!_encryptData) {
    const mod = await import('./crypto')
    _encryptData = mod.encryptData
    _decryptData = mod.decryptData
  }
  return { encrypt: _encryptData!, decrypt: _decryptData! as <T>(e: string) => Promise<T> }
}

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

// ── Same-tab KV change bus ──────────────────────────────────────────────────
// StorageEvent only fires cross-tab.  This bus synchronises useKV instances
// that share the same key within a single tab — prevents stale-state writes.
const kvBus = new EventTarget()

function emitKVChange(storageKey: string, value: unknown) {
  kvBus.dispatchEvent(new CustomEvent('kv', { detail: { storageKey, value } }))
}

// Cache for static data fetches
const staticDataCache: Record<string, any> = {}

// Bump this version whenever static JSON data changes to invalidate stale localStorage.
// This ensures production visitors get fresh data instead of cached old values.
const STATIC_DATA_VERSION = 4

const DATA_VERSION_KEY = 'founder-hub:__data_version__'

function checkDataVersion() {
  try {
    const stored = localStorage.getItem(DATA_VERSION_KEY)
    if (stored !== String(STATIC_DATA_VERSION)) {
      // Purge all content keys so they reload from static JSON
      for (const key of Object.keys(STATIC_DATA_MAP)) {
        localStorage.removeItem(STORAGE_PREFIX + key)
      }
      // Also clear the in-memory cache so fetchStaticData re-fetches
      for (const key of Object.keys(staticDataCache)) {
        delete staticDataCache[key]
      }
      localStorage.setItem(DATA_VERSION_KEY, String(STATIC_DATA_VERSION))
    }
  } catch { /* localStorage unavailable */ }
}

// Run once on module load
checkDataVersion()

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
          // Decrypt sensitive keys stored as enc:... blobs
          if (SENSITIVE_KEYS.has(key) && item.startsWith('enc:')) {
            const { decrypt } = await getEncryptFns()
            const decrypted = await decrypt<T>(item)
            setValue(decrypted)
          } else {
            setValue(JSON.parse(item) as T)
          }
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

  // Sync with localStorage changes (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        if (!e.newValue) {
          setValue(defaultValue)
          return
        }
        // Decrypt cross-tab updates for sensitive keys
        if (SENSITIVE_KEYS.has(key) && e.newValue.startsWith('enc:')) {
          getEncryptFns().then(({ decrypt }) => {
            decrypt<T>(e.newValue!).then(v => setValue(v)).catch(() => {})
          })
          return
        }
        setValue(e.newValue ? JSON.parse(e.newValue) : defaultValue)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [storageKey, defaultValue])

  // Sync with same-tab KV changes from other hook instances
  useEffect(() => {
    const handler = (e: Event) => {
      const { storageKey: sk, value: v } = (e as CustomEvent).detail
      if (sk === storageKey) setValue(v as T)
    }
    kvBus.addEventListener('kv', handler)
    return () => kvBus.removeEventListener('kv', handler)
  }, [storageKey])

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    try {
      setValue(prev => {
        const resolved = typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(prev)
          : newValue

        if (SENSITIVE_KEYS.has(key)) {
          // Encrypt async, then persist. State updates immediately for UI.
          getEncryptFns().then(({ encrypt }) => {
            encrypt(resolved).then(encrypted => {
              localStorage.setItem(storageKey, encrypted)
              emitKVChange(storageKey, resolved)
            }).catch(() => {
              // Fallback: plaintext (encryption not yet initialized)
              localStorage.setItem(storageKey, JSON.stringify(resolved))
              emitKVChange(storageKey, resolved)
            })
          })
        } else {
          localStorage.setItem(storageKey, JSON.stringify(resolved))
          // Notify other same-tab useKV instances
          emitKVChange(storageKey, resolved)
        }

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
        // Decrypt sensitive keys stored as enc:... blobs
        if (SENSITIVE_KEYS.has(key) && item.startsWith('enc:')) {
          const { decrypt } = await getEncryptFns()
          return await decrypt<T>(item)
        }
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
      if (SENSITIVE_KEYS.has(key)) {
        if (value === null || value === undefined) {
          localStorage.removeItem(STORAGE_PREFIX + key)
          return
        }
        const { encrypt } = await getEncryptFns()
        const encrypted = await encrypt(value)
        localStorage.setItem(STORAGE_PREFIX + key, encrypted)
      } else {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
      }
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

// ─── localStorage Quota Monitoring ──────────────────────────

const QUOTA_WARNING_THRESHOLD = 0.85 // warn at 85% usage
const ESTIMATED_QUOTA = 5 * 1024 * 1024 // 5MB typical limit

/** Returns bytes used by all localStorage entries. */
export function getStorageUsageBytes(): number {
  let bytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      // Each char in JS string = 2 bytes in UTF-16; keys + values counted
      bytes += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2
    }
  }
  return bytes
}

export interface StorageQuotaInfo {
  usedBytes: number
  estimatedQuota: number
  percentUsed: number
  warning: boolean
  critical: boolean
}

/** Snapshot of current localStorage quota usage. */
export function getStorageQuota(): StorageQuotaInfo {
  const usedBytes = getStorageUsageBytes()
  const percentUsed = usedBytes / ESTIMATED_QUOTA
  return {
    usedBytes,
    estimatedQuota: ESTIMATED_QUOTA,
    percentUsed,
    warning: percentUsed >= QUOTA_WARNING_THRESHOLD,
    critical: percentUsed >= 0.95,
  }
}

/** React hook — re-checks quota every 30 s while mounted. */
export function useStorageQuota(): StorageQuotaInfo {
  const [info, setInfo] = useState<StorageQuotaInfo>(getStorageQuota)
  useEffect(() => {
    const tick = () => setInfo(getStorageQuota())
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])
  return info
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

// ─── Workspace-Aware APIs ───────────────────────────────────────────────────

/**
 * Resolve the STATIC_DATA_MAP for a given workspace.
 * Falls back to the built-in founder-hub map for the default workspace.
 */
export function resolveStaticDataMap(workspaceId?: string): Record<string, string> {
  if (!workspaceId || workspaceId === 'founder-hub') return STATIC_DATA_MAP
  try {
    const { getWorkspace, buildStaticDataMap } = require('./workspace-registry')
    const ws = getWorkspace(workspaceId)
    if (ws) return buildStaticDataMap(ws)
  } catch { /* workspace-registry not available */ }
  return STATIC_DATA_MAP
}

/**
 * Resolve the storage prefix for a given workspace.
 */
export function resolveStoragePrefix(workspaceId?: string): string {
  if (!workspaceId || workspaceId === 'founder-hub') return STORAGE_PREFIX
  try {
    const { getWorkspace, getStoragePrefix } = require('./workspace-registry')
    const ws = getWorkspace(workspaceId)
    if (ws) return getStoragePrefix(ws)
  } catch { /* workspace-registry not available */ }
  return STORAGE_PREFIX
}

/**
 * Export data for a specific workspace.
 */
export function exportWorkspaceData(workspaceId: string): Record<string, string> {
  const dataMap = resolveStaticDataMap(workspaceId)
  const prefix = resolveStoragePrefix(workspaceId)
  const exports: Record<string, string> = {}

  for (const [kvKey, filePath] of Object.entries(dataMap)) {
    const data = localStorage.getItem(prefix + kvKey)
    if (data) {
      const filename = filePath.split('/').pop() || `${kvKey}.json`
      exports[filename] = data
    }
  }
  return exports
}

/**
 * Persist a KV key to its file for a given workspace via the workspace API.
 */
export async function persistWorkspaceFile(workspaceId: string, kvKey: string): Promise<boolean> {
  if (!isLocalhost()) return false
  const dataMap = resolveStaticDataMap(workspaceId)
  const prefix = resolveStoragePrefix(workspaceId)
  const filePath = dataMap[kvKey]
  if (!filePath) return false

  const raw = localStorage.getItem(prefix + kvKey)
  if (!raw) return false

  try {
    const pretty = JSON.stringify(JSON.parse(raw), null, 2)
    const { workspaceApi } = await import('@/lib/workspace-api')
    // Resolve the repo name from the workspace
    let repoName = 'Founder-Hub'
    try {
      const { getWorkspace } = await import('./workspace-registry')
      const ws = getWorkspace(workspaceId)
      if (ws?.localPath) repoName = ws.localPath
      else if (ws?.remote) repoName = ws.remote.repo
    } catch { /* fallback */ }
    await workspaceApi.write(`${repoName}/public${filePath}`, pretty)
    return true
  } catch (e) {
    console.warn(`[persistWorkspaceFile] Failed for ${kvKey}:`, e)
    return false
  }
}

/**
 * Persist ALL data for a workspace to files via the workspace API.
 */
export async function persistAllWorkspaceFiles(workspaceId: string): Promise<{ succeeded: number; failed: string[] }> {
  if (!isLocalhost()) return { succeeded: 0, failed: ['Not on localhost'] }

  const dataMap = resolveStaticDataMap(workspaceId)
  const prefix = resolveStoragePrefix(workspaceId)
  const { workspaceApi } = await import('@/lib/workspace-api')

  let repoName = 'Founder-Hub'
  try {
    const { getWorkspace } = await import('./workspace-registry')
    const ws = getWorkspace(workspaceId)
    if (ws?.localPath) repoName = ws.localPath
    else if (ws?.remote) repoName = ws.remote.repo
  } catch { /* fallback */ }

  let succeeded = 0
  const failed: string[] = []

  for (const [kvKey, filePath] of Object.entries(dataMap)) {
    const raw = localStorage.getItem(prefix + kvKey)
    if (!raw) continue

    try {
      const pretty = JSON.stringify(JSON.parse(raw), null, 2)
      await workspaceApi.write(`${repoName}/public${filePath}`, pretty)
      succeeded++
    } catch (e) {
      failed.push(filePath)
      console.warn(`[persistAllWorkspaceFiles] Failed for ${filePath}:`, e)
    }
  }
  return { succeeded, failed }
}

// Make kv available globally for backward compatibility
// Window.spark already declared in vite-end.d.ts with index signature
if (typeof window !== 'undefined') {
  window.spark = { ...window.spark, kv } as Window['spark']
}

