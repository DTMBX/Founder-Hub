/**
 * useTrackedKV — useKV wrapper with dirty tracking + undo/redo history.
 *
 * Drop-in replacement for raw useKV in admin managers (LinksManager,
 * InvestorManager, EnhancedProjectsManager, etc.) that need:
 *  - Global dirty-state awareness (unsaved-changes guard on page exit)
 *  - Undo/redo via the history store
 *
 * Does NOT require content-registry or schemas — use useContentEditor
 * for that.  useTrackedKV is the lightweight middle ground between
 * raw useKV (no tracking) and the full editor pipeline.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { dirtyTracker } from '@/lib/editor-state'
import { history } from '@/lib/history-store'

export function useTrackedKV<T>(
  key: string,
  defaultValue: T,
  label?: string
): [T, (value: T | ((prev: T) => T), changeLabel?: string) => void] {
  const [value, setKV] = useKV<T>(key, defaultValue)
  const prevRef = useRef<string>(JSON.stringify(defaultValue))
  const initRef = useRef(false)

  // Sync the snapshot after initial KV load
  useEffect(() => {
    if (!initRef.current) {
      prevRef.current = JSON.stringify(value)
      initRef.current = true
    }
  }, [value])

  // Clean up dirty flag on unmount
  useEffect(() => {
    return () => { dirtyTracker.markClean(key) }
  }, [key])

  const setTracked = useCallback(
    (newValue: T | ((prev: T) => T), changeLabel?: string) => {
      const before = JSON.parse(prevRef.current)
      setKV((prev: T) => {
        const resolved =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue
        history.push({
          label: changeLabel || `Updated ${label || key}`,
          target: key,
          before,
          after: resolved,
          source: 'editor',
        })
        prevRef.current = JSON.stringify(resolved)
        dirtyTracker.markDirty(key)
        return resolved
      })
    },
    [key, label, setKV]
  )

  return [value, setTracked]
}
