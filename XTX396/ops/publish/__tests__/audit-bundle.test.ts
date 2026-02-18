/**
 * ops/publish/__tests__/audit-bundle.test.ts
 *
 * Tests for PublishAuditBundle — aggregation, integrity, filtering.
 */

import { describe, it, expect } from 'vitest'
import {
  buildAuditBundle,
  verifyBundleIntegrity,
  filterBySource,
  filterByTimeRange,
  djb2Hash,
} from '../audit/PublishAuditBundle.js'
import type { PublishAuditEvent } from '../models/PublishResult.js'
import type { DomainAuditEvent } from '../domains/DomainRequestModel.js'
import type { CircuitEvent } from '../safety/CircuitBreaker.js'

// ─── Fixtures ──────────────────────────────────────────────────────

function makePublishEvent(
  tenantId: string,
  timestamp: string,
  action: PublishAuditEvent['action'] = 'publish_succeeded',
): PublishAuditEvent {
  return {
    entryId: `pub_aud_${timestamp}`,
    correlationId: `cor_${timestamp}`,
    tenantId,
    actorId: 'actor1',
    siteId: 'site1',
    target: 'hosted',
    action,
    timestamp,
  }
}

function makeDomainEvent(
  tenantId: string,
  timestamp: string,
  action: DomainAuditEvent['action'] = 'domain_requested',
): DomainAuditEvent {
  return {
    entryId: `dom_aud_${timestamp}`,
    requestId: `req_${timestamp}`,
    tenantId,
    siteId: 'site1',
    domain: 'example.com',
    action,
    actor: 'actor1',
    timestamp,
  }
}

function makeCircuitEvent(timestamp: string): CircuitEvent {
  return {
    timestamp,
    from: 'closed',
    to: 'open',
    reason: 'Failure threshold reached',
  }
}

// ─── djb2Hash ──────────────────────────────────────────────────────

describe('djb2Hash', () => {
  it('produces consistent output for same input', () => {
    const a = djb2Hash('hello world')
    const b = djb2Hash('hello world')
    expect(a).toBe(b)
  })

  it('produces different output for different input', () => {
    expect(djb2Hash('a')).not.toBe(djb2Hash('b'))
  })

  it('returns 8-character hex string', () => {
    const h = djb2Hash('test data')
    expect(h).toMatch(/^[0-9a-f]{8}$/)
  })

  it('handles empty string', () => {
    const h = djb2Hash('')
    expect(h).toMatch(/^[0-9a-f]{8}$/)
  })
})

// ─── buildAuditBundle ──────────────────────────────────────────────

describe('buildAuditBundle', () => {
  it('aggregates events from all sources', () => {
    const pub = [makePublishEvent('t1', '2025-01-01T00:00:00Z')]
    const dom = [makeDomainEvent('t1', '2025-01-01T00:01:00Z')]
    const cir = [makeCircuitEvent('2025-01-01T00:02:00Z')]

    const bundle = buildAuditBundle('t1', pub, dom, cir)
    expect(bundle.entryCount).toBe(3)
    expect(bundle.entries[0].source).toBe('publish')
    expect(bundle.entries[1].source).toBe('domain')
    expect(bundle.entries[2].source).toBe('circuit')
  })

  it('filters publish events by tenantId', () => {
    const pub = [
      makePublishEvent('t1', '2025-01-01T00:00:00Z'),
      makePublishEvent('t2', '2025-01-01T00:01:00Z'),
    ]
    const bundle = buildAuditBundle('t1', pub, [], [])
    expect(bundle.entryCount).toBe(1)
    expect(bundle.tenantId).toBe('t1')
  })

  it('filters domain events by tenantId', () => {
    const dom = [
      makeDomainEvent('t1', '2025-01-01T00:00:00Z'),
      makeDomainEvent('t2', '2025-01-01T00:01:00Z'),
    ]
    const bundle = buildAuditBundle('t1', [], dom, [])
    expect(bundle.entryCount).toBe(1)
  })

  it('includes all circuit events (no tenant filter)', () => {
    const cir = [
      makeCircuitEvent('2025-01-01T00:00:00Z'),
      makeCircuitEvent('2025-01-01T00:01:00Z'),
    ]
    const bundle = buildAuditBundle('t1', [], [], cir)
    expect(bundle.entryCount).toBe(2)
  })

  it('sorts entries by timestamp', () => {
    const pub = [makePublishEvent('t1', '2025-01-01T00:03:00Z')]
    const dom = [makeDomainEvent('t1', '2025-01-01T00:01:00Z')]
    const cir = [makeCircuitEvent('2025-01-01T00:02:00Z')]

    const bundle = buildAuditBundle('t1', pub, dom, cir)
    expect(bundle.entries[0].source).toBe('domain')
    expect(bundle.entries[1].source).toBe('circuit')
    expect(bundle.entries[2].source).toBe('publish')
  })

  it('generates valid bundleId', () => {
    const bundle = buildAuditBundle('t1', [], [], [])
    expect(bundle.bundleId).toMatch(/^aud_bundle_t1_/)
  })

  it('produces empty bundle for no events', () => {
    const bundle = buildAuditBundle('t1', [], [], [])
    expect(bundle.entryCount).toBe(0)
    expect(bundle.entries).toHaveLength(0)
    expect(bundle.integrityHash).toBeTruthy()
  })

  it('includes integrityHash', () => {
    const bundle = buildAuditBundle('t1', [makePublishEvent('t1', '2025-01-01T00:00:00Z')], [], [])
    expect(bundle.integrityHash).toMatch(/^[0-9a-f]{8}$/)
  })

  it('accepts custom hash function', () => {
    const customHash = (data: string) => `custom_${data.length}`
    const bundle = buildAuditBundle('t1', [], [], [], customHash)
    expect(bundle.integrityHash).toMatch(/^custom_/)
  })
})

