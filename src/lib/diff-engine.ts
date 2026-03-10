/**
 * diff-engine.ts — Deterministic JSON/object diff utility for the Site Studio.
 *
 * Compares two JSON-serializable values (primitives, arrays, plain objects)
 * and produces a stable, ordered list of changes classified as:
 *   - added: key/index exists in `after` but not `before`
 *   - removed: key/index exists in `before` but not `after`
 *   - changed: both exist but values differ
 *
 * Design constraints (Phase 11):
 *   - No AST parsing, no syntax highlighting, no string-diff heuristics
 *   - Deterministic output: sorted keys, stable array indices
 *   - Pure functions with no side effects or hidden mutation
 *   - Supports the data shapes actually used in this codebase:
 *     Section[], Project[], Offering[], settings objects, snapshot data maps
 *   - Compact summary + expandable detail for UI consumption
 *
 * Array diffing uses ID-based matching when items have `id` fields,
 * falling back to index-based comparison otherwise.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged'

export interface DiffEntry {
  /** Dot-separated path to the changed value (e.g. "[2].title", "settings.siteName") */
  path: string
  /** Classification of the change */
  status: DiffStatus
  /** Value before the change (undefined for additions) */
  before?: unknown
  /** Value after the change (undefined for removals) */
  after?: unknown
}

export interface DiffResult {
  /** All individual changes, sorted by path */
  entries: DiffEntry[]
  /** Summary counts */
  summary: {
    added: number
    removed: number
    changed: number
    unchanged: number
    total: number
  }
  /** Whether there are any changes at all */
  hasChanges: boolean
}

export interface ScopedDiff {
  /** KV key or scope label */
  scope: string
  /** Human-readable label for display */
  label: string
  /** Diff result for this scope */
  diff: DiffResult
}

// ─── Core Diff ──────────────────────────────────────────────────────────────

/**
 * Compare two JSON-serializable values and produce a deterministic diff.
 * Handles primitives, arrays (ID-based or index-based), and plain objects.
 */
export function diff(before: unknown, after: unknown): DiffResult {
  const entries: DiffEntry[] = []
  diffRecursive(before, after, '', entries)
  entries.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))

  const summary = {
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
    total: entries.length,
  }
  for (const e of entries) {
    summary[e.status]++
  }

  return {
    entries,
    summary,
    hasChanges: summary.added + summary.removed + summary.changed > 0,
  }
}

function diffRecursive(
  before: unknown,
  after: unknown,
  path: string,
  out: DiffEntry[],
): void {
  // Both null/undefined
  if (before === after) {
    if (path) out.push({ path, status: 'unchanged', before, after })
    return
  }

  // One is null/undefined
  if (before == null && after != null) {
    out.push({ path: path || '(root)', status: 'added', after })
    return
  }
  if (before != null && after == null) {
    out.push({ path: path || '(root)', status: 'removed', before })
    return
  }

  // Different types
  if (typeof before !== typeof after) {
    out.push({ path: path || '(root)', status: 'changed', before, after })
    return
  }

  // Primitives
  if (typeof before !== 'object') {
    if (before !== after) {
      out.push({ path: path || '(root)', status: 'changed', before, after })
    } else if (path) {
      out.push({ path, status: 'unchanged', before, after })
    }
    return
  }

  // Arrays
  if (Array.isArray(before) && Array.isArray(after)) {
    diffArrays(before, after, path, out)
    return
  }

  // One array, one not
  if (Array.isArray(before) !== Array.isArray(after)) {
    out.push({ path: path || '(root)', status: 'changed', before, after })
    return
  }

  // Plain objects
  diffObjects(
    before as Record<string, unknown>,
    after as Record<string, unknown>,
    path,
    out,
  )
}

// ─── Object Diff ────────────────────────────────────────────────────────────

function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  path: string,
  out: DiffEntry[],
): void {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  const sortedKeys = [...allKeys].sort()

  for (const key of sortedKeys) {
    const childPath = path ? `${path}.${key}` : key
    const inBefore = key in before
    const inAfter = key in after

    if (inBefore && !inAfter) {
      out.push({ path: childPath, status: 'removed', before: before[key] })
    } else if (!inBefore && inAfter) {
      out.push({ path: childPath, status: 'added', after: after[key] })
    } else {
      // Both exist — recurse only for leaf-level objects, emit change for leaf values
      const bv = before[key]
      const av = after[key]
      if (isLeaf(bv) && isLeaf(av)) {
        if (bv !== av) {
          out.push({ path: childPath, status: 'changed', before: bv, after: av })
        }
        // Skip unchanged leaves to keep output compact
      } else {
        diffRecursive(bv, av, childPath, out)
      }
    }
  }
}

// ─── Array Diff ─────────────────────────────────────────────────────────────

/**
 * Diff two arrays. If items have `id` fields, uses ID-based matching
 * for stable comparison even when order changes. Otherwise falls back
 * to index-based comparison.
 */
