/**
 * use-section-inspector.ts — Draft-based inspector editing for sections.
 *
 * Provides a local draft that the InspectorPanel can mutate without spamming
 * history. On "Apply", the draft is validated and committed to:
 *   - founder-hub-sections (for config fields: title, enabled, investorRelevant)
 *   - the section's content KV key (for content fields from registry editableFields)
 * On "Reset", the draft reverts to the persisted state.
 *
 * Undo/Redo:
 *   history-store only returns entries — it does NOT write to KV.
 *   This hook wraps undo()/redo() to also apply the before/after values.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useKV, kv } from '@/lib/local-storage-kv'
import { SectionsArraySchema } from '@/lib/content-schema'
import { history, useHistory } from '@/lib/history-store'
import { useStudioSelection } from '@/lib/use-studio-selection'
import { SECTION_REGISTRY, type EditableField } from '@/registry/sections'
import type { Section } from '@/lib/types'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Editable section config fields (common to all sections) */
export interface SectionConfigDraft {
  title: string
  enabled: boolean
  investorRelevant: boolean
}

export interface InspectorState {
  /** Currently selected section ID */
  sectionId: string | null
  /** Section type */
  sectionType: string | null
  /** Registry label */
  label: string | null
  /** Registry KV key for content data */
  kvKey: string | null
  /** Editable field descriptors from registry */
  editableFields: EditableField[]
  /** Local draft of section config fields */
  configDraft: SectionConfigDraft | null
  /** Local draft of content KV data (only top-level fields referenced by editableFields) */
  contentDraft: Record<string, unknown> | null
  /** Whether the draft differs from persisted state */
  isDirty: boolean
  /** Last validation error, if any */
  validationError: string | null
  /** Apply committed draft to persistence */
  apply: () => void
  /** Discard draft and reload from persisted state */
  reset: () => void
  /** Update a config field in the draft */
  setConfigField: <K extends keyof SectionConfigDraft>(key: K, value: SectionConfigDraft[K]) => void
  /** Update a content field in the draft */
  setContentField: (key: string, value: unknown) => void
  /** Undo: apply the previous state from history */
  performUndo: () => void
  /** Redo: re-apply the next state from history */
  performRedo: () => void
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SECTIONS_KV_KEY = 'founder-hub-sections'

/** Type-aware default for a missing editable field value */
function fieldDefault(field: EditableField): unknown {
  switch (field.type) {
    case 'number': return 0
    case 'boolean': return false
    case 'tags': return []
    default: return ''
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSectionInspector(): InspectorState {
  const selection = useStudioSelection()
  const historyState = useHistory()
  const [sections, setSections] = useKV<Section[]>(SECTIONS_KV_KEY, [])

  const [configDraft, setConfigDraft] = useState<SectionConfigDraft | null>(null)
  const [contentDraft, setContentDraft] = useState<Record<string, unknown> | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Track which section the draft was loaded for, to detect selection changes
  const draftSourceRef = useRef<string | null>(null)
  const contentDraftOriginalRef = useRef<Record<string, unknown> | null>(null)

  const sectionId = selection.sectionId
  const sectionType = selection.sectionType
  const registry = sectionType ? SECTION_REGISTRY[sectionType] : undefined
  const kvKey = registry?.kvKey ?? null
  const editableFields = useMemo(
    () => registry?.editableFields ?? [],
    [registry],
  )

  // ── Load draft when selection changes ──

  useEffect(() => {
    if (draftSourceRef.current === sectionId) return
    draftSourceRef.current = sectionId

    setValidationError(null)

    if (!sectionId || !sections?.length) {
      setConfigDraft(null)
      setContentDraft(null)
      return
    }

    const section = sections.find(s => s.id === sectionId)
    if (!section) {
      setConfigDraft(null)
      setContentDraft(null)
      return
    }

    // Load config draft from section array
    setConfigDraft({
      title: section.title,
      enabled: section.enabled,
      investorRelevant: section.investorRelevant,
    })

    // Load content draft if this section has a KV key and editable fields
    if (kvKey && editableFields.length > 0) {
      kv.get<Record<string, unknown>>(kvKey).then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Extract only the fields referenced by editableFields
          const draft: Record<string, unknown> = {}
          for (const field of editableFields) {
            draft[field.key] = (data as Record<string, unknown>)[field.key] ?? fieldDefault(field)
          }
          setContentDraft(draft)
          contentDraftOriginalRef.current = { ...draft }
        } else {
          setContentDraft(null)
          contentDraftOriginalRef.current = null
        }
      })
    } else {
      setContentDraft(null)
      contentDraftOriginalRef.current = null
    }
  }, [sectionId, sections, kvKey, editableFields])

  // ── Dirty check ──

  const isDirty = (() => {
    if (!sectionId || !sections?.length || !configDraft) return false
    const section = sections.find(s => s.id === sectionId)
    if (!section) return false

    const configChanged =
      configDraft.title !== section.title ||
      configDraft.enabled !== section.enabled ||
      configDraft.investorRelevant !== section.investorRelevant

    const contentChanged = contentDraft !== null &&
      contentDraftOriginalRef.current !== null &&
      JSON.stringify(contentDraft) !== JSON.stringify(contentDraftOriginalRef.current)

    return configChanged || contentChanged
  })()

  // ── Setters ──

