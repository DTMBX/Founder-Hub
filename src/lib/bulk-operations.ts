/**
 * bulk-operations.ts — Safe bulk operations for grounded datasets.
 *
 * All operations:
 *  - Read current state from KV
 *  - Validate before commit
 *  - Push a single labeled history entry
 *  - Write through kv.set()
 *  - Are reversible through undo
 *
 * Operations never bypass canonical write paths.
 */

import { kv } from '@/lib/local-storage-kv'
import { SectionsArraySchema, ProjectsArraySchema } from '@/lib/content-schema'
import { history } from '@/lib/history-store'
import { enforceCurrentRole } from '@/lib/studio-permissions'
import type { Section } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BulkResult {
  success: boolean
  message: string
  affectedCount: number
}

// ─── Section Bulk Operations ────────────────────────────────────────────────

const SECTIONS_KEY = 'founder-hub-sections'

/**
 * Enable all sections.
 */
export async function bulkEnableAllSections(): Promise<BulkResult> {
  enforceCurrentRole('studio:bulk-ops')
  const sections = await kv.get<Section[]>(SECTIONS_KEY)
  if (!sections) return { success: false, message: 'No sections data found', affectedCount: 0 }

  const updated = sections.map(s => ({ ...s, enabled: true }))
  const result = SectionsArraySchema.safeParse(updated)
  if (!result.success) {
    return { success: false, message: result.error.issues.map(i => i.message).join('; '), affectedCount: 0 }
  }

  const changed = sections.filter(s => !s.enabled).length
  if (changed === 0) return { success: true, message: 'All sections already enabled', affectedCount: 0 }

  history.push({
    label: `Bulk enabled all sections (${changed} changed)`,
    target: SECTIONS_KEY,
    before: sections,
    after: updated,
    source: 'manual',
  })

  await kv.set(SECTIONS_KEY, updated)
  return { success: true, message: `Enabled ${changed} section(s)`, affectedCount: changed }
}

/**
 * Disable all non-essential sections (keep hero, about, contact).
 */
export async function bulkDisableNonEssential(): Promise<BulkResult> {
  enforceCurrentRole('studio:bulk-ops')
  const ESSENTIAL = new Set(['hero', 'about', 'contact'])
  const sections = await kv.get<Section[]>(SECTIONS_KEY)
  if (!sections) return { success: false, message: 'No sections data found', affectedCount: 0 }

  const updated = sections.map(s => ({
    ...s,
    enabled: ESSENTIAL.has(s.type) ? s.enabled : false,
  }))

  const result = SectionsArraySchema.safeParse(updated)
  if (!result.success) {
    return { success: false, message: result.error.issues.map(i => i.message).join('; '), affectedCount: 0 }
  }

  const changed = sections.filter((s, i) => s.enabled !== updated[i].enabled).length
  if (changed === 0) return { success: true, message: 'No changes needed', affectedCount: 0 }

  history.push({
    label: `Bulk disabled non-essential sections (${changed} changed)`,
    target: SECTIONS_KEY,
    before: sections,
    after: updated,
    source: 'manual',
  })

  await kv.set(SECTIONS_KEY, updated)
  return { success: true, message: `Disabled ${changed} section(s)`, affectedCount: changed }
}

/**
 * Sort sections alphabetically by title, keeping hero pinned at position 0.
 */
export async function bulkSortSectionsAlpha(): Promise<BulkResult> {
  enforceCurrentRole('studio:bulk-ops')
  const sections = await kv.get<Section[]>(SECTIONS_KEY)
  if (!sections) return { success: false, message: 'No sections data found', affectedCount: 0 }

  const hero = sections.find(s => s.type === 'hero')
  const rest = sections.filter(s => s.type !== 'hero').sort((a, b) => a.title.localeCompare(b.title))
  const sorted = hero ? [hero, ...rest] : rest
  const updated = sorted.map((s, i) => ({ ...s, order: i }))

  const result = SectionsArraySchema.safeParse(updated)
  if (!result.success) {
    return { success: false, message: result.error.issues.map(i => i.message).join('; '), affectedCount: 0 }
  }

  history.push({
    label: 'Bulk sorted sections alphabetically',
    target: SECTIONS_KEY,
    before: sections,
    after: updated,
    source: 'manual',
  })

  await kv.set(SECTIONS_KEY, updated)
  return { success: true, message: `Sorted ${updated.length} section(s)`, affectedCount: updated.length }
}

// ─── Project Bulk Operations ────────────────────────────────────────────────

const PROJECTS_KEY = 'founder-hub-projects'

interface ProjectItem {
  id: string
  title: string
  updatedAt?: number
  [k: string]: unknown
}

/**
 * Normalize project titles: trim whitespace and title-case.
 */
export async function bulkNormalizeProjectTitles(): Promise<BulkResult> {
  enforceCurrentRole('studio:bulk-ops')
  const projects = await kv.get<ProjectItem[]>(PROJECTS_KEY)
  if (!projects || projects.length === 0) {
    return { success: false, message: 'No projects data found', affectedCount: 0 }
  }

  function titleCase(str: string): string {
    return str.trim().replace(/\b\w/g, c => c.toUpperCase())
  }

  const updated = projects.map(p => {
    const normalized = titleCase(p.title)
    if (normalized === p.title) return p
    return { ...p, title: normalized, updatedAt: Date.now() }
  })

  const changed = projects.filter((p, i) => p.title !== updated[i].title).length
  if (changed === 0) return { success: true, message: 'All project titles already normalized', affectedCount: 0 }

  const result = ProjectsArraySchema.safeParse(updated)
  if (!result.success) {
    return { success: false, message: result.error.issues.map(i => i.message).join('; '), affectedCount: 0 }
  }

  history.push({
    label: `Normalized ${changed} project title(s)`,
    target: PROJECTS_KEY,
    before: projects,
    after: updated,
    source: 'manual',
  })

  await kv.set(PROJECTS_KEY, updated)
  return { success: true, message: `Normalized ${changed} project title(s)`, affectedCount: changed }
}