function diffArrays(
  before: unknown[],
  after: unknown[],
  path: string,
  out: DiffEntry[],
): void {
  const useIdMatch = hasIdField(before) && hasIdField(after)

  if (useIdMatch) {
    diffArraysById(before as IdRecord[], after as IdRecord[], path, out)
  } else {
    diffArraysByIndex(before, after, path, out)
  }
}

type IdRecord = Record<string, unknown> & { id: string }

function hasIdField(arr: unknown[]): boolean {
  if (arr.length === 0) return false
  return arr.every(
    item => item != null && typeof item === 'object' && 'id' in item && typeof (item as Record<string, unknown>).id === 'string',
  )
}

function diffArraysById(
  before: IdRecord[],
  after: IdRecord[],
  path: string,
  out: DiffEntry[],
): void {
  const beforeMap = new Map(before.map((item, i) => [item.id, { item, index: i }]))
  const afterMap = new Map(after.map((item, i) => [item.id, { item, index: i }]))
  const allIds = new Set([...beforeMap.keys(), ...afterMap.keys()])

  for (const id of allIds) {
    const b = beforeMap.get(id)
    const a = afterMap.get(id)
    const itemPath = `${path}[id=${id}]`

    if (b && !a) {
      out.push({ path: itemPath, status: 'removed', before: b.item })
    } else if (!b && a) {
      out.push({ path: itemPath, status: 'added', after: a.item })
    } else if (b && a) {
      // Item exists in both — diff its fields
      diffObjects(b.item, a.item, itemPath, out)

      // Also note position change if applicable
      if (b.index !== a.index) {
        out.push({
          path: `${itemPath}.(order)`,
          status: 'changed',
          before: b.index,
          after: a.index,
        })
      }
    }
  }
}

function diffArraysByIndex(
  before: unknown[],
  after: unknown[],
  path: string,
  out: DiffEntry[],
): void {
  const maxLen = Math.max(before.length, after.length)

  for (let i = 0; i < maxLen; i++) {
    const childPath = `${path}[${i}]`
    if (i >= before.length) {
      out.push({ path: childPath, status: 'added', after: after[i] })
    } else if (i >= after.length) {
      out.push({ path: childPath, status: 'removed', before: before[i] })
    } else {
      diffRecursive(before[i], after[i], childPath, out)
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isLeaf(value: unknown): boolean {
  return value === null || value === undefined || typeof value !== 'object'
}

/**
 * Format a value for display. Returns a compact string representation.
 * Does not attempt JSON.stringify on large objects — those get "[Object]" / "[Array(n)]".
 */
export function formatDiffValue(value: unknown): string {
  if (value === undefined) return '(undefined)'
  if (value === null) return 'null'
  if (typeof value === 'string') return value.length > 80 ? `"${value.slice(0, 77)}…"` : `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `[Array(${value.length})]`
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length <= 3) return `{ ${keys.join(', ')} }`
    return `{ ${keys.slice(0, 3).join(', ')}, … (${keys.length} keys) }`
  }
  return String(value)
}

/**
 * Filter diff entries to only show changes (no unchanged).
 */
export function changesOnly(result: DiffResult): DiffEntry[] {
  return result.entries.filter(e => e.status !== 'unchanged')
}

/**
 * Filter diff entries by status.
 */
export function filterByStatus(result: DiffResult, ...statuses: DiffStatus[]): DiffEntry[] {
  const set = new Set(statuses)
  return result.entries.filter(e => set.has(e.status))
}

/**
 * Produce a multi-scope diff for snapshot comparison.
 * Takes two Record<string, unknown> maps (e.g. snapshot.data vs current KV state)
 * and diffs each key independently.
 */
export function diffScoped(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labelFn?: (key: string) => string,
): ScopedDiff[] {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  const sorted = [...allKeys].sort()
  const results: ScopedDiff[] = []

  for (const key of sorted) {
    const bv = key in before ? before[key] : undefined
    const av = key in after ? after[key] : undefined
    const d = diff(bv, av)

    results.push({
      scope: key,
      label: labelFn ? labelFn(key) : key,
      diff: d,
    })
  }

  return results
}

/**
 * Aggregate summary across multiple scoped diffs.
 */
export function aggregateSummary(scoped: ScopedDiff[]): DiffResult['summary'] & { scopesChanged: number } {
  let added = 0, removed = 0, changed = 0, unchanged = 0, total = 0, scopesChanged = 0

  for (const s of scoped) {
    added += s.diff.summary.added
    removed += s.diff.summary.removed
    changed += s.diff.summary.changed
    unchanged += s.diff.summary.unchanged
    total += s.diff.summary.total
    if (s.diff.hasChanges) scopesChanged++
  }

  return { added, removed, changed, unchanged, total, scopesChanged }
}
