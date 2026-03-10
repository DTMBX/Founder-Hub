/**
 * snapshot-guardrails.ts — Automatic pre-action snapshots for risky operations.
 *
 * Creates labeled safety snapshots before:
 *  - AI proposal acceptance
 *  - Bulk transforms
 *  - Snapshot restores
 *
 * Stores snapshots as timestamped entries in sessionStorage so they
 * survive within the session but don't persist stale state across reloads.
 *
 * Pure side-effect module — no React dependencies.
 */

import { exportSnapshot, type Snapshot } from '@/lib/snapshot-system'
import { enforceCurrentRole } from '@/lib/studio-permissions'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SafetySnapshot {
  id: string
  label: string
  reason: SafetySnapshotReason
  createdAt: string
  snapshot: Snapshot
}

export type SafetySnapshotReason =
  | 'ai-accept'
  | 'bulk-transform'
  | 'snapshot-restore'
  | 'manual'

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'site-studio-safety-snapshots'
const MAX_SNAPSHOTS = 10

// Active site scope (default = unsuffixed for backwards compat)
let activeSiteId: string | null = null

function storageKey(): string {
  return activeSiteId ? `${STORAGE_KEY_PREFIX}:${activeSiteId}` : STORAGE_KEY_PREFIX
}

// ─── Storage helpers ────────────────────────────────────────────────────────

function loadSnapshots(): SafetySnapshot[] {
  try {
    const raw = sessionStorage.getItem(storageKey())
    return raw ? (JSON.parse(raw) as SafetySnapshot[]) : []
  } catch {
    return []
  }
}

function saveSnapshots(snapshots: SafetySnapshot[]): void {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(snapshots))
  } catch { /* quota exceeded — degrade gracefully */ }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Take a safety snapshot before a risky operation.
 * Returns the snapshot ID for reference in logs.
 */
export async function takeSafetySnapshot(
  reason: SafetySnapshotReason,
  label: string,
): Promise<string> {
  const snapshot = await exportSnapshot()
  const entry: SafetySnapshot = {
    id: crypto.randomUUID(),
    label,
    reason,
    createdAt: new Date().toISOString(),
    snapshot,
  }

  const existing = loadSnapshots()
  existing.push(entry)

  // Enforce max — drop oldest
  const trimmed = existing.length > MAX_SNAPSHOTS
    ? existing.slice(existing.length - MAX_SNAPSHOTS)
    : existing

  saveSnapshots(trimmed)
  return entry.id
}

/** Get all safety snapshots for this session. */
export function getSafetySnapshots(): SafetySnapshot[] {
  return loadSnapshots()
}

/** Get a specific safety snapshot by ID. */
export function getSafetySnapshot(id: string): SafetySnapshot | undefined {
  return loadSnapshots().find(s => s.id === id)
}

/** Clear all safety snapshots. */
export function clearSafetySnapshots(): void {
  enforceCurrentRole('studio:manage-snapshots')
  sessionStorage.removeItem(storageKey())
}

/**
 * Scope safety snapshots to a specific workspace site.
 * Subsequent reads/writes use the site-scoped sessionStorage key.
 */
export function setSafetySnapshotSiteScope(siteId: string): void {
  activeSiteId = siteId
}

/** Get the most recent safety snapshot (.e.g for quick restore). */
export function getLatestSafetySnapshot(): SafetySnapshot | undefined {
  const all = loadSnapshots()
  return all.length > 0 ? all[all.length - 1] : undefined
}
