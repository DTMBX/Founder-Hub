/**
 * Service Worker — Founder Hub Founder Hub PWA
 *
 * Provides:
 * - Static asset caching (app shell)
 * - Offline read mode for leads/clients
 * - Push notification handling
 * - Background sync for queued actions
 *
 * Cache Strategies:
 * - App Shell: Cache-first (static assets)
 * - Data: Network-first with cache fallback
 * - Images: Cache-first with network update
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `founder-hub-static-${CACHE_VERSION}`
const DATA_CACHE = `founder-hub-data-${CACHE_VERSION}`

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Data endpoints to cache for offline (patterns)
const CACHEABLE_DATA_PATTERNS = [
  /\/api\/leads/,
  /\/api\/clients/,
  /\/api\/projects/,
  /\/api\/subscriptions/,
]

// ─── Install Event ─────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )

  // Activate immediately without waiting
  self.skipWaiting()
})

// ─── Activate Event ────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('founder-hub-') &&
              name !== STATIC_CACHE &&
              name !== DATA_CACHE
            )
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )

  // Claim all clients immediately
  self.clients.claim()
})

// ─── Fetch Event ───────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension, ws, etc.
  if (!url.protocol.startsWith('http')) return

  // Data requests: Network-first with cache fallback
  if (isDataRequest(url)) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE))
    return
  }

  // Static assets: Cache-first with network fallback
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE))
    return
  }

  // Navigation requests: Cache-first (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        return cached || fetch(request)
      })
    )
    return
  }

  // Default: Network with cache fallback
  event.respondWith(networkFirstWithCache(request, STATIC_CACHE))
})

// ─── Push Event ────────────────────────────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received')

  let data = {
    title: 'Founder Hub Notification',
    body: 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default',
    data: {},
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      vibrate: [200, 100, 200],
      actions: data.actions || [],
    })
  )
})

// ─── Notification Click ────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)

  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl)
    })
  )
})

// ─── Background Sync ───────────────────────────────────────

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

// ─── Message Handler ───────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CACHE_DATA':
      // Cache data sent from app
      if (payload?.key && payload?.data) {
        cacheData(payload.key, payload.data)
      }
      break

    case 'CLEAR_CACHE':
      clearAllCaches()
      break

    default:
      console.log('[SW] Unknown message type:', type)
  }
})

// ─── Helper Functions ──────────────────────────────────────

function isDataRequest(url) {
  return CACHEABLE_DATA_PATTERNS.some((pattern) => pattern.test(url.pathname))
}

function isStaticAsset(url) {
  const ext = url.pathname.split('.').pop()?.toLowerCase()
  return ['js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'ico'].includes(ext)
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function cacheData(key, data) {
  const cache = await caches.open(DATA_CACHE)
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
  await cache.put(key, response)
}

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith('founder-hub-'))
      .map((name) => caches.delete(name))
  )
}

async function syncOfflineActions() {
  // This would sync queued offline actions
  // Implementation depends on your offline queue structure
  console.log('[SW] Syncing offline actions...')
}
