/**
 * use-collection-editor.ts — Draft-based editing for array-of-object collections.
 *
 * Reads from KV, maintains a local draft, and commits validated changes
 * on Apply. All mutations (add, remove, reorder, edit item) operate on
 * the draft — nothing is persisted until Apply.
 *
 * Undo/Redo:
 *   Same model as use-section-inspector: history-store returns entries,
 *   this hook applies before/after to KV.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { kv } from '@/lib/local-storage-kv'
import { history, useHistory } from '@/lib/history-store'
import { useStudioSelection } from '@/lib/use-studio-selection'
import { SECTION_REGISTRY } from '@/registry/sections'
import { getCollectionInfo, type CollectionRegistryEntry } from '@/registry/collections'
import type { EditableField } from '@/registry/sections'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type Item = Record<string, unknown>

export interface CollectionEditorState {
  /** Whether the currently selected section has collection support */
  isCollectionSection: boolean
  /** Collection metadata (null if not a collection section) */
  collection: CollectionRegistryEntry | null
  /** KV key for the collection */
  kvKey: string | null
  /** Draft items array (editable copy) */
  items: Item[]
  /** Index of the item currently being edited */
  selectedItemIndex: number | null
  /** Whether the draft differs from persisted state */
  isDirty: boolean
  /** Last validation error */
  validationError: string | null
  /** Select an item for editing by index */
  selectItem: (index: number | null) => void
  /** Update a field on the selected item */
  setItemField: (key: string, value: unknown) => void
  /** Add a new item to the draft */
  addItem: () => void
  /** Remove an item from the draft by index */
  removeItem: (index: number) => void
  /** Move an item within the draft */
  moveItem: (from: number, to: number) => void
  /** Commit all draft changes to KV */
  apply: () => void
  /** Discard all draft changes, reload from KV */
  reset: () => void
  /** Undo last committed change */
  performUndo: () => void
  /** Redo last undone change */
  performRedo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Item-level editable fields from collection metadata */
  itemFields: EditableField[]
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCollectionEditor(): CollectionEditorState {
  const selection = useStudioSelection()
  const historyState = useHistory()

  const [items, setItems] = useState<Item[]>([])
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Track what we loaded from KV for dirty detection
  const originalRef = useRef<string>('[]')
  const loadedForRef = useRef<string | null>(null)

  // Derive collection metadata from selection
  const sectionType = selection.sectionType
  const sectionRegistry = sectionType ? SECTION_REGISTRY[sectionType] : undefined
  const kvKey = sectionRegistry?.kvKey ?? null
  const collection = kvKey ? getCollectionInfo(kvKey) ?? null : null
  const isCollectionSection = collection !== null

  // ── Load collection when selection changes ──

  useEffect(() => {
    const sourceKey = kvKey || ''
    if (loadedForRef.current === sourceKey) return
    loadedForRef.current = sourceKey

    setSelectedItemIndex(null)
    setValidationError(null)

    if (!kvKey || !collection) {
      setItems([])
      originalRef.current = '[]'
      return
    }

    kv.get<Item[]>(kvKey).then(data => {
      const arr = Array.isArray(data) ? data : []
      setItems(arr)
      originalRef.current = JSON.stringify(arr)
    })
  }, [kvKey, collection])

  // ── Dirty check ──

  const isDirty = isCollectionSection && JSON.stringify(items) !== originalRef.current

  // ── Item selection ──

  const selectItem = useCallback((index: number | null) => {
    setSelectedItemIndex(index)
    setValidationError(null)
  }, [])

  // ── Field mutation on selected item ──

  const setItemField = useCallback((key: string, value: unknown) => {
    setItems(prev => {
      if (selectedItemIndex === null || selectedItemIndex >= prev.length) return prev
      const updated = [...prev]
      updated[selectedItemIndex] = { ...updated[selectedItemIndex], [key]: value }
      return updated
    })
    setValidationError(null)
  }, [selectedItemIndex])

  // ── Add item ──

  const addItem = useCallback(() => {
    if (!collection) return
    const newItem = collection.createDefault()
    // Set order to end of list
    newItem.order = items.length
    setItems(prev => [...prev, newItem])
    setSelectedItemIndex(items.length)
    setValidationError(null)
  }, [collection, items.length])

  // ── Remove item ──

  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      if (index < 0 || index >= prev.length) return prev
      return prev.filter((_, i) => i !== index)
    })
    setSelectedItemIndex(prev => {
      if (prev === null) return null
      if (prev === index) return null
      if (prev > index) return prev - 1
      return prev
    })
    setValidationError(null)
  }, [])

  // ── Move item ──

  const moveItem = useCallback((from: number, to: number) => {
    setItems(prev => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev
      const updated = [...prev]
      const [moved] = updated.splice(from, 1)
      updated.splice(to, 0, moved)
      return updated
    })
    // Track selected item across the move
    setSelectedItemIndex(prev => {
      if (prev === null) return null
      if (prev === from) return to
      if (from < prev && to >= prev) return prev - 1
      if (from > prev && to <= prev) return prev + 1
      return prev
    })
  }, [])

  // ── Apply ──

  const apply = useCallback(() => {
    if (!kvKey || !collection) return

    // Update timestamps on items that have updatedAt
    const finalItems = items.map(item => {
      if ('updatedAt' in item) return { ...item, updatedAt: Date.now() }
      return item
    })

    // Validate entire collection
    const result = collection.arraySchema.safeParse(finalItems)
    if (!result.success) {
      const msg = (result as { error: { issues: { path: (string | number)[]; message: string }[] } })
        .error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
      setValidationError(msg)
      toast.error('Validation failed: ' + msg)
      return
    }

    // Push history
    const before = JSON.parse(originalRef.current)
    history.push({
      label: `Updated ${collection.label}`,
      target: kvKey,
      before,
      after: finalItems,
      source: 'visual-builder',
    })

    // Write to KV
    kv.set(kvKey, finalItems)
    setItems(finalItems)
    originalRef.current = JSON.stringify(finalItems)
    setValidationError(null)
    toast.success('Collection saved')
  }, [kvKey, collection, items])

  // ── Reset ──

  const reset = useCallback(() => {
    if (!kvKey || !collection) return
    loadedForRef.current = null // force re-load

    kv.get<Item[]>(kvKey).then(data => {
      const arr = Array.isArray(data) ? data : []
      setItems(arr)
      originalRef.current = JSON.stringify(arr)
      loadedForRef.current = kvKey
    })

    setSelectedItemIndex(null)
    setValidationError(null)
    toast('Draft reset')
  }, [kvKey, collection])

  // ── Undo/Redo ──

  const performUndo = useCallback(() => {
    const entry = history.undo()
    if (!entry) return

    kv.set(entry.target, entry.before)

    // If the undone entry is our current collection, refresh
    if (entry.target === kvKey) {
      const arr = Array.isArray(entry.before) ? entry.before as Item[] : []
      setItems(arr)
      originalRef.current = JSON.stringify(arr)
      setSelectedItemIndex(null)
    }

    toast(`Undo: ${entry.label}`)
  }, [kvKey])

  const performRedo = useCallback(() => {
    const entry = history.redo()
    if (!entry) return

    kv.set(entry.target, entry.after)

    if (entry.target === kvKey) {
      const arr = Array.isArray(entry.after) ? entry.after as Item[] : []
      setItems(arr)
      originalRef.current = JSON.stringify(arr)
      setSelectedItemIndex(null)
    }

    toast(`Redo: ${entry.label}`)
  }, [kvKey])

  return {
    isCollectionSection,
    collection,
    kvKey,
    items,
    selectedItemIndex,
    isDirty,
    validationError,
    selectItem,
    setItemField,
    addItem,
    removeItem,
    moveItem,
    apply,
    reset,
    performUndo,
    performRedo,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    itemFields: collection?.itemFields ?? [],
  }
}
