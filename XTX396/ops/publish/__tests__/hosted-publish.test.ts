/**
 * ops/publish/__tests__/hosted-publish.test.ts
 *
 * Tests for P2: Hosted Publish Target
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HostedPublishTarget, generateVersion } from '../targets/HostedPublishTarget.js'
import type { ArtifactBundle, ArtifactEntry } from '../targets/HostedPublishTarget.js'
import { InMemoryHostedStorage, hostedKey, hostedUrl } from '../storage/HostedStorage.js'
import type { PublishRequest } from '../models/PublishRequest.js'
import { TargetRegistry } from '../targets/TargetRegistry.js'

// ── Helpers ──────────────────────────────────────────────────────

function makeArtifact(path: string, content: string): ArtifactEntry {
  return { path, content, sha256: `sha256_${path}`, size: content.length }
}

function makeBundle(overrides: Partial<ArtifactBundle> = {}): ArtifactBundle {
  return {
    siteId: 'site-1',
    blueprintId: 'law_firm',
    artifacts: [
      makeArtifact('index.html', '<html><body>Home</body></html>'),
      makeArtifact('about.html', '<html><body>About</body></html>'),
    ],
    manifestHash: 'abcdef123456789',
    watermarked: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
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
    artifactRef: 'ref-1',
    publishTarget: 'hosted',
    mode: 'owner',
    safeModeOn: false,
    correlationId: 'cor-1',
    requestedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function defaultCapChecker(role: string, capability: string): boolean {
  const caps: Record<string, string[]> = {
    operator: ['publish_site'],
    admin: ['publish_site', 'manage_deployments'],
    owner: ['publish_site', 'manage_deployments', 'dangerous_actions'],
  }
  return (caps[role] ?? []).includes(capability)
}

// ── generateVersion ──────────────────────────────────────────────

describe('generateVersion', () => {
  it('produces deterministic version string', () => {
    const v1 = generateVersion('abcdef123456789', '2026-01-01T00:00:00.000Z')
    const v2 = generateVersion('abcdef123456789', '2026-01-01T00:00:00.000Z')
    expect(v1).toBe(v2)
  })

  it('includes hash prefix', () => {
    const v = generateVersion('abcdef123456789', '2026-01-01T00:00:00.000Z')
    expect(v).toContain('abcdef123456')
  })

  it('produces different versions for different hashes', () => {
    const v1 = generateVersion('aaaa', '2026-01-01T00:00:00.000Z')
    const v2 = generateVersion('bbbb', '2026-01-01T00:00:00.000Z')
    expect(v1).not.toBe(v2)
  })
})

// ── HostedStorage ────────────────────────────────────────────────

describe('InMemoryHostedStorage', () => {
  let storage: InMemoryHostedStorage

  beforeEach(() => {
    storage = new InMemoryHostedStorage()
  })

  it('stores and retrieves artifacts', async () => {
    await storage.put('k1', { key: 'k1', content: 'data', sha256: 'h', size: 4, storedAt: 'now' })
    const result = await storage.get('k1')
    expect(result?.content).toBe('data')
  })

  it('rejects overwrite (immutable)', async () => {
    await storage.put('k1', { key: 'k1', content: 'a', sha256: 'h', size: 1, storedAt: 'now' })
    await expect(
      storage.put('k1', { key: 'k1', content: 'b', sha256: 'h', size: 1, storedAt: 'now' }),
    ).rejects.toThrow('already exists')
  })

  it('returns null for missing key', async () => {
    expect(await storage.get('nope')).toBeNull()
  })

  it('checks existence', async () => {
    await storage.put('k1', { key: 'k1', content: 'x', sha256: 'h', size: 1, storedAt: 'now' })
    expect(await storage.exists('k1')).toBe(true)
    expect(await storage.exists('k2')).toBe(false)
  })

  it('lists keys by prefix', async () => {
    await storage.put('a/1', { key: 'a/1', content: '', sha256: '', size: 0, storedAt: '' })
    await storage.put('a/2', { key: 'a/2', content: '', sha256: '', size: 0, storedAt: '' })
    await storage.put('b/1', { key: 'b/1', content: '', sha256: '', size: 0, storedAt: '' })
    const keys = await storage.list('a/')
    expect(keys).toEqual(['a/1', 'a/2'])
  })

  it('sets and gets active pointer', async () => {
    await storage.setActive({
      tenantId: 't1', siteId: 's1', version: 'v1',
      activatedAt: 'now', activatedBy: 'actor-1',
    })
    const ptr = await storage.getActive('t1', 's1')
    expect(ptr?.version).toBe('v1')
  })

  it('returns null for missing active pointer', async () => {
    expect(await storage.getActive('t1', 's1')).toBeNull()
  })
})

// ── hostedKey + hostedUrl ────────────────────────────────────────

describe('helpers', () => {
  it('generates correct hosted key', () => {
    expect(hostedKey('t1', 's1', 'v1', 'index.html'))
      .toBe('hosted_sites/t1/s1/v1/index.html')
  })

  it('generates correct hosted URL', () => {
    expect(hostedUrl('my-site')).toBe('/sites/my-site/')
  })
})

// ── HostedPublishTarget ──────────────────────────────────────────

describe('HostedPublishTarget', () => {
  let storage: InMemoryHostedStorage
  let target: HostedPublishTarget

  beforeEach(() => {
    storage = new InMemoryHostedStorage()
    target = new HostedPublishTarget(storage)
  })

  it('publishes artifacts to versioned storage', async () => {
    const bundle = makeBundle()
    target.registerBundle('ref-1', bundle)
    const result = await target.publish(makeRequest())
    expect(result.success).toBe(true)
    expect(result.target).toBe('hosted')
    expect(result.version).toBeTruthy()
    expect(result.url).toContain('/sites/')
    expect(result.manifestHash).toBe(bundle.manifestHash)
  })

  it('stores correct number of artifacts', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest())
    expect(storage.size).toBe(2)
  })

  it('sets active pointer after publish', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest())
    const pointer = await storage.getActive('tenant-1', 'site-1')
    expect(pointer).not.toBeNull()
    expect(pointer!.activatedBy).toBe('actor-1')
  })

  it('fails when bundle not found', async () => {
    const result = await target.publish(makeRequest({ artifactRef: 'missing' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('enforces watermark in demo mode', async () => {
    target.registerBundle('ref-1', makeBundle({ watermarked: false }))
    const result = await target.publish(makeRequest({ mode: 'demo' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('watermark')
  })

  it('allows unwatermarked in owner mode', async () => {
    target.registerBundle('ref-1', makeBundle({ watermarked: false }))
    const result = await target.publish(makeRequest({ mode: 'owner' }))
    expect(result.success).toBe(true)
  })

  it('blocks overwrite of existing version', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest())
    // Same request again → same version → overwrite blocked
    const result = await target.publish(makeRequest())
    expect(result.success).toBe(false)
    expect(result.error).toContain('already published')
  })
})

// ── Integration: Registry + Hosted ──────────────────────────────

describe('Registry + HostedPublishTarget', () => {
  it('publishes through registry with audit trail', async () => {
    const storage = new InMemoryHostedStorage()
    const target = new HostedPublishTarget(storage)
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest())
    expect(result.success).toBe(true)

    const log = registry.getAuditLog()
    const actions = log.map(e => e.action)
    expect(actions).toContain('publish_requested')
    expect(actions).toContain('publish_started')
    expect(actions).toContain('publish_succeeded')
  })

  it('registry blocks suspended tenant', async () => {
    const storage = new InMemoryHostedStorage()
    const target = new HostedPublishTarget(storage)
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest({ tenantType: 'suspended' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('suspended')
  })

  it('demo watermark enforcement end-to-end', async () => {
    const storage = new InMemoryHostedStorage()
    const target = new HostedPublishTarget(storage)
    // Register unwatermarked bundle
    target.registerBundle('ref-1', makeBundle({ watermarked: false }))

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest({ mode: 'demo' }))
    expect(result.success).toBe(false)
    expect(result.error).toContain('watermark')
  })
})