// ─── verifyBundleIntegrity ─────────────────────────────────────────

describe('verifyBundleIntegrity', () => {
  it('returns true for unmodified bundle', () => {
    const bundle = buildAuditBundle(
      't1',
      [makePublishEvent('t1', '2025-01-01T00:00:00Z')],
      [makeDomainEvent('t1', '2025-01-01T00:01:00Z')],
      [],
    )
    expect(verifyBundleIntegrity(bundle)).toBe(true)
  })

  it('returns false for tampered bundle', () => {
    const bundle = buildAuditBundle(
      't1',
      [makePublishEvent('t1', '2025-01-01T00:00:00Z')],
      [],
      [],
    )
    const tampered = { ...bundle, integrityHash: 'deadbeef' }
    expect(verifyBundleIntegrity(tampered)).toBe(false)
  })

  it('verifies empty bundle', () => {
    const bundle = buildAuditBundle('t1', [], [], [])
    expect(verifyBundleIntegrity(bundle)).toBe(true)
  })
})

// ─── filterBySource ────────────────────────────────────────────────

describe('filterBySource', () => {
  it('filters by publish source', () => {
    const bundle = buildAuditBundle(
      't1',
      [makePublishEvent('t1', '2025-01-01T00:00:00Z')],
      [makeDomainEvent('t1', '2025-01-01T00:01:00Z')],
      [makeCircuitEvent('2025-01-01T00:02:00Z')],
    )
    const filtered = filterBySource(bundle, 'publish')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].source).toBe('publish')
  })

  it('filters by domain source', () => {
    const bundle = buildAuditBundle(
      't1',
      [makePublishEvent('t1', '2025-01-01T00:00:00Z')],
      [makeDomainEvent('t1', '2025-01-01T00:01:00Z')],
      [],
    )
    expect(filterBySource(bundle, 'domain')).toHaveLength(1)
  })

  it('returns empty for no matches', () => {
    const bundle = buildAuditBundle('t1', [], [], [])
    expect(filterBySource(bundle, 'publish')).toHaveLength(0)
  })
})

// ─── filterByTimeRange ─────────────────────────────────────────────

describe('filterByTimeRange', () => {
  it('returns entries within range', () => {
    const bundle = buildAuditBundle(
      't1',
      [
        makePublishEvent('t1', '2025-01-01T00:00:00Z'),
        makePublishEvent('t1', '2025-01-01T01:00:00Z'),
        makePublishEvent('t1', '2025-01-01T02:00:00Z'),
      ],
      [],
      [],
    )
    const filtered = filterByTimeRange(
      bundle,
      '2025-01-01T00:30:00Z',
      '2025-01-01T01:30:00Z',
    )
    expect(filtered).toHaveLength(1)
  })

  it('includes boundary timestamps', () => {
    const bundle = buildAuditBundle(
      't1',
      [makePublishEvent('t1', '2025-01-01T00:00:00Z')],
      [],
      [],
    )
    const filtered = filterByTimeRange(
      bundle,
      '2025-01-01T00:00:00Z',
      '2025-01-01T00:00:00Z',
    )
    expect(filtered).toHaveLength(1)
  })

  it('returns empty for out-of-range', () => {
    const bundle = buildAuditBundle(
      't1',
      [makePublishEvent('t1', '2025-01-01T00:00:00Z')],
      [],
      [],
    )
    const filtered = filterByTimeRange(
      bundle,
      '2025-02-01T00:00:00Z',
      '2025-02-01T01:00:00Z',
    )
    expect(filtered).toHaveLength(0)
  })
})
