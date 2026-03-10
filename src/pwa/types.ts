/**
 * PWA Types — Founder Hub Founder Hub
 *
 * Type definitions for PWA functionality including:
 * - Service worker registration
 * - Push notifications
 * - Offline caching
 * - Install prompts
 */

// ─── Service Worker ────────────────────────────────────────

export interface ServiceWorkerStatus {
  supported: boolean
  registered: boolean
  active: boolean
  waiting: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
}

// ─── Push Notifications ────────────────────────────────────

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  expirationTime: number | null
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: NotificationAction[]
  url?: string
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default'

export interface PushConfig {
  vapidPublicKey: string
  onPermissionChange?: (status: NotificationPermissionStatus) => void
  onSubscriptionChange?: (subscription: PushSubscription | null) => void
}

// ─── Offline Cache ─────────────────────────────────────────

export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate'

export interface CacheConfig {
  name: string
  strategy: CacheStrategy
  maxAge?: number // milliseconds
  maxItems?: number
}

export interface CachedItem<T = unknown> {
  data: T
  timestamp: number
  expiresAt?: number
}

export interface OfflineQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'lead' | 'client' | 'project' | 'note'
  payload: Record<string, unknown>
  timestamp: number
  retries: number
}

export interface OfflineStatus {
  isOnline: boolean
  queuedActions: number
  lastSync: string | null
}

// ─── Install Prompt ────────────────────────────────────────

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallStatus {
  canInstall: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
}

// ─── Sync Events ───────────────────────────────────────────

export interface SyncEvent {
  id: string
  tag: string
  timestamp: number
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  error?: string
}

// ─── Voice Notes ───────────────────────────────────────────

export interface VoiceNoteConfig {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxDuration?: number // milliseconds
}

export interface VoiceNoteResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export type VoiceNoteStatus = 'idle' | 'listening' | 'processing' | 'error'

// ─── Mobile Navigation ─────────────────────────────────────

export interface NavItem {
  id: string
  label: string
  icon: string
  href?: string
  action?: () => void
  badge?: number | string
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  color?: string
  action: () => void
}
