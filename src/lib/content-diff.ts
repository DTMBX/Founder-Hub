/**
 * content-diff.ts — Deterministic structural diff for content values.
 *
 * Compares two JSON-serializable values and produces a flat list of
 * field-level changes. Designed for:
 *  - history entry before/after comparison
 *  - AI proposal review (current vs suggested)
 *  - snapshot restore preview
 *
 * Pure functions — no I/O, no mutation, deterministic output.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ChangeKind = 'added' | 'removed' | 'changed' | 'unchanged'

export interface FieldChange {
  /** Dot-path to the changed field (e.g. 'mission', 'projects[2].title') */
  path: string
  /** Human-readable label derived from the path */
  label: string
  kind: ChangeKind
  before: unknown
  after: unknown
}

export interface DiffResult {
  /** Whether any actual changes exist */
  hasChanges: boolean
  /** Total number of additions + removals + modifications */
  changeCount: number
  /** Flat, deterministically-ordered list of field-level changes */
  changes: FieldChange[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function pathLabel(path: string): string {
  // 'projects[2].title' → 'projects › [2] › title'
  return path
    .replace(/\./g, ' › ')
    .replace(/\[(\d+)\]/g, ' › [$1]')
    .replace(/^ › /, '')
}

function isPrimitive(v: unknown): boolean {
  return v === null || v === undefined || typeof v !== 'object'
}

function sortedKeys(a: Record<string, unknown>, b: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return Array.from(keys).sort()
}

// ─── Core Diff ──────────────────────────────────────────────────────────────

function diffRecursive(
  before: unknown,
  after: unknown,
  path: string,
  changes: FieldChange[],
): void {
  // Both primitive or null
  if (isPrimitive(before) && isPrimitive(after)) {
    if (before !== after) {
      changes.push({ path, label: pathLabel(path), kind: 'changed', before, after })
    }
    return
  }

  // One is primitive, other is not
  if (isPrimitive(before) || isPrimitive(after)) {
    changes.push({ path, label: pathLabel(path), kind: 'changed', before, after })
    return
  }

  // Both arrays
  if (Array.isArray(before) && Array.isArray(after)) {
    const maxLen = Math.max(before.length, after.length)
    for (let i = 0; i < maxLen; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`
      if (i >= before.length) {
        changes.push({ path: itemPath, label: pathLabel(itemPath), kind: 'added', before: undefined, after: after[i] })
      } else if (i >= after.length) {
        changes.push({ path: itemPath, label: pathLabel(itemPath), kind: 'removed', before: before[i], after: undefined })
      } else {
        diffRecursive(before[i], after[i], itemPath, changes)
      }
    }
    return
  }

  // Both objects
  if (typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    const a = before as Record<string, unknown>
    const b = after as Record<string, unknown>
    for (const key of sortedKeys(a, b)) {
      const fieldPath = path ? `${path}.${key}` : key
      if (!(key in a)) {
        changes.push({ path: fieldPath, label: pathLabel(fieldPath), kind: 'added', before: undefined, after: b[key] })
      } else if (!(key in b)) {
        changes.push({ path: fieldPath, label: pathLabel(fieldPath), kind: 'removed', before: a[key], after: undefined })
      } else {
        diffRecursive(a[key], b[key], fieldPath, changes)
      }
    }
    return
  }

  // Mismatched types (e.g. array vs object)
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    changes.push({ path, label: pathLabel(path), kind: 'changed', before, after })
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute a deterministic structural diff between two values.
 * Returns a flat, ordered list of field-level changes.
 */
export function computeDiff(before: unknown, after: unknown): DiffResult {
  const changes: FieldChange[] = []
  diffRecursive(before, after, '', changes)

  const changeCount = changes.filter(c => c.kind !== 'unchanged').length
  return {
    hasChanges: changeCount > 0,
    changeCount,
    changes,
  }
}

/**
 * Format a value for display in diff UI.
 * Arrays → comma-separated, objects → JSON, primitives → string.
 */
export function formatDiffValue(value: unknown): string {
  if (value === undefined || value === null) return '(empty)'
  if (typeof value === 'string') return value || '(empty string)'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty list)'
    // If array of primitives, join
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return value.join(', ')
    }
    return `[${value.length} items]`
  }
  // Object — truncated JSON
  const json = JSON.stringify(value)
  return json.length > 120 ? json.slice(0, 117) + '...' : json
}
