/**
 * ops/publish/__tests__/publish-registry.test.ts
 *
 * Tests for P1: PublishTarget contract, registry, models, schema.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TargetRegistry } from '../targets/TargetRegistry.js'
import type { PublishTarget, PublishTargetKind, PublishTargetRegistration, CanPublishResult } from '../targets/PublishTarget.js'
import type { PublishRequest, TenantType } from '../models/PublishRequest.js'
import { createPublishRequest } from '../models/PublishRequest.js'
import type { PublishResult, PublishAuditEvent } from '../models/PublishResult.js'
import { createAuditEvent } from '../models/PublishResult.js'

// ── Helpers ──────────────────────────────────────────────────────

function makeRegistration(overrides: Partial<PublishTargetRegistration> = {}): PublishTargetRegistration {
  return {
    id: 'test-hosted',
    name: 'Test Hosted',
    kind: 'hosted',
    enabled: true,
    safeModeAllowed: true,
    requiredCapabilities: ['publish_site'],
    blockedTenantTypes: [],
    config: {},
    ...overrides,
  }
}

function makePublishTarget(
  reg: PublishTargetRegistration,
  publishFn?: (req: PublishRequest) => Promise<PublishResult>,
): PublishTarget {
  return {
    registration: reg,
    canPublish: () => ({ allowed: true }),
    publish: publishFn ?? (async (req) => ({
      success: true,
      target: reg.kind,
      siteId: req.siteId,
      correlationId: req.correlationId,
      manifestHash: 'abc123',
      publishedAt: new Date().toISOString(),
      version: 'v1',
      auditEvents: [],
    })),
  }
}

function makeRequest(overrides: Partial<PublishRequest> = {}): PublishRequest {
  return {
    tenantId: 'tenant-1',
    tenantType: 'standard',
    actorId: 'actor-1',
    actorRole: 'operator',
    siteId: 'site-1',
    blueprintId: 'law_firm',
    artifactRef: 'ref-abc',
    publishTarget: 'hosted',
    mode: 'owner',
    safeModeOn: false,
    correlationId: 'cor-123',
    requestedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function defaultCapChecker(role: string, capability: string): boolean {
  const caps: Record<string, string[]> = {
    operator: ['publish_site'],
    admin: ['publish_site', 'manage_deployments'],
    owner: ['publish_site', 'manage_deployments', 'dangerous_actions'],
    viewer: [],
  }
  return (caps[role] ?? []).includes(capability)
}

// ── Schema Validation ────────────────────────────────────────────

describe('PublishTarget.schema.json', () => {
  it('parses as valid JSON', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const schemaPath = path.resolve(__dirname, '../PublishTarget.schema.json')
    const raw = fs.readFileSync(schemaPath, 'utf-8')
    const schema = JSON.parse(raw)
    expect(schema.$id).toContain('publish-target')
    expect(schema.required).toContain('id')
    expect(schema.required).toContain('kind')
    expect(schema.required).toContain('enabled')
  })

  it('defines hosted|zip|github_pr as valid kinds', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const schemaPath = path.resolve(__dirname, '../PublishTarget.schema.json')
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
    expect(schema.properties.kind.enum).toEqual(['hosted', 'zip', 'github_pr'])
  })

  it('requires audit.append_only to be true', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const schemaPath = path.resolve(__dirname, '../PublishTarget.schema.json')
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
    expect(schema.properties.audit.properties.append_only.const).toBe(true)
  })
})

// ── PublishRequest Model ─────────────────────────────────────────

describe('createPublishRequest', () => {
  it('creates valid request with all required fields', () => {
    const result = createPublishRequest({
      tenantId: 't1', actorId: 'a1', siteId: 's1',
      blueprintId: 'bp1', artifactRef: 'ref1',
      publishTarget: 'hosted', correlationId: 'cor-1',
    })
    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.tenantId).toBe('t1')
      expect(result.safeModeOn).toBe(true) // default
      expect(result.mode).toBe('demo') // default
      expect(result.tenantType).toBe('standard') // default
    }
  })

  it('fails on missing required fields', () => {
    const result = createPublishRequest({
      tenantId: 't1', actorId: 'a1', siteId: 's1',
    } as any)
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toContain('blueprintId')
      expect(result.error).toContain('artifactRef')
    }
  })

  it('rejects invalid publish target', () => {
    const result = createPublishRequest({
      tenantId: 't1', actorId: 'a1', siteId: 's1',
      blueprintId: 'bp1', artifactRef: 'ref1',
      publishTarget: 'unknown' as any, correlationId: 'cor-1',
    })
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toContain('Invalid publish target')
    }
  })

  it('rejects invalid mode', () => {
    const result = createPublishRequest({
      tenantId: 't1', actorId: 'a1', siteId: 's1',
      blueprintId: 'bp1', artifactRef: 'ref1',
      publishTarget: 'hosted', correlationId: 'cor-1',
      mode: 'invalid' as any,
    })
    expect('error' in result).toBe(true)
  })
})

// ── Audit Event Model ────────────────────────────────────────────

describe('createAuditEvent', () => {
  it('creates event with all fields', () => {
    const event = createAuditEvent(1, 'cor-1', 'tenant-1', 'actor-1', 'site-1', 'hosted', 'publish_requested')
    expect(event.entryId).toBe('pub_aud_1')
    expect(event.correlationId).toBe('cor-1')
    expect(event.action).toBe('publish_requested')
    expect(event.timestamp).toBeTruthy()
  })

  it('includes optional details', () => {
    const event = createAuditEvent(2, 'cor-1', 't1', 'a1', 's1', 'zip', 'publish_failed', 'disk full')
    expect(event.details).toBe('disk full')
  })

  it('generates sequential entry IDs', () => {
    const e1 = createAuditEvent(1, 'c', 't', 'a', 's', 'hosted', 'publish_requested')
    const e2 = createAuditEvent(2, 'c', 't', 'a', 's', 'hosted', 'publish_started')
    expect(e1.entryId).toBe('pub_aud_1')
    expect(e2.entryId).toBe('pub_aud_2')
  })
})

// ── TargetRegistry ───────────────────────────────────────────────

describe('TargetRegistry', () => {
  let registry: TargetRegistry

  beforeEach(() => {
    registry = new TargetRegistry(defaultCapChecker)
  })

  describe('registration', () => {
    it('registers and retrieves a target', () => {
      const target = makePublishTarget(makeRegistration())
      registry.register(target)
      expect(registry.getTarget('hosted')).toBe(target)
    })

    it('lists registered target kinds', () => {
      registry.register(makePublishTarget(makeRegistration({ kind: 'hosted' })))
      registry.register(makePublishTarget(makeRegistration({ kind: 'zip', id: 'test-zip', name: 'ZIP' })))
      expect(registry.listTargets()).toEqual(expect.arrayContaining(['hosted', 'zip']))
    })

    it('unregisters a target', () => {
      registry.register(makePublishTarget(makeRegistration()))
      expect(registry.unregister('hosted')).toBe(true)
      expect(registry.getTarget('hosted')).toBeUndefined()
    })

    it('returns false unregistering unknown', () => {
      expect(registry.unregister('github_pr')).toBe(false)
    })
  })

  describe('publish — success path', () => {
    it('publishes through hosted target', async () => {
      registry.register(makePublishTarget(makeRegistration()))
      const result = await registry.publish(makeRequest())
      expect(result.success).toBe(true)
      expect(result.target).toBe('hosted')
    })

    it('emits audit events on success', async () => {
      registry.register(makePublishTarget(makeRegistration()))
      await registry.publish(makeRequest())
      const log = registry.getAuditLog()
      const actions = log.map(e => e.action)
      expect(actions).toContain('publish_requested')
      expect(actions).toContain('publish_started')
      expect(actions).toContain('publish_succeeded')
    })
  })

  describe('publish — blocked paths', () => {
    it('blocks unknown target', async () => {
      const result = await registry.publish(makeRequest({ publishTarget: 'github_pr' }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown publish target')
      expect(registry.getAuditLog().some(e => e.action === 'publish_blocked')).toBe(true)
    })

    it('blocks disabled target', async () => {
      registry.register(makePublishTarget(makeRegistration({ enabled: false })))
      const result = await registry.publish(makeRequest())
      expect(result.success).toBe(false)
      expect(result.error).toContain('disabled')
    })

    it('blocks target in Safe Mode when not allowed', async () => {
      registry.register(makePublishTarget(makeRegistration({
        kind: 'github_pr', id: 'gh', name: 'GitHub',
        safeModeAllowed: false,
      })))
      const result = await registry.publish(makeRequest({
        publishTarget: 'github_pr', safeModeOn: true,
      }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('Safe Mode')
    })

    it('allows hosted in Safe Mode', async () => {
      registry.register(makePublishTarget(makeRegistration({ safeModeAllowed: true })))
      const result = await registry.publish(makeRequest({ safeModeOn: true }))
      expect(result.success).toBe(true)
    })

    it('blocks public-demo tenant for github_pr', async () => {
      registry.register(makePublishTarget(makeRegistration({
        kind: 'github_pr', id: 'gh', name: 'GitHub',
        safeModeAllowed: false,
        blockedTenantTypes: ['public-demo'],
        requiredCapabilities: ['publish_site', 'manage_deployments'],
      })))
      const result = await registry.publish(makeRequest({
        publishTarget: 'github_pr',
        tenantType: 'public-demo',
        safeModeOn: false,
        actorRole: 'admin',
      }))
      expect(result.success).toBe(false)
      expect(result.error).toContain('public-demo')
    })

    it('blocks actor missing required capability', async () => {
      registry.register(makePublishTarget(makeRegistration({
        requiredCapabilities: ['manage_deployments'],
      })))
      const result = await registry.publish(makeRequest({ actorRole: 'operator' }))
      // operator only has publish_site, not manage_deployments
      expect(result.success).toBe(false)
      expect(result.error).toContain('manage_deployments')
    })

    it('allows admin with manage_deployments', async () => {
      registry.register(makePublishTarget(makeRegistration({
        requiredCapabilities: ['publish_site', 'manage_deployments'],
      })))
      const result = await registry.publish(makeRequest({ actorRole: 'admin' }))
      expect(result.success).toBe(true)
    })
  })

  describe('publish — error handling', () => {
    it('catches thrown errors and returns failed result', async () => {
      const errorTarget = makePublishTarget(
        makeRegistration(),
        async () => { throw new Error('storage offline') },
      )
      registry.register(errorTarget)
      const result = await registry.publish(makeRequest())
      expect(result.success).toBe(false)
      expect(result.error).toBe('storage offline')
      expect(registry.getAuditLog().some(e => e.action === 'publish_failed')).toBe(true)
    })

    it('handles non-Error throwable', async () => {
      const errorTarget = makePublishTarget(
        makeRegistration(),
        async () => { throw 'string error' },
      )
      registry.register(errorTarget)
      const result = await registry.publish(makeRequest())
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error')
    })
  })

  describe('audit log', () => {
    it('returns empty log initially', () => {
      expect(registry.getAuditLog()).toEqual([])
      expect(registry.auditLogSize).toBe(0)
    })

    it('audit log grows with each publish', async () => {
      registry.register(makePublishTarget(makeRegistration()))
      await registry.publish(makeRequest({ correlationId: 'c1' }))
      await registry.publish(makeRequest({ correlationId: 'c2' }))
      expect(registry.auditLogSize).toBeGreaterThanOrEqual(6) // 3 events per publish
    })

    it('filters by correlationId', async () => {
      registry.register(makePublishTarget(makeRegistration()))
      await registry.publish(makeRequest({ correlationId: 'c1' }))
      await registry.publish(makeRequest({ correlationId: 'c2' }))
      const c1Events = registry.getAuditForCorrelation('c1')
      expect(c1Events.every(e => e.correlationId === 'c1')).toBe(true)
      expect(c1Events.length).toBe(3)
    })

    it('audit log is append-only (read copy does not affect internal)', () => {
      registry.register(makePublishTarget(makeRegistration()))
      const log = registry.getAuditLog()
      expect(log).toEqual([]) // empty before publish
      // mutating the returned array does not affect internal
      ;(log as any[]).push({ fake: true })
      expect(registry.auditLogSize).toBe(0)
    })
  })

  describe('listAvailableTargets', () => {
    it('returns only enabled and allowed targets', () => {
      registry.register(makePublishTarget(makeRegistration({ kind: 'hosted' })))
      registry.register(makePublishTarget(makeRegistration({
        kind: 'zip', id: 'zip', name: 'ZIP',
      })))
      registry.register(makePublishTarget(makeRegistration({
        kind: 'github_pr', id: 'gh', name: 'GitHub',
        enabled: false,
      })))
      const available = registry.listAvailableTargets(makeRequest())
      expect(available).toContain('hosted')
      expect(available).toContain('zip')
      expect(available).not.toContain('github_pr')
    })

    it('safe mode filters non-allowed targets', () => {
      registry.register(makePublishTarget(makeRegistration({
        kind: 'hosted', safeModeAllowed: true,
      })))
      registry.register(makePublishTarget(makeRegistration({
        kind: 'github_pr', id: 'gh', name: 'GitHub',
        safeModeAllowed: false,
      })))
      const available = registry.listAvailableTargets(makeRequest({ safeModeOn: true }))
      expect(available).toContain('hosted')
      expect(available).not.toContain('github_pr')
    })
  })
})
