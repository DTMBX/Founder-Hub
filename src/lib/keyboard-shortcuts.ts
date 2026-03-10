/**
 * keyboard-shortcuts.ts — Global keyboard shortcut registry for the admin panel.
 *
 * Provides a hook that registers shortcuts scoped to the admin panel lifetime.
 * Shortcuts are disabled when focus is inside an input/textarea/contenteditable.
 */

import { useEffect, useRef } from 'react'

export interface Shortcut {
  /** Keyboard key (e.g. 's', 'z', 'p') — case insensitive */
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  /** Action to perform */
  action: () => void
  /** Label for display in UI */
  label: string
  /** Category for grouping (e.g. 'Edit', 'Navigate', 'File') */
  category?: string
}

function isEditable(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

function matchesShortcut(e: KeyboardEvent, shortcut: Shortcut): boolean {
  const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
  const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
  const altMatch = shortcut.alt ? e.altKey : !e.altKey
  return ctrlMatch && shiftMatch && altMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()
}

/**
 * Hook that registers keyboard shortcuts. Shortcuts are active while the
 * component is mounted and are automatically cleaned up.
 *
 * Pass `allowInInputs` to enable shortcuts even when focused on form fields
 * (useful for Ctrl+S save).
 */
export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options?: { allowInInputs?: boolean }
) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!options?.allowInInputs && isEditable(e.target)) return

      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault()
          e.stopPropagation()
          shortcut.action()
          return
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [options?.allowInInputs])
}

/**
 * Format a shortcut for display (e.g. "Ctrl+S", "Ctrl+Shift+Z")
 */
export function formatShortcut(shortcut: Pick<Shortcut, 'key' | 'ctrl' | 'shift' | 'alt'>): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  parts.push(shortcut.key.toUpperCase())
  return parts.join('+')
}
