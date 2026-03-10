/**
 * history-store.ts — Undo/redo stack for content mutations.
 *
 * Every write through the Site Studio (visual builder, AI commands, etc.)
 * pushes a snapshot onto this stack so the operator can undo/redo changes
 * and review a timeline of what was modified.
 *
 * Storage: sessionStorage (cleared on tab close) — intentionally ephemeral
 * so the undo stack doesn't persist stale state across sessions.
 *
 * Usage:
 *   import { history } from '@/lib/history-store'
 *   history.push({ file: 'sections.json', before, after, label: 'Moved About above Projects' })
 *   history.undo()   // restores previous value
 *   history.redo()   // re-applies
 */

import { getEffectiveRole } from '@/lib/studio-permissions'
import type { UserRole } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string
  timestamp: number
  /** Human-readable label for the timeline */
  label: string
  /** KV key or file path that was changed */
  target: string
  /** JSON-serializable snapshot before the change */
  before: unknown
  /** JSON-serializable snapshot after the change */
  after: unknown
  /** Which tool/panel created this entry */
  source: 'visual-builder' | 'chat' | 'editor' | 'style' | 'ai' | 'manual'
  /** Role of the user who made the change (auto-injected) */
  role?: UserRole
}

export type HistoryListener = (state: HistoryState) => void

export interface HistoryState {
  entries: HistoryEntry[]
  cursor: number // index of the "current" entry (-1 = nothing applied)
  canUndo: boolean
  canRedo: boolean
  /** Label of the entry that would be undone next (for tooltip preview) */
  undoLabel: string | null
  /** Label of the entry that would be redone next (for tooltip preview) */
  redoLabel: string | null
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'site-studio-history'
const MAX_ENTRIES = 100

// Active site scope (default = unsuffixed for backwards compat)
let activeSiteId: string | null = null

function storageKey(): string {
  return activeSiteId ? `${STORAGE_KEY_PREFIX}:${activeSiteId}` : STORAGE_KEY_PREFIX
}

// ─── Store ──────────────────────────────────────────────────────────────────

let entries: HistoryEntry[] = []
let cursor = -1
const listeners = new Set<HistoryListener>()

// Restore from sessionStorage on module load
function loadFromStorage() {
  try {
    const stored = sessionStorage.getItem(storageKey())
    if (stored) {
      const parsed = JSON.parse(stored) as { entries: HistoryEntry[]; cursor: number }
      entries = parsed.entries || []
      cursor = typeof parsed.cursor === 'number' ? parsed.cursor : entries.length - 1
    } else {
      entries = []
      cursor = -1
    }
  } catch {
    entries = []
    cursor = -1
  }
}

loadFromStorage()

function persist() {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify({ entries, cursor }))
  } catch { /* quota exceeded — degrade gracefully */ }
}

function notify() {
  const state = getState()
  for (const fn of listeners) {
    try { fn(state) } catch { /* listener error */ }
  }
}

function getState(): HistoryState {
  return {
    entries: [...entries],
    cursor,
    canUndo: cursor >= 0,
    canRedo: cursor < entries.length - 1,
    undoLabel: cursor >= 0 ? entries[cursor]?.label ?? null : null,
    redoLabel: cursor < entries.length - 1 ? entries[cursor + 1]?.label ?? null : null,
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const history = {
  /**
   * Push a new change onto the stack.
   * Truncates any redo entries ahead of the current cursor.
   */
  push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    // Truncate redo history
    entries = entries.slice(0, cursor + 1)

    const full: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      role: entry.role ?? getEffectiveRole(),
    }

    entries.push(full)

    // Enforce max size
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(entries.length - MAX_ENTRIES)
    }

    cursor = entries.length - 1
    persist()
    notify()
    return full
  },

  /**
   * Get the entry to undo (returns the `before` value).
   * Does NOT apply the undo — caller must write the value.
   */
  undo(): HistoryEntry | null {
    if (cursor < 0) return null
    const entry = entries[cursor]
    cursor--
    persist()
    notify()
    return entry
  },

  /**
   * Get the entry to redo (returns the `after` value).
   * Does NOT apply the redo — caller must write the value.
   */
  redo(): HistoryEntry | null {
    if (cursor >= entries.length - 1) return null
    cursor++
    const entry = entries[cursor]
    persist()
    notify()
    return entry
  },

  /** Current state snapshot */
  getState,

  /** Get the full timeline (most recent first) */
  getTimeline(): HistoryEntry[] {
    return [...entries].reverse()
  },

  /** Get entries for a specific target (file or KV key) */
  getEntriesForTarget(target: string): HistoryEntry[] {
    return entries.filter(e => e.target === target).reverse()
  },

  /** Get the current entry at the cursor position, or null if empty */
  getCurrentEntry(): HistoryEntry | null {
    if (cursor < 0 || cursor >= entries.length) return null
    return entries[cursor]
  },

  /** Clear all history */
  clear() {
    entries = []
    cursor = -1
    persist()
    notify()
  },

  /**
   * Scope history to a specific workspace site.
   * Re-loads from the site-scoped sessionStorage key and notifies listeners.
   */
  setSiteScope(siteId: string) {
    if (siteId === activeSiteId) return
    activeSiteId = siteId
    loadFromStorage()
    notify()
  },

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(fn: HistoryListener): () => void {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },
}

// ─── React hook ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

/** React hook that re-renders on history changes. */
export function useHistory(): HistoryState {
  const [state, setState] = useState<HistoryState>(history.getState)

  useEffect(() => {
    return history.subscribe(setState)
  }, [])

  return state
}
