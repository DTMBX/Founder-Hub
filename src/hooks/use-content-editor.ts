/**
 * use-content-editor.ts — Content service hook for registry-backed editors.
 *
 * Wraps useEditorState with content registry awareness:
 *  - Auto-resolves schema, fields, storage key from registry id
 *  - Provides typed field update helpers (setField, setNestedField)
 *  - Adds Zod validation via registry schema
 *  - Integrates with dirty tracking, history, undo/redo
 *  - Provides field-level onChange for FieldRenderer
 *
 * Usage:
 *   const editor = useContentEditor('about')
 *   // editor.value — current about content
 *   // editor.setField('mission', 'New mission')
 *   // editor.isDirty, editor.save(), editor.undo(), editor.redo()
 *   // editor.fields — FieldDef[] for rendering
 *   // editor.entry — registry metadata
 */

import { useCallback, useMemo } from 'react'
import { useEditorState, dirtyTracker } from '@/lib/editor-state'
import { getContentEntry, groupFields } from '@/lib/content-registry'
import type { ContentRegistryEntry, FieldDef } from '@/lib/content-registry'
import type { EditorState } from '@/lib/editor-state'
import { useEffect } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContentEditor<T> extends EditorState<T> {
  /** Registry entry metadata */
  entry: ContentRegistryEntry<T>
  /** Field definitions from the registry */
  fields: FieldDef[]
  /** Fields grouped by their group property */
  fieldGroups: Map<string, FieldDef[]>
  /** Update a single top-level field by key */
  setField: (key: string, fieldValue: unknown) => void
  /** Get a field value by dot-path key */
  getField: (key: string) => unknown
}

// ─── Helper: Get nested value ───────────────────────────────────────────────

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/** Set a value at a dot-path, returning a new object */
function setNestedValue<T>(obj: T, path: string, value: unknown): T {
  const parts = path.split('.')
  if (parts.length === 1) {
    return { ...(obj as object), [parts[0]]: value } as T
  }
  const [head, ...rest] = parts
  const parent = (obj as Record<string, unknown>)[head]
  return {
    ...(obj as object),
    [head]: setNestedValue(parent ?? {}, rest.join('.'), value),
  } as T
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useContentEditor<T = Record<string, unknown>>(
  registryId: string
): ContentEditor<T> {
  const entry = getContentEntry(registryId) as ContentRegistryEntry<T> | undefined

  if (!entry) {
    throw new Error(
      `useContentEditor: No registry entry found for "${registryId}". ` +
      `Register it in content-registry.ts first.`
    )
  }

  // Build Zod validation function from the registry schema
  const validate = useCallback(
    (val: T): string | null => {
      const result = entry.schema.safeParse(val)
      if (result.success) return null
      return result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
    },
    [entry.schema]
  )

  const editor = useEditorState<T>(
    entry.storageKey,
    entry.defaultValue() as T,
    {
      label: entry.label,
      source: 'editor',
      validate,
    }
  )

  // Sync dirty state with global tracker
  useEffect(() => {
    if (editor.isDirty) {
      dirtyTracker.markDirty(entry.storageKey)
    } else {
      dirtyTracker.markClean(entry.storageKey)
    }
    return () => {
      dirtyTracker.markClean(entry.storageKey)
    }
  }, [editor.isDirty, entry.storageKey])

  const setField = useCallback(
    (key: string, fieldValue: unknown) => {
      editor.update(
        (prev) => setNestedValue(prev, key, fieldValue),
        `Updated ${key}`
      )
    },
    [editor]
  )

  const getField = useCallback(
    (key: string): unknown => {
      return getNestedValue(editor.value, key)
    },
    [editor.value]
  )

  const fieldGroups = useMemo(
    () => groupFields(entry.fields),
    [entry.fields]
  )

  return {
    ...editor,
    entry,
    fields: entry.fields,
    fieldGroups,
    setField,
    getField,
  }
}
