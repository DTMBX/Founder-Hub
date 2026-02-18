/**
 * ops/publish/domains/DomainBinder.ts
 *
 * Domain binder interface + in-memory implementation.
 * No automated DNS changes — stores requests and tracks verification state.
 * Future adapters can implement actual DNS verification.
 */

import type { DomainRequest, DomainAuditEvent, DomainAuditAction } from './DomainRequestModel.js'
import { createDomainRequest } from './DomainRequestModel.js'
import type { DomainVerificationStatus } from './DomainStatus.js'
import { isValidTransition } from './DomainStatus.js'

/**
 * Interface for domain binding adapters.
 * Default implementation is in-memory (no DNS automation).
 */
export interface DomainBinderAdapter {
  requestDomain(tenantId: string, siteId: string, domain: string, requestedBy: string): DomainRequest | { error: string }
  updateStatus(requestId: string, status: DomainVerificationStatus, actor: string, reason?: string): DomainRequest | { error: string }
  getRequest(requestId: string): DomainRequest | null
  listRequests(tenantId: string): readonly DomainRequest[]
  removeDomain(requestId: string, actor: string): boolean
  getAuditLog(): readonly DomainAuditEvent[]
  readonly auditLogSize: number
}

export class InMemoryDomainBinder implements DomainBinderAdapter {
  private readonly _requests: Map<string, DomainRequest> = new Map()
  private readonly _auditLog: DomainAuditEvent[] = []
  private _auditCounter = 0

  requestDomain(tenantId: string, siteId: string, domain: string, requestedBy: string): DomainRequest | { error: string } {
    const request = createDomainRequest(tenantId, siteId, domain, requestedBy)
    if ('error' in request) return request

    // Check for duplicate domain
    for (const existing of this._requests.values()) {
      if (existing.requestedDomain === request.requestedDomain && existing.status !== 'failed') {
        return { error: `Domain '${domain}' already requested` }
      }
    }

    this._requests.set(request.requestId, request)
    this._appendAudit(request.requestId, tenantId, siteId, domain, 'domain_requested', requestedBy)
    return request
  }

  updateStatus(requestId: string, status: DomainVerificationStatus, actor: string, reason?: string): DomainRequest | { error: string } {
    const request = this._requests.get(requestId)
    if (!request) return { error: `Request not found: ${requestId}` }

    if (!isValidTransition(request.status, status)) {
      return { error: `Invalid transition: ${request.status} → ${status}` }
    }

    const updated: DomainRequest = {
      ...request,
      status,
      verifiedAt: status === 'verified' ? new Date().toISOString() : request.verifiedAt,
      failedAt: status === 'failed' ? new Date().toISOString() : request.failedAt,
      failureReason: status === 'failed' ? reason : request.failureReason,
    }

    this._requests.set(requestId, updated)

    const action: DomainAuditAction = status === 'verified' ? 'domain_verified' : 'domain_failed'
    this._appendAudit(requestId, request.tenantId, request.siteId, request.requestedDomain, action, actor, reason)

    return updated
  }

  getRequest(requestId: string): DomainRequest | null {
    return this._requests.get(requestId) ?? null
  }

  listRequests(tenantId: string): readonly DomainRequest[] {
    return [...this._requests.values()].filter(r => r.tenantId === tenantId)
  }

  removeDomain(requestId: string, actor: string): boolean {
    const request = this._requests.get(requestId)
    if (!request) return false
    this._requests.delete(requestId)
    this._appendAudit(requestId, request.tenantId, request.siteId, request.requestedDomain, 'domain_removed', actor)
    return true
  }

  getAuditLog(): readonly DomainAuditEvent[] {
    return [...this._auditLog]
  }

  get auditLogSize(): number {
    return this._auditLog.length
  }

  private _appendAudit(
    requestId: string, tenantId: string, siteId: string,
    domain: string, action: DomainAuditAction, actor: string,
    details?: string,
  ): void {
    this._auditCounter += 1
    this._auditLog.push({
      entryId: `dom_aud_${this._auditCounter}`,
      requestId,
      tenantId,
      siteId,
      domain,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details,
    })
  }
}
