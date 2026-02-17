/**
 * usePWA Hook — xTx396 Founder Hub
 *
 * Combined hook for all PWA functionality:
 * - Service worker status
 * - Offline status
 * - Push notifications
 * - Install prompt
 */

import { useState, useEffect, useCallback } from 'react'
import {
  registerServiceWorker,
  getServiceWorkerStatus,
  checkForUpdates,
  applyUpdate,
} from './register-sw'
import { getOfflineStatus, subscribeToOnlineStatus } from './offline-cache'
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed,
} from './push-notifications'
import { useInstallPrompt } from './use-install-prompt'
import type {
  ServiceWorkerStatus,
  OfflineStatus,
  NotificationPermissionStatus,
} from './types'

interface PWAState {
  // Service Worker
  swStatus: ServiceWorkerStatus
  updateAvailable: boolean

  // Offline
  isOnline: boolean
  offlineStatus: OfflineStatus | null

  // Push
  pushSupported: boolean
  pushPermission: NotificationPermissionStatus
  pushSubscribed: boolean

  // Install
  canInstall: boolean
  isInstalled: boolean

  // Loading
  isLoading: boolean
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    swStatus: {
      supported: false,
      registered: false,
      active: false,
      waiting: false,
      updateAvailable: false,
      registration: null,
    },
    updateAvailable: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    offlineStatus: null,
    pushSupported: false,
    pushPermission: 'default',
    pushSubscribed: false,
    canInstall: false,
    isInstalled: false,
    isLoading: true,
  })

  const install = useInstallPrompt()

  // Initialize PWA
  useEffect(() => {
    let mounted = true

    async function init() {
      // Register service worker
      await registerServiceWorker({
        onUpdate: () => {
          if (mounted) {
            setState((prev) => ({ ...prev, updateAvailable: true }))
          }
        },
      })

      // Get initial status
      const swStatus = await getServiceWorkerStatus()
      const offlineStatus = await getOfflineStatus()
      const pushSubscribed = await isSubscribed()

      if (mounted) {
        setState((prev) => ({
          ...prev,
          swStatus,
          updateAvailable: swStatus.updateAvailable,
          offlineStatus,
          pushSupported: isPushSupported(),
          pushPermission: getPermissionStatus(),
          pushSubscribed,
          isLoading: false,
        }))
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Subscribe to online status changes
  useEffect(() => {
    return subscribeToOnlineStatus((isOnline) => {
      setState((prev) => ({ ...prev, isOnline }))
    })
  }, [])

  // Sync install status from hook
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      canInstall: install.canInstall,
      isInstalled: install.isInstalled,
    }))
  }, [install.canInstall, install.isInstalled])

  // Actions
  const refreshStatus = useCallback(async () => {
    const swStatus = await getServiceWorkerStatus()
    const offlineStatus = await getOfflineStatus()
    const pushSubscribed = await isSubscribed()

    setState((prev) => ({
      ...prev,
      swStatus,
      updateAvailable: swStatus.updateAvailable,
      offlineStatus,
      pushPermission: getPermissionStatus(),
      pushSubscribed,
    }))
  }, [])

  const checkUpdates = useCallback(async () => {
    const hasUpdate = await checkForUpdates()
    setState((prev) => ({ ...prev, updateAvailable: hasUpdate }))
    return hasUpdate
  }, [])

  const installUpdate = useCallback(() => {
    applyUpdate()
  }, [])

  const enablePush = useCallback(async (vapidKey?: string) => {
    const subscription = await subscribeToPush(vapidKey)
    if (subscription) {
      setState((prev) => ({
        ...prev,
        pushPermission: 'granted',
        pushSubscribed: true,
      }))
    }
    return subscription
  }, [])

  const disablePush = useCallback(async () => {
    const success = await unsubscribeFromPush()
    if (success) {
      setState((prev) => ({ ...prev, pushSubscribed: false }))
    }
    return success
  }, [])

  return {
    // State
    ...state,

    // Install
    promptInstall: install.promptInstall,
    getIOSInstructions: install.getIOSInstructions,
    isIOS: install.isIOS,
    isAndroid: install.isAndroid,
    platform: install.platform,

    // Actions
    refreshStatus,
    checkUpdates,
    installUpdate,
    enablePush,
    disablePush,
  }
}
