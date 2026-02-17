/**
 * useInstallPrompt Hook — xTx396 Founder Hub
 *
 * Manages PWA install prompt lifecycle:
 * - Detects install capability
 * - Shows install prompt
 * - Tracks install status
 */

import { useState, useEffect, useCallback } from 'react'
import type { InstallPromptEvent, InstallStatus } from './types'

// ─── Platform Detection ────────────────────────────────────

function detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  const ua = navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) return 'desktop'

  return 'unknown'
}

function isStandalone(): boolean {
  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) return true

  // iOS standalone
  if ((navigator as { standalone?: boolean }).standalone) return true

  // Android TWA
  if (document.referrer.includes('android-app://')) return true

  return false
}

// ─── Hook ──────────────────────────────────────────────────

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null)
  const [status, setStatus] = useState<InstallStatus>({
    canInstall: false,
    isInstalled: isStandalone(),
    platform: detectPlatform(),
  })

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPromptEvent)
      setStatus((prev) => ({ ...prev, canInstall: true }))
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setStatus((prev) => ({
        ...prev,
        canInstall: false,
        isInstalled: true,
      }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Prompt install
  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) {
      // iOS Safari - show instructions
      if (status.platform === 'ios') {
        return null // Return null to indicate manual install needed
      }
      return null
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setStatus((prev) => ({ ...prev, canInstall: false }))
      }

      return outcome
    } catch (error) {
      console.error('[Install] Prompt failed:', error)
      return null
    }
  }, [deferredPrompt, status.platform])

  // iOS install instructions
  const getIOSInstructions = useCallback(() => {
    if (status.platform !== 'ios') return null

    return {
      steps: [
        'Tap the Share button in Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top right',
      ],
    }
  }, [status.platform])

  return {
    canInstall: status.canInstall,
    isInstalled: status.isInstalled,
    platform: status.platform,
    promptInstall,
    getIOSInstructions,
    isIOS: status.platform === 'ios',
    isAndroid: status.platform === 'android',
  }
}
