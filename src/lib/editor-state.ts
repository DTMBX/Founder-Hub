/**
 * editor-state.ts — Draft-aware editor state with dirty tracking and undo/redo.
 *
 * Wraps useKV with:
 *  - Snapshot-based dirty detection (compares current vs last-saved)
 *  - Automatic undo/redo integration via history-store
 *  - Schema validation (optional)
 *  - Draft vs published state tracking
 *  - JSON snapshot export/import
 *
 * Usage:
 *   const editor = useEditorState('founder-hub-sections', [], { label: 'Sections' })
 *   editor.update(newValue)       // sets draft (auto-persists to localStorage)
 *   editor.save()                 // marks current state as "saved" baseline
 *   editor.undo() / editor.redo() // history navigation
 *   editor.isDirty                // true when draft !== last saved
 *   editor.reset()                // discard changes, restore last saved
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useKV, persistToFile } from '@/lib/local-storage-kv'
import { history } from '@/lib/history-store'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EditorStateOptions<T> {
  /** Human-readable label for history entries */
  label: string
  /** Source tag for history entries */
  source?: 'editor' | 'visual-builder' | 'chat' | 'style' | 'ai' | 'manual'
  /** Optional validation function. Returns error string or null. */
  validate?: (value: T) => string | null
}

export interface EditorState<T> {
  /** Current draft value */
  value: T
  /** Update the draft. Pushes history entry. */
  update: (newValue: T | ((prev: T) => T), changeLabel?: string) => void
  /** Mark current draft as the "saved" baseline (resets dirty flag) */
  save: (onSave?: () => void | Promise<void>) => Promise<void>
  /** Discard draft changes, restore to last saved baseline */
  reset: () => void
  /** Whether draft differs from last saved state */
  isDirty: boolean
  /** Undo last change */
  undo: () => void
  /** Redo last undone change */
  redo: () => void
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Current validation error (null if valid) */
  validationError: string | null
  /** Timestamp of last save */
  lastSavedAt: Date | null
  /** Whether the last save also persisted to disk (null = never saved) */
  lastPersistOk: boolean | null
  /** Export current state as JSON string */
  exportSnapshot: () => string
  /** Import state from JSON string */
  importSnapshot: (json: string) => boolean
  /** The KV key this editor is bound to */
  key: string
}

// ─── Utility ────────────────────────────────────────────────────────────────

function stableStringify(value: unknown): string {
  return JSON.stringify(value)
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEditorState<T>(
  key: string,
  defaultValue: T,
  options: EditorStateOptions<T>
): EditorState<T> {
  const [value, setKV] = useKV<T>(key, defaultValue)
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => stableStringify(defaultValue))
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [lastPersistOk, setLastPersistOk] = useState<boolean | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const previousValueRef = useRef<string>(stableStringify(defaultValue))
  const initRef = useRef(false)

  // Sync saved snapshot when value first loads from KV
  useEffect(() => {
    if (!initRef.current) {
      const snap = stableStringify(value)
      setSavedSnapshot(snap)
      previousValueRef.current = snap
      initRef.current = true
    }
  }, [value])

  // Subscribe to history state for undo/redo availability
  useEffect(() => {
    return history.subscribe((state) => {
      setCanUndo(state.canUndo)
      setCanRedo(state.canRedo)
    })
  }, [])

  const isDirty = useMemo(() => {
    return stableStringify(value) !== savedSnapshot
  }, [value, savedSnapshot])

  const validateFn = options.validate
  const validationError = useMemo(() => {
    if (!validateFn) return null
    return validateFn(value)
  }, [value, validateFn])

  const update = useCallback((newValue: T | ((prev: T) => T), changeLabel?: string) => {
    const before = JSON.parse(previousValueRef.current)

    setKV((prev: T) => {
      const resolved = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue

      // Push history entry
      history.push({
        label: changeLabel || `Updated ${options.label}`,
        target: key,
        before,
        after: resolved,
        source: options.source || 'editor',
      })

      previousValueRef.current = stableStringify(resolved)
      return resolved
    })
  }, [key, options.label, options.source, setKV])

  const save = useCallback(async (onSave?: () => void | Promise<void>) => {
    const snap = stableStringify(value)
    setSavedSnapshot(snap)
    setLastSavedAt(new Date())
    // Persist to disk via workspace API — await the result
    try {
      const ok = await persistToFile(key)
      setLastPersistOk(ok)
    } catch {
      setLastPersistOk(false)
    }
    if (onSave) {
      await onSave()
    }
  }, [value, key])

  const reset = useCallback(() => {
    const savedValue = JSON.parse(savedSnapshot) as T
    setKV(savedValue)
    previousValueRef.current = savedSnapshot
  }, [savedSnapshot, setKV])

  const undo = useCallback(() => {
    const entry = history.undo()
    if (entry && entry.target === key) {
      setKV(entry.before as T)
      previousValueRef.current = stableStringify(entry.before)
    }
  }, [key, setKV])

  const redo = useCallback(() => {
    const entry = history.redo()
    if (entry && entry.target === key) {
      setKV(entry.after as T)
      previousValueRef.current = stableStringify(entry.after)
    }
  }, [key, setKV])

  const exportSnapshot = useCallback(() => {
    return JSON.stringify({
      key,
      timestamp: new Date().toISOString(),
      data: value,
    }, null, 2)
  }, [key, value])

  const importSnapshot = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      if (parsed && parsed.data !== undefined) {
        update(parsed.data, `Imported snapshot for ${options.label}`)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [update, options.label])

  return {
    value,
    update,
    save,
    reset,
    isDirty,
    undo,
    redo,
    canUndo,
    canRedo,
    validationError,
    lastSavedAt,
    lastPersistOk,
    exportSnapshot,
    importSnapshot,
    key,
  }
}

// ─── Global dirty state tracking ────────────────────────────────────────────

type DirtyListener = (keys: Set<string>) => void
const dirtyKeys = new Set<string>()
const dirtyListeners = new Set<DirtyListener>()

function notifyDirty() {
  const snapshot = new Set(dirtyKeys)
  for (const fn of dirtyListeners) {
    try { fn(snapshot) } catch { /* ignore */ }
  }
}

export const dirtyTracker = {
  markDirty(key: string) {
    dirtyKeys.add(key)
    notifyDirty()
  },
  markClean(key: string) {
    dirtyKeys.delete(key)
    notifyDirty()
  },
  isDirty(): boolean {
    return dirtyKeys.size > 0
  },
  getDirtyKeys(): string[] {
    return Array.from(dirtyKeys)
  },
  subscribe(fn: DirtyListener): () => void {
    dirtyListeners.add(fn)
    return () => { dirtyListeners.delete(fn) }
  },
}

/** React hook for global dirty state */
export function useGlobalDirty(): { isDirty: boolean; dirtyKeys: string[] } {
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  useEffect(() => {
    return dirtyTracker.subscribe(setDirty)
  }, [])

  return {
    isDirty: dirty.size > 0,
    dirtyKeys: Array.from(dirty),
  }
}
