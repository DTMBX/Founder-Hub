/**
 * Push Notification Service — xTx396 Founder Hub
 *
 * Handles push notifications for:
 * - New lead alerts
 * - Project updates
 * - Subscription renewals
 * - Custom notifications
 *
 * Requires VAPID keys for web push.
 */

import type {
  NotificationPermissionStatus,
  PushNotificationPayload,
  PushSubscriptionData,
} from './types'
import { getRegistration } from './register-sw'

// ─── Constants ─────────────────────────────────────────────

// VAPID public key - should be configured per environment
// This is a placeholder - replace with actual key in production
const DEFAULT_VAPID_PUBLIC_KEY = ''

// Storage key for subscription
const SUBSCRIPTION_KEY = 'xtx396:push-subscription'

// ─── Permission Management ─────────────────────────────────

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermissionStatus {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission as NotificationPermissionStatus
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<NotificationPermissionStatus> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported')
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  console.log('[Push] Permission result:', permission)
  return permission as NotificationPermissionStatus
}

// ─── Subscription Management ───────────────────────────────

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey = DEFAULT_VAPID_PUBLIC_KEY
): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push not supported')
    return null
  }

  // Check permission
  const permission = await requestPermission()
  if (permission !== 'granted') {
    console.warn('[Push] Permission not granted')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Get existing subscription or create new
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription && vapidPublicKey) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    }

    if (!subscription) {
      console.warn('[Push] Could not create subscription')
      return null
    }

    const subscriptionData = formatSubscription(subscription)

    // Store locally
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptionData))

    console.log('[Push] Subscribed:', subscriptionData.endpoint)
    return subscriptionData
  } catch (error) {
    console.error('[Push] Subscription failed:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      localStorage.removeItem(SUBSCRIPTION_KEY)
      console.log('[Push] Unsubscribed')
      return true
    }

    return false
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error)
    return false
  }
}

/**
 * Get current push subscription
 */
export async function getSubscription(): Promise<PushSubscriptionData | null> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return null

    return formatSubscription(subscription)
  } catch {
    return null
  }
}

/**
 * Check if currently subscribed
 */
export async function isSubscribed(): Promise<boolean> {
  const subscription = await getSubscription()
  return subscription !== null
}

// ─── Local Notifications ───────────────────────────────────

/**
 * Show a local notification (not pushed from server)
 */
export async function showNotification(
  payload: PushNotificationPayload
): Promise<boolean> {
  if (getPermissionStatus() !== 'granted') {
    console.warn('[Push] Cannot show notification - permission not granted')
    return false
  }

  try {
    const registration = getRegistration()

    if (registration) {
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? '/icon-192.png',
        badge: payload.badge ?? '/icon-192.png',
        tag: payload.tag,
        data: payload.data,
        vibrate: [200, 100, 200],
      })
    } else {
      // Fallback to Notification API
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? '/icon-192.png',
        tag: payload.tag,
        data: payload.data,
      })
    }

    return true
  } catch (error) {
    console.error('[Push] Show notification failed:', error)
    return false
  }
}

// ─── Notification Templates ────────────────────────────────

/**
 * Show new lead notification
 */
export async function notifyNewLead(lead: {
  name: string
  email: string
  source?: string
}): Promise<boolean> {
  return showNotification({
    title: '🎯 New Lead',
    body: `${lead.name} (${lead.email})${lead.source ? ` via ${lead.source}` : ''}`,
    tag: 'new-lead',
    data: { type: 'lead', email: lead.email },
    url: '/?view=leads',
  })
}

/**
 * Show project update notification
 */
export async function notifyProjectUpdate(project: {
  name: string
  status: string
  progress: number
}): Promise<boolean> {
  return showNotification({
    title: '📋 Project Update',
    body: `${project.name}: ${project.status} (${project.progress}%)`,
    tag: 'project-update',
    data: { type: 'project', name: project.name },
    url: '/?view=projects',
  })
}

/**
 * Show subscription renewal notification
 */
export async function notifySubscriptionRenewal(subscription: {
  siteName: string
  daysUntilRenewal: number
}): Promise<boolean> {
  return showNotification({
    title: '💳 Renewal Reminder',
    body: `${subscription.siteName} renews in ${subscription.daysUntilRenewal} days`,
    tag: 'subscription-renewal',
    data: { type: 'subscription', siteName: subscription.siteName },
    url: '/?view=subscriptions',
  })
}

// ─── Helper Functions ──────────────────────────────────────

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Format PushSubscription to serializable object
 */
function formatSubscription(subscription: PushSubscription): PushSubscriptionData {
  const json = subscription.toJSON()

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    expirationTime: subscription.expirationTime,
  }
}

// ─── Event Listeners ───────────────────────────────────────

type NotificationCallback = (type: string, data: unknown) => void
const notificationCallbacks: Set<NotificationCallback> = new Set()

/**
 * Subscribe to notification click events
 */
export function onNotificationClick(callback: NotificationCallback): () => void {
  notificationCallbacks.add(callback)

  return () => {
    notificationCallbacks.delete(callback)
  }
}

// Listen for messages from service worker
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      notificationCallbacks.forEach((cb) => {
        cb(event.data.notificationType, event.data.data)
      })
    }
  })
}
