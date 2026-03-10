/**
 * Service Worker Registration — Founder Hub Founder Hub
 *
 * Handles service worker lifecycle:
 * - Registration
 * - Update detection
 * - Skip waiting
 * - Unregistration
 */

import type { ServiceWorkerConfig, ServiceWorkerStatus } from './types'

// ─── State ─────────────────────────────────────────────────

let swRegistration: ServiceWorkerRegistration | null = null
let updateCallback: ((reg: ServiceWorkerRegistration) => void) | null = null

// ─── Registration ──────────────────────────────────────────

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log('[PWA] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    swRegistration = registration
    updateCallback = config.onUpdate ?? null

    console.log('[PWA] Service worker registered:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available
          console.log('[PWA] Update available')
          config.onUpdate?.(registration)
        } else if (newWorker.state === 'activated') {
          // Content cached for offline use
          console.log('[PWA] Service worker activated')
          config.onSuccess?.(registration)
        }
      })
    })

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading...')
      window.location.reload()
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error)
    config.onError?.(error as Error)
    return null
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((reg) => reg.unregister()))
    swRegistration = null
    console.log('[PWA] Service workers unregistered')
    return true
  } catch (error) {
    console.error('[PWA] Unregister failed:', error)
    return false
  }
}

// ─── Update Management ─────────────────────────────────────

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!swRegistration) return false

  try {
    await swRegistration.update()
    return swRegistration.waiting !== null
  } catch (error) {
    console.error('[PWA] Update check failed:', error)
    return false
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting(): void {
  if (!swRegistration?.waiting) return

  swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
}

/**
 * Handle update prompt (call when user accepts update)
 */
export function applyUpdate(): void {
  skipWaiting()
}

// ─── Status ────────────────────────────────────────────────

/**
 * Get current service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const supported = isServiceWorkerSupported()

  if (!supported) {
    return {
      supported: false,
      registered: false,
      active: false,
      waiting: false,
      updateAvailable: false,
      registration: null,
    }
  }

  const registration = await navigator.serviceWorker.getRegistration()

  return {
    supported: true,
    registered: registration !== undefined,
    active: registration?.active !== null,
    waiting: registration?.waiting !== null,
    updateAvailable: registration?.waiting !== null,
    registration: registration ?? null,
  }
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator
}

// ─── Messaging ─────────────────────────────────────────────

/**
 * Send message to service worker
 */
export function postMessageToSW(message: { type: string; payload?: unknown }): void {
  if (!navigator.serviceWorker.controller) {
    console.warn('[PWA] No active service worker to message')
    return
  }

  navigator.serviceWorker.controller.postMessage(message)
}

/**
 * Clear all caches via service worker
 */
export function clearCaches(): void {
  postMessageToSW({ type: 'CLEAR_CACHE' })
}

// ─── Exports ───────────────────────────────────────────────

export function getRegistration(): ServiceWorkerRegistration | null {
  return swRegistration
}
