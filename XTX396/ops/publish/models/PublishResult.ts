/**
 * ops/publish/models/PublishResult.ts
 *
 * Immutable result model for all publish operations.
 * Contains no secrets. Timestamps are ISO 8601.
 */

import type { PublishTargetKind } from '../targets/PublishTarget.js'

/** Audit event types emitted during publish lifecycle. */
export type PublishAuditAction =
  | 'publish_requested'
  | 'publish_started'
  | 'publish_succeeded'
  | 'publish_failed'
  | 'publish_blocked'

/**
 * A single audit event from a publish operation.
 * Append-only — once created, never mutated or deleted.
 */
export interface PublishAuditEvent {
  readonly entryId: string
  readonly correlationId: string
  readonly tenantId: string
  readonly actorId: string
  readonly siteId: string
  readonly target: PublishTargetKind
  readonly action: PublishAuditAction
  readonly timestamp: string
  readonly details?: string
}

/**
 * Publish result returned from every target.
 * `url` is populated for hosted; `downloadRef` for zip; `prUrl` for github_pr.
 */
export interface PublishResult {
  readonly success: boolean
  readonly target: PublishTargetKind
  readonly siteId: string
  readonly correlationId: string
  readonly manifestHash: string
  readonly publishedAt: string
  readonly version: string
  readonly url?: string
  readonly downloadRef?: string
  readonly prUrl?: string
  readonly error?: string
  readonly auditEvents: readonly PublishAuditEvent[]
}

/**
 * Create a standard audit event. Deterministic given inputs.
 */
export function createAuditEvent(
  counter: number,
  correlationId: string,
  tenantId: string,
  actorId: string,
  siteId: string,
  target: PublishTargetKind,
  action: PublishAuditAction,
  details?: string,
): PublishAuditEvent {
  return {
    entryId: `pub_aud_${counter}`,
    correlationId,
    tenantId,
    actorId,
    siteId,
    target,
    action,
    timestamp: new Date().toISOString(),
    details,
  }
}
