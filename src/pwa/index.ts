/**
 * PWA Module — xTx396 Founder Hub
 *
 * Progressive Web App functionality:
 * - Service worker registration
 * - Offline caching
 * - Push notifications
 * - Install prompts
 */

// ─── Types ─────────────────────────────────────────────────

export type {
  ServiceWorkerStatus,
  ServiceWorkerConfig,
  PushSubscriptionData,
  PushNotificationPayload,
  NotificationAction,
  NotificationPermissionStatus,
  PushConfig,
  CacheStrategy,
  CacheConfig,
  CachedItem,
  OfflineQueueItem,
  OfflineStatus,
  InstallPromptEvent,
  InstallStatus,
  SyncEvent,
  VoiceNoteConfig,
  VoiceNoteResult,
  VoiceNoteStatus,
  NavItem,
  QuickAction,
} from './types'

// ─── Service Worker ────────────────────────────────────────

export {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForUpdates,
  skipWaiting,
  applyUpdate,
  getServiceWorkerStatus,
  isServiceWorkerSupported,
  postMessageToSW,
  clearCaches,
  getRegistration,
} from './register-sw'

// ─── Offline Cache ─────────────────────────────────────────

export {
  cacheData,
  getCachedData,
  deleteCachedData,
  clearCache,
  cacheLeads,
  getCachedLeads,
  cacheClients,
  getCachedClients,
  cacheProjects,
  getCachedProjects,
  queueOfflineAction,
  getQueuedActions,
  dequeueAction,
  getOfflineStatus,
  setLastSyncTime,
  subscribeToOnlineStatus,
  requestBackgroundSync,
} from './offline-cache'

// ─── Push Notifications ────────────────────────────────────

export {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getSubscription,
  isSubscribed,
  showNotification,
  notifyNewLead,
  notifyProjectUpdate,
  notifySubscriptionRenewal,
  onNotificationClick,
} from './push-notifications'

// ─── Install Prompt Hook ───────────────────────────────────

export { useInstallPrompt } from './use-install-prompt'
export { usePWA } from './use-pwa'
