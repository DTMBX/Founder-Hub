/**
 * ops/publish/targets/TargetRegistry.ts
 *
 * Central registry for publish targets.
 * Enforces: Safe Mode, tenant type blocking, RBAC capabilities.
 * Fail-closed: unknown target → blocked.
 */

import type { PublishTarget, PublishTargetKind, CanPublishResult } from './PublishTarget.js'
import type { PublishRequest } from '../models/PublishRequest.js'
import type { PublishResult, PublishAuditEvent, PublishAuditAction } from '../models/PublishResult.js'
import { createAuditEvent } from '../models/PublishResult.js'

/**
 * Capability checker function signature.
 * Must return true only if the role possesses the capability.
 */
export type CapabilityChecker = (role: string, capability: string) => boolean

export class TargetRegistry {
  private readonly _targets: Map<PublishTargetKind, PublishTarget> = new Map()
  private readonly _auditLog: PublishAuditEvent[] = []
  private _auditCounter = 0
  private readonly _checkCapability: CapabilityChecker

  constructor(checkCapability: CapabilityChecker) {
    this._checkCapability = checkCapability
  }

  /** Register a publish target. Overwrites if same kind already registered. */
  register(target: PublishTarget): void {
    this._targets.set(target.registration.kind, target)
  }

  /** Unregister a publish target by kind. */
  unregister(kind: PublishTargetKind): boolean {
    return this._targets.delete(kind)
  }

  /** Get a registered target by kind. */
  getTarget(kind: PublishTargetKind): PublishTarget | undefined {
    return this._targets.get(kind)
  }

  /** List all registered target kinds. */
  listTargets(): readonly PublishTargetKind[] {
    return [...this._targets.keys()]
  }

  /** List targets available for a given request context. */
  listAvailableTargets(request: PublishRequest): readonly PublishTargetKind[] {
    const available: PublishTargetKind[] = []
    for (const [kind, target] of this._targets) {
      const check = this._preflightCheck(target, request)
      if (check.allowed) {
        available.push(kind)
      }
    }
    return available
  }

  /**
   * Full pre-flight validation:
   * 1. Target registered and enabled
   * 2. Safe Mode check
   * 3. Tenant type not blocked
   * 4. RBAC capabilities
   * 5. Target-specific canPublish()
   */
  private _preflightCheck(target: PublishTarget, request: PublishRequest): CanPublishResult {
    const reg = target.registration

    if (!reg.enabled) {
      return { allowed: false, reason: `Target '${reg.kind}' is disabled` }
    }

    if (request.safeModeOn && !reg.safeModeAllowed) {
      return { allowed: false, reason: `Target '${reg.kind}' is blocked in Safe Mode` }
    }

    if (reg.blockedTenantTypes.includes(request.tenantType)) {
      return { allowed: false, reason: `Tenant type '${request.tenantType}' is blocked for target '${reg.kind}'` }
    }

    for (const cap of reg.requiredCapabilities) {
      if (!this._checkCapability(request.actorRole, cap)) {
        return { allowed: false, reason: `Missing capability '${cap}' for target '${reg.kind}'` }
      }
    }

    return target.canPublish(request)
  }

  /**
   * Execute a publish request.
   * Fail-closed: unknown target, disabled, blocked → returns failed result with audit.
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    const target = this._targets.get(request.publishTarget)

    // Emit publish_requested
    this._appendAudit(
      request.correlationId, request.tenantId, request.actorId,
      request.siteId, request.publishTarget, 'publish_requested',
    )

    if (!target) {
      this._appendAudit(
        request.correlationId, request.tenantId, request.actorId,
        request.siteId, request.publishTarget, 'publish_blocked',
        `Unknown target: ${request.publishTarget}`,
      )
      return this._blockedResult(request, `Unknown publish target: ${request.publishTarget}`)
    }

    const preflight = this._preflightCheck(target, request)
    if (!preflight.allowed) {
      this._appendAudit(
        request.correlationId, request.tenantId, request.actorId,
        request.siteId, request.publishTarget, 'publish_blocked',
        preflight.reason,
      )
      return this._blockedResult(request, preflight.reason ?? 'Blocked by policy')
    }

    // Emit publish_started
    this._appendAudit(
      request.correlationId, request.tenantId, request.actorId,
      request.siteId, request.publishTarget, 'publish_started',
    )

    try {
      const result = await target.publish(request)

      const action: PublishAuditAction = result.success ? 'publish_succeeded' : 'publish_failed'
      this._appendAudit(
        request.correlationId, request.tenantId, request.actorId,
        request.siteId, request.publishTarget, action,
        result.error,
      )

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      this._appendAudit(
        request.correlationId, request.tenantId, request.actorId,
        request.siteId, request.publishTarget, 'publish_failed',
        message,
      )
      return this._blockedResult(request, message)
    }
  }

  /** Append-only audit log. */
  private _appendAudit(
    correlationId: string,
    tenantId: string,
    actorId: string,
    siteId: string,
    target: PublishTargetKind,
    action: PublishAuditAction,
    details?: string,
  ): void {
    this._auditCounter += 1
    this._auditLog.push(
      createAuditEvent(this._auditCounter, correlationId, tenantId, actorId, siteId, target, action, details),
    )
  }

  /** Read-only copy of audit log. */
  getAuditLog(): readonly PublishAuditEvent[] {
    return [...this._auditLog]
  }

  get auditLogSize(): number {
    return this._auditLog.length
  }

  /** Filter audit log by correlationId. */
  getAuditForCorrelation(correlationId: string): readonly PublishAuditEvent[] {
    return this._auditLog.filter(e => e.correlationId === correlationId)
  }

  private _blockedResult(request: PublishRequest, error: string): PublishResult {
    return {
      success: false,
      target: request.publishTarget,
      siteId: request.siteId,
      correlationId: request.correlationId,
      manifestHash: '',
      publishedAt: new Date().toISOString(),
      version: '',
      error,
      auditEvents: this.getAuditForCorrelation(request.correlationId),
    }
  }
}
