/**
 * ops/publish/__tests__/domain-binding.test.ts
 *
 * Tests for domain request model, verification status transitions,
 * and InMemoryDomainBinder.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { isValidDomain, createDomainRequest } from '../domains/DomainRequestModel.js'
import type { DomainRequest } from '../domains/DomainRequestModel.js'
import {
  isValidTransition,
  getAllowedTransitions,
} from '../domains/DomainStatus.js'
import type { DomainVerificationStatus } from '../domains/DomainStatus.js'
import { InMemoryDomainBinder } from '../domains/DomainBinder.js'

// ─── DomainRequestModel ────────────────────────────────────────────

describe('isValidDomain', () => {
  it('accepts valid domains', () => {
    expect(isValidDomain('example.com')).toBe(true)
    expect(isValidDomain('sub.example.com')).toBe(true)
    expect(isValidDomain('my-site.co.uk')).toBe(true)
    expect(isValidDomain('a.bc')).toBe(true)
  })

  it('rejects domains with protocol', () => {
    expect(isValidDomain('http://example.com')).toBe(false)
    expect(isValidDomain('https://example.com')).toBe(false)
  })

  it('rejects IP addresses', () => {
    expect(isValidDomain('192.168.1.1')).toBe(false)
    expect(isValidDomain('10.0.0.1')).toBe(false)
  })

  it('rejects domains with spaces', () => {
    expect(isValidDomain('my site.com')).toBe(false)
  })

  it('rejects single-label domains', () => {
    expect(isValidDomain('localhost')).toBe(false)
  })

  it('rejects empty or whitespace', () => {
    expect(isValidDomain('')).toBe(false)
    expect(isValidDomain('   ')).toBe(false)
  })

  it('rejects overly long domains', () => {
    const longDomain = 'a'.repeat(250) + '.com'
    expect(isValidDomain(longDomain)).toBe(false)
  })

  it('rejects labels longer than 63 chars', () => {
    const longLabel = 'a'.repeat(64) + '.com'
    expect(isValidDomain(longLabel)).toBe(false)
  })
})

describe('createDomainRequest', () => {
  it('creates a valid request', () => {
    const result = createDomainRequest('t1', 's1', 'example.com', 'actor1')
    expect(result).not.toHaveProperty('error')
    const req = result as DomainRequest
    expect(req.tenantId).toBe('t1')
    expect(req.siteId).toBe('s1')
    expect(req.requestedDomain).toBe('example.com')
    expect(req.requestedBy).toBe('actor1')
    expect(req.status).toBe('pending')
    expect(req.requestId).toMatch(/^dom_t1_s1_/)
  })

  it('rejects invalid domain', () => {
    const result = createDomainRequest('t1', 's1', 'not valid', 'actor1')
    expect(result).toHaveProperty('error')
  })

  it('rejects empty tenantId', () => {
    const result = createDomainRequest('', 's1', 'example.com', 'actor1')
    expect(result).toHaveProperty('error')
  })

  it('rejects empty siteId', () => {
    const result = createDomainRequest('t1', '', 'example.com', 'actor1')
    expect(result).toHaveProperty('error')
  })

  it('rejects empty requestedBy', () => {
    const result = createDomainRequest('t1', 's1', 'example.com', '')
    expect(result).toHaveProperty('error')
  })
})

// ─── DomainStatus ──────────────────────────────────────────────────

describe('DomainVerificationStatus transitions', () => {
  it('allows pending → verified', () => {
    expect(isValidTransition('pending', 'verified')).toBe(true)
  })

  it('allows pending → failed', () => {
    expect(isValidTransition('pending', 'failed')).toBe(true)
  })

  it('rejects verified → pending', () => {
    expect(isValidTransition('verified', 'pending')).toBe(false)
  })

  it('rejects verified → failed', () => {
    expect(isValidTransition('verified', 'failed')).toBe(false)
  })

  it('rejects failed → verified', () => {
    expect(isValidTransition('failed', 'verified')).toBe(false)
  })

  it('rejects failed → pending', () => {
    expect(isValidTransition('failed', 'pending')).toBe(false)
  })

  it('rejects identity transition pending → pending', () => {
    expect(isValidTransition('pending', 'pending')).toBe(false)
  })
})

describe('getAllowedTransitions', () => {
  it('returns [verified, failed] for pending', () => {
    const allowed = getAllowedTransitions('pending')
    expect(allowed).toEqual(['verified', 'failed'])
  })

  it('returns empty for verified', () => {
    expect(getAllowedTransitions('verified')).toEqual([])
  })

  it('returns empty for failed', () => {
    expect(getAllowedTransitions('failed')).toEqual([])
  })
})

// ─── InMemoryDomainBinder ──────────────────────────────────────────

describe('InMemoryDomainBinder', () => {
  let binder: InMemoryDomainBinder

  beforeEach(() => {
    binder = new InMemoryDomainBinder()
  })

  it('creates and retrieves a domain request', () => {
    const result = binder.requestDomain('t1', 's1', 'example.com', 'actor1')
    expect(result).not.toHaveProperty('error')
    const req = result as DomainRequest
    expect(binder.getRequest(req.requestId)).toEqual(req)
  })

  it('rejects duplicate pending domain', () => {
    binder.requestDomain('t1', 's1', 'example.com', 'actor1')
    const dup = binder.requestDomain('t2', 's2', 'example.com', 'actor2')
    expect(dup).toHaveProperty('error')
    expect((dup as { error: string }).error).toContain('already requested')
  })

  it('allows re-request after domain fails', () => {
    const first = binder.requestDomain('t1', 's1', 'example.com', 'actor1') as DomainRequest
    binder.updateStatus(first.requestId, 'failed', 'admin', 'DNS mismatch')
    const second = binder.requestDomain('t1', 's1', 'example.com', 'actor1')
    expect(second).not.toHaveProperty('error')
  })

  it('rejects invalid domain in request', () => {
    const result = binder.requestDomain('t1', 's1', 'http://bad.com', 'actor1')
    expect(result).toHaveProperty('error')
  })

  it('updates status from pending to verified', () => {
    const req = binder.requestDomain('t1', 's1', 'example.com', 'actor1') as DomainRequest
    const updated = binder.updateStatus(req.requestId, 'verified', 'admin')
    expect(updated).not.toHaveProperty('error')
    expect((updated as DomainRequest).status).toBe('verified')
    expect((updated as DomainRequest).verifiedAt).toBeTruthy()
  })

  it('updates status from pending to failed with reason', () => {
    const req = binder.requestDomain('t1', 's1', 'example.com', 'actor1') as DomainRequest
    const updated = binder.updateStatus(req.requestId, 'failed', 'admin', 'CNAME not found')
    expect(updated).not.toHaveProperty('error')
    expect((updated as DomainRequest).status).toBe('failed')
    expect((updated as DomainRequest).failureReason).toBe('CNAME not found')
  })

  it('rejects invalid status transition', () => {
    const req = binder.requestDomain('t1', 's1', 'example.com', 'actor1') as DomainRequest
    binder.updateStatus(req.requestId, 'verified', 'admin')
    const bad = binder.updateStatus(req.requestId, 'pending', 'admin')
    expect(bad).toHaveProperty('error')
    expect((bad as { error: string }).error).toContain('Invalid transition')
  })

  it('returns error for unknown requestId', () => {
    const result = binder.updateStatus('nonexistent', 'verified', 'admin')
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('not found')
  })

  it('lists requests for a tenant', () => {
    binder.requestDomain('t1', 's1', 'a.com', 'actor')
    binder.requestDomain('t1', 's2', 'b.com', 'actor')
    binder.requestDomain('t2', 's3', 'c.com', 'actor')
    expect(binder.listRequests('t1')).toHaveLength(2)
    expect(binder.listRequests('t2')).toHaveLength(1)
    expect(binder.listRequests('t99')).toHaveLength(0)
  })

  it('removes a domain request', () => {
    const req = binder.requestDomain('t1', 's1', 'example.com', 'actor1') as DomainRequest
    expect(binder.removeDomain(req.requestId, 'admin')).toBe(true)
    expect(binder.getRequest(req.requestId)).toBeNull()
  })

  it('returns false removing nonexistent request', () => {
    expect(binder.removeDomain('nope', 'admin')).toBe(false)
  })

  it('returns null for unknown getRequest', () => {
    expect(binder.getRequest('unknown')).toBeNull()
  })

  // ─── Audit log ─────────────────────────────────────────────────

  it('appends audit events for all operations', () => {
    const req = binder.requestDomain('t1', 's1', 'example.com', 'actor1') as DomainRequest
    binder.updateStatus(req.requestId, 'verified', 'admin')
    binder.removeDomain(req.requestId, 'admin')

    const log = binder.getAuditLog()
    expect(log).toHaveLength(3)
    expect(log[0].action).toBe('domain_requested')
    expect(log[1].action).toBe('domain_verified')
    expect(log[2].action).toBe('domain_removed')
  })

  it('audit log is append-only (returned copy)', () => {
    binder.requestDomain('t1', 's1', 'example.com', 'actor1')
    const log1 = binder.getAuditLog()
    expect(log1).toHaveLength(1)

    // Mutating the returned array should not affect internal log
    ;(log1 as DomainRequest[]).length = 0
    expect(binder.getAuditLog()).toHaveLength(1)
  })

  it('audit entries have sequential IDs', () => {
    binder.requestDomain('t1', 's1', 'a.com', 'actor')
    binder.requestDomain('t1', 's2', 'b.com', 'actor')
    const log = binder.getAuditLog()
    expect(log[0].entryId).toBe('dom_aud_1')
    expect(log[1].entryId).toBe('dom_aud_2')
  })

  it('auditLogSize reflects count', () => {
    expect(binder.auditLogSize).toBe(0)
    binder.requestDomain('t1', 's1', 'example.com', 'actor1')
    expect(binder.auditLogSize).toBe(1)
  })

  it('failed status records failedAt and reason in audit', () => {
    const req = binder.requestDomain('t1', 's1', 'example.com', 'a') as DomainRequest
    binder.updateStatus(req.requestId, 'failed', 'admin', 'timeout')
    const log = binder.getAuditLog()
    expect(log[1].action).toBe('domain_failed')
    expect(log[1].details).toBe('timeout')
  })
})
