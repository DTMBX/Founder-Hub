/**
 * Accessibility Hooks
 *
 * React hooks for accessibility features:
 * - useFocusTrap: trap focus within a modal/dialog
 * - useAnnounce: announce messages to screen readers
 * - usePreloadAssets: preload critical assets
 * - useReducedMotion: respect user's motion preferences
 */

import { useEffect, useRef, useCallback } from 'react'
import {
  createFocusTrap,
  announceToScreenReader,
  injectPreloadLinks,
  injectPreconnect,
  prefersReducedMotion,
  type PreloadConfig,
} from '../a11y.config'

// ─── useFocusTrap ────────────────────────────────────────────

export interface UseFocusTrapOptions {
  /** Whether the trap is active */
  enabled?: boolean
  /** Element to focus initially */
  initialFocusRef?: React.RefObject<HTMLElement>
  /** Callback when Escape is pressed */
  onEscape?: () => void
}

export interface UseFocusTrapResult<T extends HTMLElement> {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<T | null>
}

/**
 * Trap focus within a container element (for modals, dialogs).
 *
 * @example
 * ```tsx
 * const { containerRef } = useFocusTrap<HTMLDivElement>({
 *   enabled: isOpen,
 *   onEscape: () => setIsOpen(false)
 * })
 *
 * return <div ref={containerRef}>...</div>
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
): UseFocusTrapResult<T> {
  const { enabled = true, initialFocusRef, onEscape } = options
  const containerRef = useRef<T>(null)
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return
    
    const cleanup = createFocusTrap(containerRef.current, {
      initialFocus: initialFocusRef?.current ?? null,
      onEscape,
    })
    
    return cleanup
  }, [enabled, onEscape, initialFocusRef])
  
  return { containerRef }
}

// ─── useAnnounce ─────────────────────────────────────────────

export interface UseAnnounceResult {
  /** Announce a polite message */
  announce: (message: string) => void
  /** Announce an assertive (urgent) message */
  announceAssertive: (message: string) => void
}

/**
 * Hook for announcing messages to screen readers.
 *
 * @example
 * ```tsx
 * const { announce } = useAnnounce()
 * 
 * function handleSubmit() {
 *   submitForm()
 *   announce('Form submitted successfully')
 * }
 * ```
 */
export function useAnnounce(): UseAnnounceResult {
  const announce = useCallback((message: string) => {
    announceToScreenReader(message, 'polite')
  }, [])
  
  const announceAssertive = useCallback((message: string) => {
    announceToScreenReader(message, 'assertive')
  }, [])
  
  return { announce, announceAssertive }
}

// ─── usePreloadAssets ────────────────────────────────────────

export interface UsePreloadAssetsOptions {
  /** Assets to preload */
  preloads?: PreloadConfig[]
  /** External origins to preconnect to */
  preconnects?: string[]
  /** Whether to inject links immediately */
  immediate?: boolean
}

/**
 * Hook for preloading critical assets.
 * Injects <link rel="preload"> and <link rel="preconnect"> tags.
 *
 * @example
 * ```tsx
 * usePreloadAssets({
 *   preloads: [
 *     { href: '/hero-poster.jpg', as: 'image' },
 *     { href: '/hero.mp4', as: 'video', type: 'video/mp4' }
 *   ],
 *   preconnects: ['https://cdn.example.com']
 * })
 * ```
 */
export function usePreloadAssets(options: UsePreloadAssetsOptions = {}): void {
  const { preloads = [], preconnects = [], immediate = true } = options
  
  useEffect(() => {
    if (!immediate) return
    
    if (preconnects.length > 0) {
      injectPreconnect(preconnects)
    }
    
    if (preloads.length > 0) {
      injectPreloadLinks(preloads)
    }
  }, [preloads, preconnects, immediate])
}

// ─── useReducedMotion ────────────────────────────────────────

/**
 * Hook that returns whether user prefers reduced motion.
 * Updates when user changes system preference.
 *
 * @example
 * ```tsx
 * const prefersReduced = useReducedMotion()
 * 
 * const animationDuration = prefersReduced ? 0 : 300
 * ```
 */
export function useReducedMotion(): boolean {
  const prefersReduced = useRef(prefersReducedMotion())
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReduced.current = e.matches
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReduced.current
}

// ─── useKeyboardShortcut ─────────────────────────────────────

export interface UseKeyboardShortcutOptions {
  /** Key to listen for (e.g., 'Escape', 'Enter', 'k') */
  key: string
  /** Modifier keys required */
  modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }
  /** Callback when shortcut is triggered */
  onTrigger: () => void
  /** Whether the shortcut is enabled */
  enabled?: boolean
}

/**
 * Hook for global keyboard shortcuts.
 *
 * @example
 * ```tsx
 * useKeyboardShortcut({
 *   key: 'k',
 *   modifiers: { ctrl: true },
 *   onTrigger: () => openSearch()
 * })
 * ```
 */
export function useKeyboardShortcut(options: UseKeyboardShortcutOptions): void {
  const { key, modifiers = {}, onTrigger, enabled = true } = options
  
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check key
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      
      // Check modifiers
      if (modifiers.ctrl && !e.ctrlKey) return
      if (modifiers.shift && !e.shiftKey) return
      if (modifiers.alt && !e.altKey) return
      if (modifiers.meta && !e.metaKey) return
      
      // Don't trigger if typing in input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }
      
      e.preventDefault()
      onTrigger()
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [key, modifiers, onTrigger, enabled])
}

// ─── Exports ─────────────────────────────────────────────────

export type { PreloadConfig }
