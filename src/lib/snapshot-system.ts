/**
 * snapshot-system.ts — Export/import/validate all KV-backed content.
 *
 * Provides a complete snapshot mechanism for the Site Studio:
 *   - exportSnapshot(): reads all schema-backed KV keys → structured JSON
 *   - validateSnapshot(): validates entire payload against Zod schemas
 *   - importSnapshot(): validates then writes all KV keys atomically
 *   - downloadSnapshot(): triggers browser download of export
 *
 * All imports go through kv.set() → history.push() so they participate
 * in the standard undo chain.
 */

import { kv } from '@/lib/local-storage-kv'
import { KV_SCHEMAS, validateKV } from '@/lib/content-schema'
import { history } from '@/lib/history-store'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Snapshot {
  /** Format version — bump if shape changes */
  version: 1
  /** ISO timestamp of export */
  exportedAt: string
  /** Map of KV key → value for every schema-backed key */
  data: Record<string, unknown>
}

export interface SnapshotValidationResult {
  valid: boolean
  /** Per-key validation results */
  keys: {
    key: string
    valid: boolean
    error?: string
  }[]
}

// ─── Schema-Backed KV Keys ─────────────────────────────────────────────────

/** All KV keys that have registered Zod schemas — the canonical set. */
const SCHEMA_KEYS = Object.keys(KV_SCHEMAS)

// ─── Export ─────────────────────────────────────────────────────────────────

/**
 * Read all schema-backed KV keys and return a structured snapshot.
 * Only includes keys that actually have data.
 */
export async function exportSnapshot(): Promise<Snapshot> {
  const data: Record<string, unknown> = {}

  for (const key of SCHEMA_KEYS) {
    const value = await kv.get(key)
    if (value !== null) {
      data[key] = value
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Export and trigger browser download as .json file.
 */
export async function downloadSnapshot(): Promise<void> {
  const snapshot = await exportSnapshot()
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `founder-hub-snapshot-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Validate ───────────────────────────────────────────────────────────────

/**
 * Validate a snapshot payload against all registered schemas.
 * Does NOT mutate any state.
 */
export function validateSnapshot(snapshot: unknown): SnapshotValidationResult {
  // Basic shape check
  if (
    !snapshot ||
    typeof snapshot !== 'object' ||
    !('version' in snapshot) ||
    !('data' in snapshot) ||
    (snapshot as Snapshot).version !== 1
  ) {
    return {
      valid: false,
      keys: [{ key: '(root)', valid: false, error: 'Invalid snapshot format or unsupported version' }],
    }
  }

  const { data } = snapshot as Snapshot
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      keys: [{ key: '(root)', valid: false, error: 'Snapshot data is not an object' }],
    }
  }

  const keys: SnapshotValidationResult['keys'] = []
  let allValid = true

  for (const [key, value] of Object.entries(data)) {
    // Only validate keys we have schemas for; ignore unknown keys
    const result = validateKV(key, value)
    if (result === null) {
      // No schema for this key — skip (don't fail, don't import)
      keys.push({ key, valid: true, error: 'No schema registered — will be skipped on import' })
      continue
    }
    if (result.success) {
      keys.push({ key, valid: true })
    } else {
      allValid = false
      keys.push({ key, valid: false, error: result.error })
    }
  }

  return { valid: allValid, keys }
}

// ─── Import ─────────────────────────────────────────────────────────────────

/**
 * Validate and import a snapshot. Writes all keys through kv.set().
 * Pushes a single labeled history entry.
 *
 * Returns validation result. If invalid, aborts without any writes.
 */
export async function importSnapshot(
  snapshot: unknown,
): Promise<SnapshotValidationResult> {
  const validation = validateSnapshot(snapshot)

  if (!validation.valid) {
    return validation
  }

  const { data } = snapshot as Snapshot

  // Capture before-state for history
  const beforeState: Record<string, unknown> = {}
  for (const key of Object.keys(data)) {
    if (KV_SCHEMAS[key]) {
      beforeState[key] = await kv.get(key)
    }
  }

  // Write only schema-backed keys
  for (const [key, value] of Object.entries(data)) {
    if (KV_SCHEMAS[key]) {
      await kv.set(key, value)
    }
  }

  // Single history entry for the entire restore
  history.push({
    label: 'Restored from snapshot',
    target: 'snapshot-restore',
    before: beforeState,
    after: data,
    source: 'manual',
  })

  return validation
}

/**
 * Read a File object and parse as snapshot JSON.
 * Returns the parsed object or throws on invalid JSON.
 */
export function readSnapshotFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        resolve(parsed)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
