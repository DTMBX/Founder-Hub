/**
 * ops/publish/ui/PublishPanelModels.ts
 *
 * Models for the operator-facing publish panel.
 * Determines which buttons are available per role, tenant, mode.
 * Provides publish history records.
 */

import type { PublishTargetKind } from '../targets/PublishTarget.js'
import type { PublishAuditEvent } from '../models/PublishResult.js'

// ── Button State ─────────────────────────────────────────────────

export type ButtonState = 'ready' | 'disabled' | 'not_configured' | 'blocked'

export interface PublishButtonConfig {
  readonly target: PublishTargetKind
  readonly label: string
  readonly state: ButtonState
  readonly reason?: string
  readonly primary: boolean
}

export interface PublishPanelState {
  readonly buttons: readonly PublishButtonConfig[]
  readonly safeModeOn: boolean
  readonly tenantType: string
  readonly actorRole: string
}

/** Capability checker type. */
export type CapCheck = (role: string, capability: string) => boolean

/** GitHub config status. */
export interface GitHubConfigStatus {
  readonly configured: boolean
  readonly allowedRepoCount: number
}

/**
 * Resolve publish panel button states for an operator.
 * Fail-closed: unknown states default to disabled.
 */
export function resolvePublishPanel(
  actorRole: string,
  tenantType: string,
  safeModeOn: boolean,
  checkCapability: CapCheck,
  githubStatus: GitHubConfigStatus,
): PublishPanelState {
  const buttons: PublishButtonConfig[] = []

  // Hosted — default, always shown
  const canPublish = checkCapability(actorRole, 'publish_site')
  buttons.push({
    target: 'hosted',
    label: 'Publish Hosted',
    state: canPublish ? 'ready' : 'blocked',
    reason: canPublish ? undefined : 'Missing publish_site capability',
    primary: true,
  })

  // ZIP — always available if capable
  buttons.push({
    target: 'zip',
    label: 'Download ZIP',
    state: canPublish ? 'ready' : 'blocked',
    reason: canPublish ? undefined : 'Missing publish_site capability',
    primary: false,
  })

  // GitHub PR — conditional
  const canManage = checkCapability(actorRole, 'manage_deployments')
  const ghBlocked = safeModeOn
    || tenantType === 'public-demo'
    || tenantType === 'trial'
    || tenantType === 'suspended'

  let ghState: ButtonState
  let ghReason: string | undefined

  if (ghBlocked) {
    ghState = 'blocked'
    ghReason = safeModeOn
      ? 'Blocked in Safe Mode'
      : `Blocked for ${tenantType} tenants`
  } else if (!canManage) {
    ghState = 'blocked'
    ghReason = 'Requires manage_deployments capability'
  } else if (!githubStatus.configured || githubStatus.allowedRepoCount === 0) {
    ghState = 'not_configured'
    ghReason = 'GitHub App not configured'
  } else {
    ghState = 'ready'
  }

  buttons.push({
    target: 'github_pr',
    label: 'Publish to GitHub',
    state: ghState,
    reason: ghReason,
    primary: false,
  })

  return { buttons, safeModeOn, tenantType, actorRole }
}

// ── Publish History ──────────────────────────────────────────────

export interface PublishHistoryEntry {
  readonly target: PublishTargetKind
  readonly actor: string
  readonly timestamp: string
  readonly result: 'succeeded' | 'failed' | 'blocked'
  readonly correlationId: string
  readonly link?: string  // hosted URL, zip download, or PR URL
  readonly version?: string
  readonly manifestHash?: string
}

/**
 * Build publish history from audit events.
 * Groups by correlationId, extracts terminal state.
 */
export function buildPublishHistory(
  auditEvents: readonly PublishAuditEvent[],
  linkResolver?: (event: PublishAuditEvent) => string | undefined,
): readonly PublishHistoryEntry[] {
  // Group by correlationId
  const groups = new Map<string, PublishAuditEvent[]>()
  for (const event of auditEvents) {
    const existing = groups.get(event.correlationId) ?? []
    existing.push(event)
    groups.set(event.correlationId, existing)
  }

  const history: PublishHistoryEntry[] = []

  for (const [correlationId, events] of groups) {
    // Find terminal event
    const succeeded = events.find(e => e.action === 'publish_succeeded')
    const failed = events.find(e => e.action === 'publish_failed')
    const blocked = events.find(e => e.action === 'publish_blocked')
    const terminal = succeeded ?? failed ?? blocked ?? events[events.length - 1]

    let result: 'succeeded' | 'failed' | 'blocked'
    if (succeeded) result = 'succeeded'
    else if (failed) result = 'failed'
    else result = 'blocked'

    history.push({
      target: terminal.target,
      actor: terminal.actorId,
      timestamp: terminal.timestamp,
      result,
      correlationId,
      link: linkResolver?.(terminal),
    })
  }

  return history.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
