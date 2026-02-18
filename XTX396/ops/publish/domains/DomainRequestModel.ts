/**
 * ops/publish/domains/DomainRequestModel.ts
 *
 * Domain binding request model.
 * Allows admin to attach a requested_domain to a site.
 * No automated DNS changes — interface only.
 */

import type { DomainVerificationStatus } from './DomainStatus.js'

/** Domain request — a request to bind a custom domain to a site. */
export interface DomainRequest {
  readonly requestId: string
  readonly tenantId: string
  readonly siteId: string
  readonly requestedDomain: string
  readonly requestedBy: string
  readonly requestedAt: string
  readonly status: DomainVerificationStatus
  readonly verifiedAt?: string
  readonly failedAt?: string
  readonly failureReason?: string
}

/** Domain audit event. */
export interface DomainAuditEvent {
  readonly entryId: string
  readonly requestId: string
  readonly tenantId: string
  readonly siteId: string
  readonly domain: string
  readonly action: DomainAuditAction
  readonly actor: string
  readonly timestamp: string
  readonly details?: string
}

export type DomainAuditAction =
  | 'domain_requested'
  | 'domain_verified'
  | 'domain_failed'
  | 'domain_removed'

/**
 * Validate a domain name format.
 * Accepts: example.com, sub.example.com
 * Rejects: empty, spaces, protocols, IPs, paths.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.trim().length === 0 || domain.length > 253) return false
  // Must contain at least one dot, no spaces, no protocol
  if (domain.includes(' ') || domain.includes('://')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  const parts = domain.split('.')
  if (parts.length < 2) return false
  // Reject IP addresses (all-numeric labels)
  if (parts.every(p => /^\d+$/.test(p))) return false
  return parts.every(part =>
    part.length > 0 &&
    part.length <= 63 &&
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(part),
  )
}

/**
 * Create a domain request. Validates domain format.
 */
export function createDomainRequest(
  tenantId: string,
  siteId: string,
  domain: string,
  requestedBy: string,
): DomainRequest | { error: string } {
  if (!tenantId) return { error: 'tenantId is required' }
  if (!siteId) return { error: 'siteId is required' }
  if (!requestedBy) return { error: 'requestedBy is required' }
  if (!isValidDomain(domain)) return { error: `Invalid domain: ${domain}` }

  const ts = new Date().toISOString()
  return {
    requestId: `dom_${tenantId}_${siteId}_${ts.replace(/[-:T.Z]/g, '').slice(0, 14)}`,
    tenantId,
    siteId,
    requestedDomain: domain.toLowerCase(),
    requestedBy,
    requestedAt: ts,
    status: 'pending',
  }
}
