/**
 * ops/publish/__tests__/zip-export.test.ts
 *
 * Tests for P3: ZIP Export Target
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { buildExportManifest } from '../export/exportManifest.js'
import { buildZipPackage } from '../export/zipBuilder.js'
import type { ZipEntry } from '../export/zipBuilder.js'
import { ZipExportTarget } from '../targets/ZipExportTarget.js'
import type { ArtifactBundle, ArtifactEntry } from '../targets/HostedPublishTarget.js'
import type { PublishRequest } from '../models/PublishRequest.js'
import { TargetRegistry } from '../targets/TargetRegistry.js'

// ── Helpers ──────────────────────────────────────────────────────

function djb2(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

function makeZipEntry(path: string, content: string): ZipEntry {
  return { path, content, sha256: `sha_${path}`, size: content.length }
}

function makeArtifact(path: string, content: string): ArtifactEntry {
  return { path, content, sha256: `sha_${path}`, size: content.length }
}

function makeBundle(overrides: Partial<ArtifactBundle> = {}): ArtifactBundle {
  return {
    siteId: 'site-1',
    blueprintId: 'law_firm',
    artifacts: [
      makeArtifact('index.html', '<html>Home</html>'),
      makeArtifact('about.html', '<html>About</html>'),
    ],
    manifestHash: 'manifest_abc123',
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
    publishTarget: 'zip',
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
  }
  return (caps[role] ?? []).includes(capability)
}

// ── Export Manifest ──────────────────────────────────────────────

describe('buildExportManifest', () => {
  it('builds manifest with sorted entries', () => {
    const entries = [
      { path: 'b.html', sha256: 'sha_b', size: 10 },
      { path: 'a.html', sha256: 'sha_a', size: 8 },
    ]
    const manifest = buildExportManifest(
      'site-1', 'law_firm', '2026-01-01T00:00:00Z', 'cor-1',
      true, false, entries, djb2,
    )
    expect(manifest.entries[0].path).toBe('a.html')
    expect(manifest.entries[1].path).toBe('b.html')
  })

  it('produces deterministic manifest hash', () => {
    const entries = [{ path: 'a.html', sha256: 'sha_a', size: 8 }]
    const m1 = buildExportManifest('s', 'b', 'g', 'c', true, false, entries, djb2)
    const m2 = buildExportManifest('s', 'b', 'g', 'c', true, false, entries, djb2)
    expect(m1.manifestHash).toBe(m2.manifestHash)
  })

  it('different entries produce different hash', () => {
    const e1 = [{ path: 'a.html', sha256: 'sha_a', size: 8 }]
    const e2 = [{ path: 'a.html', sha256: 'sha_b', size: 8 }]
    const m1 = buildExportManifest('s', 'b', 'g', 'c', true, false, e1, djb2)
    const m2 = buildExportManifest('s', 'b', 'g', 'c', true, false, e2, djb2)
    expect(m1.manifestHash).not.toBe(m2.manifestHash)
  })

  it('includes demoMode flag', () => {
    const entries = [{ path: 'a.html', sha256: 'sha_a', size: 8 }]
    const manifest = buildExportManifest('s', 'b', 'g', 'c', true, true, entries, djb2)
    expect(manifest.demoMode).toBe(true)
  })
})

// ── ZIP Builder ──────────────────────────────────────────────────

describe('buildZipPackage', () => {
  const artifacts: ZipEntry[] = [
    makeZipEntry('index.html', '<html>Home</html>'),
    makeZipEntry('about.html', '<html>About</html>'),
  ]

  it('builds ZIP with all entries', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    expect('error' in pkg).toBe(false)
    if (!('error' in pkg)) {
      // 2 artifacts + manifest.json + generation.meta.json
      expect(pkg.entries.length).toBe(4)
    }
  })

  it('includes manifest.json in entries', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    if (!('error' in pkg)) {
      expect(pkg.entries.some(e => e.path === 'manifest.json')).toBe(true)
    }
  })

  it('includes generation.meta.json in entries', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    if (!('error' in pkg)) {
      expect(pkg.entries.some(e => e.path === 'generation.meta.json')).toBe(true)
    }
  })

  it('includes DEMO_DISCLAIMER.txt for demo mode', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, true, artifacts)
    if (!('error' in pkg)) {
      expect(pkg.entries.some(e => e.path === 'DEMO_DISCLAIMER.txt')).toBe(true)
      expect(pkg.disclaimer).toBeTruthy()
    }
  })

  it('does not include disclaimer for non-demo', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    if (!('error' in pkg)) {
      expect(pkg.entries.some(e => e.path === 'DEMO_DISCLAIMER.txt')).toBe(false)
      expect(pkg.disclaimer).toBeUndefined()
    }
  })

  it('generates deterministic filename', () => {
    const p1 = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    const p2 = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    if (!('error' in p1) && !('error' in p2)) {
      expect(p1.filename).toBe(p2.filename)
    }
  })

  it('rejects oversized packages', () => {
    const result = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts, {
      maxTotalSize: 1, // 1 byte max
      hashFn: djb2,
    })
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toContain('exceeds maximum')
    }
  })

  it('manifest hash matches extracted entries', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    if (!('error' in pkg)) {
      const manifestEntry = pkg.entries.find(e => e.path === 'manifest.json')
      expect(manifestEntry).toBeTruthy()
      const parsed = JSON.parse(manifestEntry!.content)
      expect(parsed.manifestHash).toBe(pkg.manifest.manifestHash)
    }
  })

  it('generation meta contains no secrets', () => {
    const pkg = buildZipPackage('s1', 'bp1', 'gen', 'cor-1', true, false, artifacts)
    if (!('error' in pkg)) {
      const metaEntry = pkg.entries.find(e => e.path === 'generation.meta.json')
      const meta = JSON.parse(metaEntry!.content)
      expect(meta.siteId).toBe('s1')
      expect(meta.artifactCount).toBe(2)
      // Ensure no secret-like fields
      expect(meta).not.toHaveProperty('token')
      expect(meta).not.toHaveProperty('secret')
      expect(meta).not.toHaveProperty('key')
      expect(meta).not.toHaveProperty('password')
    }
  })
})

// ── ZipExportTarget ──────────────────────────────────────────────

describe('ZipExportTarget', () => {
  let target: ZipExportTarget

  beforeEach(() => {
    target = new ZipExportTarget()
  })

  it('exports site as ZIP', async () => {
    target.registerBundle('ref-1', makeBundle())
    const result = await target.publish(makeRequest())
    expect(result.success).toBe(true)
    expect(result.target).toBe('zip')
    expect(result.downloadRef).toContain('.zip')
    expect(result.manifestHash).toBeTruthy()
  })

  it('stores export for later retrieval', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest())
    const exp = target.getExport('cor-1')
    expect(exp).toBeTruthy()
    expect(exp!.entries.length).toBeGreaterThanOrEqual(4) // 2 artifacts + manifest + meta
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

  it('demo export includes disclaimer', async () => {
    target.registerBundle('ref-1', makeBundle())
    await target.publish(makeRequest({ mode: 'demo' }))
    const exp = target.getExport('cor-1')
    expect(exp?.disclaimer).toBeTruthy()
    expect(exp?.entries.some(e => e.path === 'DEMO_DISCLAIMER.txt')).toBe(true)
  })
})

// ── Registry Integration ──────────────────────────────────────────

describe('Registry + ZipExportTarget', () => {
  it('exports through registry with audit trail', async () => {
    const target = new ZipExportTarget()
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest())
    expect(result.success).toBe(true)
    expect(result.downloadRef).toContain('.zip')

    const log = registry.getAuditLog()
    expect(log.some(e => e.action === 'publish_succeeded')).toBe(true)
  })

  it('blocks suspended tenant', async () => {
    const target = new ZipExportTarget()
    target.registerBundle('ref-1', makeBundle())

    const registry = new TargetRegistry(defaultCapChecker)
    registry.register(target)

    const result = await registry.publish(makeRequest({ tenantType: 'suspended' }))
    expect(result.success).toBe(false)
  })
})
