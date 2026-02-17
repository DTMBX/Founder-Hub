/**
 * Offline Cache Service — xTx396 Founder Hub
 *
 * Provides offline data access for:
 * - Leads
 * - Clients
 * - Projects
 * - Subscriptions
 *
 * Features:
 * - IndexedDB for structured data
 * - Offline action queue
 * - Background sync
 * - Cache invalidation
 */

import type { CachedItem, OfflineQueueItem, OfflineStatus } from './types'

// ─── Constants ─────────────────────────────────────────────

const DB_NAME = 'xtx396-offline'
const DB_VERSION = 1
const STORES = {
  DATA: 'cached-data',
  QUEUE: 'offline-queue',
  META: 'metadata',
} as const

const CACHE_TTL = {
  leads: 5 * 60 * 1000, // 5 minutes
  clients: 10 * 60 * 1000, // 10 minutes
  projects: 10 * 60 * 1000, // 10 minutes
  subscriptions: 30 * 60 * 1000, // 30 minutes
} as const

// ─── IndexedDB Setup ───────────────────────────────────────

let db: IDBDatabase | null = null

async function openDatabase(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Cached data store
      if (!database.objectStoreNames.contains(STORES.DATA)) {
        database.createObjectStore(STORES.DATA, { keyPath: 'key' })
      }

      // Offline action queue
      if (!database.objectStoreNames.contains(STORES.QUEUE)) {
        const queueStore = database.createObjectStore(STORES.QUEUE, {
          keyPath: 'id',
        })
        queueStore.createIndex('timestamp', 'timestamp')
      }

      // Metadata store
      if (!database.objectStoreNames.contains(STORES.META)) {
        database.createObjectStore(STORES.META, { keyPath: 'key' })
      }
    }
  })
}

// ─── Cache Operations ──────────────────────────────────────

/**
 * Cache data for offline access
 */
export async function cacheData<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  const database = await openDatabase()
  const now = Date.now()

  const item: CachedItem<T> & { key: string } = {
    key,
    data,
    timestamp: now,
    expiresAt: ttl ? now + ttl : undefined,
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.DATA, 'readwrite')
    const store = transaction.objectStore(STORES.DATA)
    const request = store.put(item)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.DATA, 'readonly')
    const store = transaction.objectStore(STORES.DATA)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const item = request.result as (CachedItem<T> & { key: string }) | undefined

      if (!item) {
        resolve(null)
        return
      }

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        // Expired, delete and return null
        deleteCachedData(key)
        resolve(null)
        return
      }

      resolve(item.data)
    }
  })
}

/**
 * Delete cached data
 */
export async function deleteCachedData(key: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.DATA, 'readwrite')
    const store = transaction.objectStore(STORES.DATA)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.DATA, 'readwrite')
    const store = transaction.objectStore(STORES.DATA)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ─── Entity-Specific Caching ───────────────────────────────

/**
 * Cache leads list
 */
export async function cacheLeads(leads: unknown[]): Promise<void> {
  await cacheData('leads:list', leads, CACHE_TTL.leads)
}

/**
 * Get cached leads
 */
export async function getCachedLeads(): Promise<unknown[] | null> {
  return getCachedData<unknown[]>('leads:list')
}

/**
 * Cache clients list
 */
export async function cacheClients(clients: unknown[]): Promise<void> {
  await cacheData('clients:list', clients, CACHE_TTL.clients)
}

/**
 * Get cached clients
 */
export async function getCachedClients(): Promise<unknown[] | null> {
  return getCachedData<unknown[]>('clients:list')
}

/**
 * Cache projects list
 */
export async function cacheProjects(projects: unknown[]): Promise<void> {
  await cacheData('projects:list', projects, CACHE_TTL.projects)
}

/**
 * Get cached projects
 */
export async function getCachedProjects(): Promise<unknown[] | null> {
  return getCachedData<unknown[]>('projects:list')
}

// ─── Offline Action Queue ──────────────────────────────────

/**
 * Queue an action for when back online
 */
export async function queueOfflineAction(
  action: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>
): Promise<string> {
  const database = await openDatabase()
  const id = crypto.randomUUID()

  const item: OfflineQueueItem = {
    ...action,
    id,
    timestamp: Date.now(),
    retries: 0,
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.QUEUE)
    const request = store.add(item)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(id)
  })
}

/**
 * Get all queued actions
 */
export async function getQueuedActions(): Promise<OfflineQueueItem[]> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.QUEUE, 'readonly')
    const store = transaction.objectStore(STORES.QUEUE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

/**
 * Remove action from queue (after sync)
 */
export async function dequeueAction(id: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.QUEUE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Increment retry count for action
 */
export async function incrementRetry(id: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.QUEUE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const item = getRequest.result as OfflineQueueItem | undefined
      if (!item) {
        resolve()
        return
      }

      item.retries++
      store.put(item)
      resolve()
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

// ─── Offline Status ────────────────────────────────────────

/**
 * Get current offline status
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
  const queuedActions = await getQueuedActions()
  const lastSync = await getLastSyncTime()

  return {
    isOnline: navigator.onLine,
    queuedActions: queuedActions.length,
    lastSync,
  }
}

/**
 * Get last sync timestamp
 */
async function getLastSyncTime(): Promise<string | null> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.META, 'readonly')
    const store = transaction.objectStore(STORES.META)
    const request = store.get('lastSync')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      resolve(request.result?.value ?? null)
    }
  })
}

/**
 * Update last sync timestamp
 */
export async function setLastSyncTime(timestamp: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.META, 'readwrite')
    const store = transaction.objectStore(STORES.META)
    const request = store.put({ key: 'lastSync', value: timestamp })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ─── Online/Offline Listeners ──────────────────────────────

type OnlineCallback = (isOnline: boolean) => void
const onlineCallbacks: Set<OnlineCallback> = new Set()

/**
 * Subscribe to online/offline status changes
 */
export function subscribeToOnlineStatus(callback: OnlineCallback): () => void {
  onlineCallbacks.add(callback)

  // Initial call
  callback(navigator.onLine)

  return () => {
    onlineCallbacks.delete(callback)
  }
}

// Set up listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    onlineCallbacks.forEach((cb) => cb(true))
  })

  window.addEventListener('offline', () => {
    onlineCallbacks.forEach((cb) => cb(false))
  })
}

// ─── Background Sync ───────────────────────────────────────

/**
 * Request background sync (if supported)
 */
export async function requestBackgroundSync(tag = 'sync-offline-actions'): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready

    if ('sync' in registration) {
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag)
      console.log('[Offline] Background sync registered:', tag)
      return true
    }
  } catch (error) {
    console.error('[Offline] Background sync failed:', error)
  }

  return false
}
