/**
 * content-bulk-transforms.ts — Safe, deterministic bulk content transforms.
 *
 * Each transform:
 *  1. Takes a safety snapshot before mutation
 *  2. Reads current KV state
 *  3. Applies a deterministic transform
 *  4. Validates result against Zod schema
 *  5. Writes through kv.set() + pushes labeled history entry
 *
 * Pure logic — no React. Returns a result summary.
 */

import { kv } from '@/lib/local-storage-kv'
import { validateKV } from '@/lib/content-schema'
import { history } from '@/lib/history-store'
import { takeSafetySnapshot } from '@/lib/snapshot-guardrails'
import { enforceCurrentRole } from '@/lib/studio-permissions'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BulkTransformResult {
  success: boolean
  label: string
  /** Count of items/fields affected */
  affected: number
  error?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Title-case a string: "hello world" → "Hello World" */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Transforms ─────────────────────────────────────────────────────────────

/**
 * Enable all sections (set enabled: true on every section).
 */
export async function bulkEnableAllSections(namespace = 'founder-hub'): Promise<BulkTransformResult> {
  enforceCurrentRole('studio:bulk-ops')
  const key = `${namespace}-sections`
  const label = 'Bulk: Enable All Sections'
  await takeSafetySnapshot('bulk-transform', label)

  const sections = await kv.get<Array<Record<string, unknown>>>(key)
  if (!sections || !Array.isArray(sections)) {
    return { success: false, label, affected: 0, error: 'No sections data found' }
  }

  const before = structuredClone(sections)
  let affected = 0
  const updated = sections.map(s => {
    if (s.enabled !== true) {
      affected++
      return { ...s, enabled: true }
    }
    return s
  })

  if (affected === 0) {
    return { success: true, label, affected: 0 }
  }

  const validation = validateKV(key, updated)
  if (validation && !validation.success) {
    return { success: false, label, affected: 0, error: validation.error }
  }

  await kv.set(key, updated)
  history.push({ label, target: key, before, after: updated, source: 'manual' })
  return { success: true, label, affected }
}

/**
 * Disable non-essential sections (keep only hero, about, contact enabled).
 */
export async function bulkDisableNonEssential(namespace = 'founder-hub'): Promise<BulkTransformResult> {
  enforceCurrentRole('studio:bulk-ops')
  const key = `${namespace}-sections`
  const label = 'Bulk: Disable Non-Essential Sections'
  await takeSafetySnapshot('bulk-transform', label)

  const sections = await kv.get<Array<Record<string, unknown>>>(key)
  if (!sections || !Array.isArray(sections)) {
    return { success: false, label, affected: 0, error: 'No sections data found' }
  }

  const essential = new Set(['hero', 'about', 'contact'])
  const before = structuredClone(sections)
  let affected = 0
  const updated = sections.map(s => {
    const id = String(s.id ?? '').toLowerCase()
    const type = String(s.type ?? '').toLowerCase()
    if (!essential.has(id) && !essential.has(type) && s.enabled !== false) {
      affected++
      return { ...s, enabled: false }
    }
    return s
  })

  if (affected === 0) {
    return { success: true, label, affected: 0 }
  }

  const validation = validateKV(key, updated)
  if (validation && !validation.success) {
    return { success: false, label, affected: 0, error: validation.error }
  }

  await kv.set(key, updated)
  history.push({ label, target: key, before, after: updated, source: 'manual' })
  return { success: true, label, affected }
}

/**
 * Sort sections alphabetically by title (hero stays first).
 */
export async function bulkSortSectionsAlpha(namespace = 'founder-hub'): Promise<BulkTransformResult> {
  enforceCurrentRole('studio:bulk-ops')
  const key = `${namespace}-sections`
  const label = 'Bulk: Sort Sections Alphabetically'
  await takeSafetySnapshot('bulk-transform', label)

  const sections = await kv.get<Array<Record<string, unknown>>>(key)
  if (!sections || !Array.isArray(sections)) {
    return { success: false, label, affected: 0, error: 'No sections data found' }
  }

  const before = structuredClone(sections)
  const hero = sections.filter(s => String(s.id ?? '').toLowerCase() === 'hero' || String(s.type ?? '').toLowerCase() === 'hero')
  const rest = sections.filter(s => String(s.id ?? '').toLowerCase() !== 'hero' && String(s.type ?? '').toLowerCase() !== 'hero')

  rest.sort((a, b) => {
    const aTitle = String(a.title ?? a.label ?? a.id ?? '')
    const bTitle = String(b.title ?? b.label ?? b.id ?? '')
    return aTitle.localeCompare(bTitle)
  })

  const updated = [...hero, ...rest]

  const validation = validateKV(key, updated)
  if (validation && !validation.success) {
    return { success: false, label, affected: 0, error: validation.error }
  }

  await kv.set(key, updated)
  history.push({ label, target: key, before, after: updated, source: 'manual' })
  return { success: true, label, affected: rest.length }
}

/**
 * Normalize project titles: trim whitespace and apply title case.
 */
export async function bulkNormalizeProjectTitles(namespace = 'founder-hub'): Promise<BulkTransformResult> {
  enforceCurrentRole('studio:bulk-ops')
  const key = `${namespace}-projects`
  const label = 'Bulk: Normalize Project Titles'
  await takeSafetySnapshot('bulk-transform', label)

  const projects = await kv.get<Array<Record<string, unknown>>>(key)
  if (!projects || !Array.isArray(projects)) {
    return { success: false, label, affected: 0, error: 'No projects data found' }
  }

  const before = structuredClone(projects)
  let affected = 0
  const updated = projects.map(p => {
    const title = typeof p.title === 'string' ? p.title : ''
    const normalized = titleCase(title.trim())
    if (normalized !== title) {
      affected++
      return { ...p, title: normalized }
    }
    return p
  })

  if (affected === 0) {
    return { success: true, label, affected: 0 }
  }

  const validation = validateKV(key, updated)
  if (validation && !validation.success) {
    return { success: false, label, affected: 0, error: validation.error }
  }

  await kv.set(key, updated)
  history.push({ label, target: key, before, after: updated, source: 'manual' })
  return { success: true, label, affected }
}
