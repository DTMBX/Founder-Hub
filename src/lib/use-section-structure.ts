/**
 * use-section-structure.ts — Action hook for section structure operations.
 *
 * Provides strongly-typed CRUD operations for the canonical section order
 * stored in `founder-hub-sections` via the KV system. All mutations:
 *   - validate through SectionsArraySchema
 *   - push undo/redo entries to history-store
 *   - write through useKV setter
 *
 * This hook is the single authority for structural changes to section order.
 */

import { useCallback, useMemo } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { SectionsArraySchema } from '@/lib/content-schema'
import { history } from '@/lib/history-store'
import { SECTION_REGISTRY, type SectionRegistryEntry } from '@/registry/sections'
import { setStudioSelection, clearStudioSelection } from '@/lib/use-studio-selection'
import type { Section } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StructureError {
  operation: string
  message: string
}

export interface SectionStructureActions {
  /** Current sections in canonical order (sorted by .order) */
  orderedSections: Section[]
  /** Move a section from one index to another (indices into orderedSections) */
  moveSection: (fromIndex: number, toIndex: number) => StructureError | null
  /** Add a new section of the given type. Appended to end, or at atIndex if given. */
  addSection: (type: string, atIndex?: number) => StructureError | null
  /** Remove a section by ID (hero is protected) */
  removeSection: (sectionId: string) => StructureError | null
  /** Duplicate a section — only if registry allowMultiple is true */
  duplicateSection: (sectionId: string) => StructureError | null
  /** Select a section by ID — updates the studio selection store */
  selectSection: (sectionId: string) => void
  /** Section types that can be added (not already present for non-multiple types) */
  addableTypes: SectionRegistryEntry[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Reassign .order values to match array position */
function reindex(sections: Section[]): Section[] {
  return sections.map((s, i) => ({ ...s, order: i }))
}

/** Validate via Zod. Returns null if valid, error string if not. */
function validate(sections: Section[]): string | null {
  const result = SectionsArraySchema.safeParse(sections)
  if (!result.success) {
    return result.error.issues.map(i => i.message).join('; ')
  }
  return null
}

// ─── Constants ──────────────────────────────────────────────────────────────

const KV_KEY = 'founder-hub-sections'
const HISTORY_SOURCE = 'visual-builder' as const

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSectionStructure(): SectionStructureActions {
  const [sections, setSections] = useKV<Section[]>(KV_KEY, [])

  const orderedSections = useMemo(
    () => [...(sections || [])].sort((a, b) => a.order - b.order),
    [sections],
  )

  const moveSection = useCallback(
    (fromIndex: number, toIndex: number): StructureError | null => {
      const current = [...orderedSections]
      if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) {
        return { operation: 'moveSection', message: 'Index out of bounds' }
      }
      if (fromIndex === toIndex) return null

      const [moved] = current.splice(fromIndex, 1)
      current.splice(toIndex, 0, moved)
      const updated = reindex(current)

      const error = validate(updated)
      if (error) return { operation: 'moveSection', message: error }

      history.push({
        label: `Moved "${moved.title}" from position ${fromIndex + 1} to ${toIndex + 1}`,
        target: KV_KEY,
        before: sections,
        after: updated,
        source: HISTORY_SOURCE,
      })

      setSections(updated)
      return null
    },
    [orderedSections, sections, setSections],
  )

  const addSection = useCallback(
    (type: string, atIndex?: number): StructureError | null => {
      const registry = SECTION_REGISTRY[type]
      if (!registry) {
        return { operation: 'addSection', message: `Unknown section type: ${type}` }
      }

      // Enforce uniqueness for non-multiple types
      if (!registry.allowMultiple) {
        const existing = orderedSections.find(s => s.type === type || s.id === type)
        if (existing) {
          return {
            operation: 'addSection',
            message: `Section type "${type}" already exists and does not allow multiple instances`,
          }
        }
      }

      const newSection: Section = {
        id: registry.allowMultiple ? `${type}-${crypto.randomUUID().slice(0, 8)}` : type,
        type: type as Section['type'],
        title: registry.label,
        content: '',
        order: 0, // reassigned by reindex
        enabled: true,
        investorRelevant: registry.supportsInvestorMode,
      }

      const current = [...orderedSections]
      const insertAt = atIndex != null
        ? Math.min(Math.max(0, atIndex), current.length)
        : current.length
      current.splice(insertAt, 0, newSection)
      const updated = reindex(current)

      const error = validate(updated)
      if (error) return { operation: 'addSection', message: error }

      history.push({
        label: `Added "${registry.label}" section`,
        target: KV_KEY,
        before: sections,
        after: updated,
        source: HISTORY_SOURCE,
      })

      setSections(updated)
      setStudioSelection(newSection.id, type)
      return null
    },
    [orderedSections, sections, setSections],
  )

  const removeSection = useCallback(
    (sectionId: string): StructureError | null => {
      const target = orderedSections.find(s => s.id === sectionId)
      if (!target) {
        return { operation: 'removeSection', message: `Section "${sectionId}" not found` }
      }
      if (target.type === 'hero') {
        return { operation: 'removeSection', message: 'Hero section cannot be removed' }
      }

      const current = orderedSections.filter(s => s.id !== sectionId)
      const updated = reindex(current)

      const error = validate(updated)
      if (error) return { operation: 'removeSection', message: error }

      history.push({
        label: `Removed "${target.title}" section`,
        target: KV_KEY,
        before: sections,
        after: updated,
        source: HISTORY_SOURCE,
      })

      setSections(updated)
      clearStudioSelection()
      return null
    },
    [orderedSections, sections, setSections],
  )

  const duplicateSection = useCallback(
    (sectionId: string): StructureError | null => {
      const source = orderedSections.find(s => s.id === sectionId)
      if (!source) {
        return { operation: 'duplicateSection', message: `Section "${sectionId}" not found` }
      }

      const registry = SECTION_REGISTRY[source.type]
      if (!registry?.allowMultiple) {
        return {
          operation: 'duplicateSection',
          message: `Section type "${source.type}" does not allow duplicates`,
        }
      }

      const clone: Section = {
        ...source,
        id: `${source.type}-${crypto.randomUUID().slice(0, 8)}`,
        title: `${source.title} (Copy)`,
        order: 0,
      }

      const sourceIdx = orderedSections.findIndex(s => s.id === sectionId)
      const current = [...orderedSections]
      current.splice(sourceIdx + 1, 0, clone)
      const updated = reindex(current)

      const error = validate(updated)
      if (error) return { operation: 'duplicateSection', message: error }

      history.push({
        label: `Duplicated "${source.title}" section`,
        target: KV_KEY,
        before: sections,
        after: updated,
        source: HISTORY_SOURCE,
      })

      setSections(updated)
      setStudioSelection(clone.id, clone.type)
      return null
    },
    [orderedSections, sections, setSections],
  )

  const selectSection = useCallback(
    (sectionId: string) => {
      const section = orderedSections.find(s => s.id === sectionId)
      if (section) {
        const registry = SECTION_REGISTRY[section.type]
        setStudioSelection(sectionId, section.type, registry?.kvKey ?? null)
      }
    },
    [orderedSections],
  )

  const addableTypes = useMemo(() => {
    const presentTypes = new Set<string>(orderedSections.map(s => s.type))
    return Object.values(SECTION_REGISTRY).filter(entry => {
      if (entry.type === 'hero') return false
      if (!entry.allowMultiple && presentTypes.has(entry.type)) return false
      return true
    })
  }, [orderedSections])

  return {
    orderedSections,
    moveSection,
    addSection,
    removeSection,
    duplicateSection,
    selectSection,
    addableTypes,
  }
}
