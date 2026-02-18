/**
 * ops/publish/models/PublishRequest.ts
 *
 * Immutable request model for all publish operations.
 * Contains no secrets — artifact_ref points to a stored site bundle.
 */

import type { PublishTargetKind } from '../targets/PublishTarget.js'

/** Tenant mode: demo is restricted; owner has full access. */
export type TenantMode = 'demo' | 'owner'

/** Tenant type for policy checks. */
export type TenantType = 'public-demo' | 'trial' | 'standard' | 'enterprise'

/**
 * Core publish request.
 * Every field is required except `requestedDomain` and `metadata`.
 */
export interface PublishRequest {
  readonly tenantId: string
  readonly tenantType: TenantType
  readonly actorId: string
  readonly actorRole: string
  readonly siteId: string
  readonly blueprintId: string
  readonly artifactRef: string
  readonly publishTarget: PublishTargetKind
  readonly mode: TenantMode
  readonly safeModeOn: boolean
  readonly correlationId: string
  readonly requestedAt: string
  readonly requestedDomain?: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Create a validated PublishRequest. Fails closed on missing required fields.
 */
export function createPublishRequest(
  input: Partial<PublishRequest> & { tenantId: string; actorId: string; siteId: string }
): PublishRequest | { error: string } {
  const missing: string[] = []
  if (!input.tenantId) missing.push('tenantId')
  if (!input.actorId) missing.push('actorId')
  if (!input.siteId) missing.push('siteId')
  if (!input.blueprintId) missing.push('blueprintId')
  if (!input.artifactRef) missing.push('artifactRef')
  if (!input.publishTarget) missing.push('publishTarget')
  if (!input.correlationId) missing.push('correlationId')

  if (missing.length > 0) {
    return { error: `Missing required fields: ${missing.join(', ')}` }
  }

  const validTargets: PublishTargetKind[] = ['hosted', 'zip', 'github_pr']
  if (!validTargets.includes(input.publishTarget!)) {
    return { error: `Invalid publish target: ${input.publishTarget}` }
  }

  const validModes: TenantMode[] = ['demo', 'owner']
  const mode = input.mode ?? 'demo'
  if (!validModes.includes(mode)) {
    return { error: `Invalid mode: ${input.mode}` }
  }

  return {
    tenantId: input.tenantId,
    tenantType: input.tenantType ?? 'standard',
    actorId: input.actorId,
    actorRole: input.actorRole ?? 'operator',
    siteId: input.siteId,
    blueprintId: input.blueprintId!,
    artifactRef: input.artifactRef!,
    publishTarget: input.publishTarget!,
    mode,
    safeModeOn: input.safeModeOn ?? true,
    correlationId: input.correlationId!,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
    requestedDomain: input.requestedDomain,
    metadata: input.metadata,
  }
}