  const setConfigField = useCallback(<K extends keyof SectionConfigDraft>(
    key: K,
    value: SectionConfigDraft[K],
  ) => {
    setConfigDraft(prev => prev ? { ...prev, [key]: value } : prev)
    setValidationError(null)
  }, [])

  const setContentField = useCallback((key: string, value: unknown) => {
    setContentDraft(prev => prev ? { ...prev, [key]: value } : prev)
    setValidationError(null)
  }, [])

  // ── Apply ──

  const apply = useCallback(() => {
    if (!sectionId || !configDraft || !sections?.length) return

    const sectionIndex = sections.findIndex(s => s.id === sectionId)
    if (sectionIndex === -1) return

    // Apply config changes to sections array
    const updatedSections = sections.map(s => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        title: configDraft.title,
        enabled: configDraft.enabled,
        investorRelevant: configDraft.investorRelevant,
      }
    })

    // Validate sections array
    const result = SectionsArraySchema.safeParse(updatedSections)
    if (!result.success) {
      const msg = result.error.issues.map(i => i.message).join('; ')
      setValidationError(msg)
      toast.error('Validation failed: ' + msg)
      return
    }

    // Check if config actually changed
    const originalSection = sections[sectionIndex]
    const configChanged =
      configDraft.title !== originalSection.title ||
      configDraft.enabled !== originalSection.enabled ||
      configDraft.investorRelevant !== originalSection.investorRelevant

    if (configChanged) {
      history.push({
        label: `Edited "${configDraft.title}" section config`,
        target: SECTIONS_KV_KEY,
        before: sections,
        after: updatedSections,
        source: 'visual-builder',
      })
      setSections(updatedSections)
    }

    // Apply content changes if applicable
    if (kvKey && contentDraft && editableFields.length > 0) {
      kv.get<Record<string, unknown>>(kvKey).then(currentData => {
        if (!currentData || typeof currentData !== 'object' || Array.isArray(currentData)) return

        const updated = { ...currentData }
        let contentChanged = false
        for (const field of editableFields) {
          if (contentDraft[field.key] !== undefined &&
              JSON.stringify(contentDraft[field.key]) !== JSON.stringify((currentData as Record<string, unknown>)[field.key])) {
            (updated as Record<string, unknown>)[field.key] = contentDraft[field.key]
            contentChanged = true
          }
        }

        if (contentChanged) {
          // Validate with content schema if available
          if (registry?.contentSchema) {
            const contentResult = registry.contentSchema.safeParse(updated)
            if (!contentResult.success) {
              const msg = 'Content validation: ' + (contentResult as { error: { issues: { message: string }[] } }).error.issues.map((i: { message: string }) => i.message).join('; ')
              setValidationError(msg)
              toast.error(msg)
              return
            }
          }

          history.push({
            label: `Edited "${configDraft.title}" content`,
            target: kvKey,
            before: currentData,
            after: updated,
            source: 'visual-builder',
          })
          kv.set(kvKey, updated)
        }
      })
    }

    setValidationError(null)
    if (contentDraft) {
      contentDraftOriginalRef.current = { ...contentDraft }
    }
    toast.success('Changes applied')
  }, [sectionId, configDraft, sections, setSections, kvKey, contentDraft, editableFields, registry])

  // ── Reset ──

  const reset = useCallback(() => {
    // Force reload by clearing draft source — next effect run will reload
    draftSourceRef.current = null
    setValidationError(null)
    // Trigger re-read by resetting refs
    const section = sections?.find(s => s.id === sectionId)
    if (section) {
      setConfigDraft({
        title: section.title,
        enabled: section.enabled,
        investorRelevant: section.investorRelevant,
      })
    }
    if (kvKey && editableFields.length > 0) {
      kv.get<Record<string, unknown>>(kvKey).then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const draft: Record<string, unknown> = {}
          for (const field of editableFields) {
            draft[field.key] = (data as Record<string, unknown>)[field.key] ?? fieldDefault(field)
          }
          setContentDraft(draft)
          contentDraftOriginalRef.current = { ...draft }
        } else {
          setContentDraft(null)
          contentDraftOriginalRef.current = null
        }
      })
    }
    draftSourceRef.current = sectionId
    toast('Draft reset')
  }, [sectionId, sections, kvKey, editableFields])

  // ── Undo/Redo that actually applies to KV ──

  const performUndo = useCallback(() => {
    const entry = history.undo()
    if (!entry) return

    // Apply the 'before' value to the target KV key
    if (entry.target === SECTIONS_KV_KEY) {
      setSections(entry.before as Section[])
    } else {
      kv.set(entry.target, entry.before)
    }

    // If the undone entry targets our current selection, refresh the draft
    draftSourceRef.current = null // triggers re-load on next render
    toast(`Undo: ${entry.label}`)
  }, [setSections])

  const performRedo = useCallback(() => {
    const entry = history.redo()
    if (!entry) return

    // Apply the 'after' value to the target KV key
    if (entry.target === SECTIONS_KV_KEY) {
      setSections(entry.after as Section[])
    } else {
      kv.set(entry.target, entry.after)
    }

    draftSourceRef.current = null
    toast(`Redo: ${entry.label}`)
  }, [setSections])

  return {
    sectionId,
    sectionType,
    label: registry?.label ?? null,
    kvKey,
    editableFields,
    configDraft,
    contentDraft,
    isDirty,
    validationError,
    apply,
    reset,
    setConfigField,
    setContentField,
    performUndo,
    performRedo,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
  }
}
