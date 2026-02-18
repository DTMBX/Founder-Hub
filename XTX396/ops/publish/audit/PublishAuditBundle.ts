/**
 * ops/publish/audit/PublishAuditBundle.ts
 *
 * Aggregates all publish-related audit events into a single,
 * deterministic, exportable bundle.
 *
 * Sources:
 * - TargetRegistry audit log (publish events)
 * - DomainBinder audit log (domain events)
 * - CircuitBreaker events (safety events)
 *
 * Bundle is append-only and immutable once exported.
 */

import type { PublishAuditEvent } from '../models/PublishResult.js'
import type { DomainAuditEvent } from '../domains/DomainRequestModel.js'
import type { CircuitEvent } from '../safety/CircuitBreaker.js'

/** Union of all audit event types. */
export type AuditEntry =
  | { readonly source: 'publish'; readonly event: PublishAuditEvent }
  | { readonly source: 'domain'; readonly event: DomainAuditEvent }
  | { readonly source: 'circuit'; readonly event: CircuitEvent }

/** Exported audit bundle. */
export interface AuditBundle {
  readonly bundleId: string
  readonly generatedAt: string
  readonly tenantId: string
  readonly entries: readonly AuditEntry[]
  readonly entryCount: number
  readonly integrityHash: string
}

/** Hash function signature (deterministic, async-safe). */
export type AuditHashFn = (data: string) => string

/**
 * Simple deterministic hash (DJB2) for audit bundle integrity.
 * Not cryptographic — used as a structural fingerprint.
 */
export function djb2Hash(data: string): string {
  let hash = 5381
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash + data.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/**
 * Build an audit bundle from multiple sources.
 *
 * All entries are sorted by timestamp for deterministic output.
 * Filtering by tenantId is applied to publish and domain events.
 * Circuit events have no tenantId — they are always included.
 */
export function buildAuditBundle(
  tenantId: string,
  publishEvents: readonly PublishAuditEvent[],
  domainEvents: readonly DomainAuditEvent[],
  circuitEvents: readonly CircuitEvent[],
  hashFn: AuditHashFn = djb2Hash,
): AuditBundle {
  const entries: AuditEntry[] = []

  for (const event of publishEvents) {
    if (event.tenantId === tenantId) {
      entries.push({ source: 'publish', event })
    }
  }

  for (const event of domainEvents) {
    if (event.tenantId === tenantId) {
      entries.push({ source: 'domain', event })
    }
  }

  for (const event of circuitEvents) {
    entries.push({ source: 'circuit', event })
  }

  // Sort by timestamp for deterministic ordering
  entries.sort((a, b) => {
    const tsA = 'timestamp' in a.event ? a.event.timestamp : ''
    const tsB = 'timestamp' in b.event ? b.event.timestamp : ''
    return tsA.localeCompare(tsB)
  })

  const serialized = JSON.stringify(entries)
  const integrityHash = hashFn(serialized)
  const now = new Date().toISOString()

  return {
    bundleId: `aud_bundle_${tenantId}_${now.replace(/[-:T.Z]/g, '').slice(0, 14)}`,
    generatedAt: now,
    tenantId,
    entries: Object.freeze([...entries]) as readonly AuditEntry[],
    entryCount: entries.length,
    integrityHash,
  }
}

/**
 * Verify an audit bundle's integrity hash.
 */
export function verifyBundleIntegrity(
  bundle: AuditBundle,
  hashFn: AuditHashFn = djb2Hash,
): boolean {
  const serialized = JSON.stringify(bundle.entries)
  return hashFn(serialized) === bundle.integrityHash
}

/**
 * Filter bundle entries by source type.
 */
export function filterBySource(
  bundle: AuditBundle,
  source: AuditEntry['source'],
): readonly AuditEntry[] {
  return bundle.entries.filter(e => e.source === source)
}

/**
 * Filter bundle entries by time range.
 */
export function filterByTimeRange(
  bundle: AuditBundle,
  startTime: string,
  endTime: string,
): readonly AuditEntry[] {
  return bundle.entries.filter(e => {
    const ts = 'timestamp' in e.event ? e.event.timestamp : ''
    return ts >= startTime && ts <= endTime
  })
}
