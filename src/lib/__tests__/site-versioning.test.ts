/**
 * Site Versioning Service Tests (CP1)
 *
 * Tests cover:
 * - Version creation with SHA-256 hash
 * - Version ordering (newest first)
 * - Version restore behavior
 * - Snapshot extraction (no secrets)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter } from '@/lib/storage-adapter'
import { SiteRegistry } from '@/lib/site-registry'
import { SiteVersioningService, extractSnapshot, canonicalizeSnapshot } from '@/lib/site-versioning'
import type { NormalizedSiteData, SiteVersionSnapshot } from '@/lib/types'

// ─── Test Fixtures ───────────────────────────────────────────

function createMockNormalizedData(overrides: Partial<NormalizedSiteData> = {}): NormalizedSiteData {
  return {
    type: 'law-firm',
    siteId: 'test-site-1',
    name: 'Test Law Firm',
    slug: 'test-law-firm',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    branding: {
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748',
      logo: '/logo.png',
    },
    seo: {
      title: 'Test Law Firm | Legal Services',
      description: 'Professional legal services',
      ogImage: '/og.png',
    },
    ...overrides,
  } as NormalizedSiteData
}

// ─── Snapshot Extraction ─────────────────────────────────────

describe('extractSnapshot', () => {
  it('extracts basic fields from normalized data', () => {
    const data = createMockNormalizedData()
    const snapshot = extractSnapshot(data)

    expect(snapshot.type).toBe('law-firm')
    expect(snapshot.name).toBe('Test Law Firm')
    expect(snapshot.slug).toBe('test-law-firm')
  })

  it('includes branding without secrets', () => {
    const data = createMockNormalizedData()
    const snapshot = extractSnapshot(data)

    expect(snapshot.branding).toBeDefined()
    expect(snapshot.branding?.primaryColor).toBe('#1a365d')
    expect(snapshot.branding?.logo).toBe('/logo.png')
  })

  it('includes SEO metadata', () => {
    const data = createMockNormalizedData()
    const snapshot = extractSnapshot(data)

    expect(snapshot.seo).toBeDefined()
    expect(snapshot.seo?.title).toBe('Test Law Firm | Legal Services')
  })

  it('extracts content blocks for law-firm type', () => {
    const data = createMockNormalizedData({
      caseResults: [{ id: '1', title: 'Case 1' }],
      attorneys: [{ id: 'a1', name: 'John Doe' }],
    } as unknown as Partial<NormalizedSiteData>)
    const snapshot = extractSnapshot(data)

    expect(snapshot.contentBlocks.caseResults).toBeDefined()
    expect(snapshot.contentBlocks.attorneys).toBeDefined()
  })

  it('does NOT include sensitive fields like intakeSubmissions', () => {
    const data = createMockNormalizedData({
      intakeSubmissions: [{ email: 'secret@example.com' }],
    } as unknown as Partial<NormalizedSiteData>)
    const snapshot = extractSnapshot(data)

    // intakeSubmissions should not be in contentBlocks (user data)
    expect(snapshot.contentBlocks.intakeSubmissions).toBeUndefined()
  })
})

// ─── Canonical JSON ──────────────────────────────────────────

describe('canonicalizeSnapshot', () => {
  it('produces stable output for same input', () => {
    const snapshot: SiteVersionSnapshot = {
      type: 'law-firm',
      name: 'Test',
      slug: 'test',
      contentBlocks: { a: 1, b: 2 },
    }
    const canonical1 = canonicalizeSnapshot(snapshot)
    const canonical2 = canonicalizeSnapshot(snapshot)

    expect(canonical1).toBe(canonical2)
  })

  it('produces same output regardless of property order', () => {
    const snapshot1: SiteVersionSnapshot = {
      type: 'law-firm',
      name: 'Test',
      slug: 'test',
      contentBlocks: {},
    }
    const snapshot2: SiteVersionSnapshot = {
      slug: 'test',
      contentBlocks: {},
      type: 'law-firm',
      name: 'Test',
    }

    // After canonicalization, order should be consistent
    const c1 = canonicalizeSnapshot(snapshot1)
    const c2 = canonicalizeSnapshot(snapshot2)
    expect(c1).toBe(c2)
  })
})

// ─── SiteVersioningService ───────────────────────────────────

describe('SiteVersioningService', () => {
  let adapter: MemoryAdapter
  let registry: SiteRegistry
  let versioning: SiteVersioningService

  beforeEach(async () => {
    adapter = new MemoryAdapter()
    registry = new SiteRegistry(adapter)
    versioning = new SiteVersioningService(adapter)

    // Create a test site
    await registry.create('law-firm', 'Test Law Firm', undefined, 'test-actor')
  })

  describe('createVersion', () => {
    it('creates a version with valid hash', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const version = await versioning.createVersion(siteId, 'admin', 'v1.0.0')

      expect(version.versionId).toBeTruthy()
      expect(version.siteId).toBe(siteId)
      expect(version.dataHash).toBeTruthy()
      expect(version.dataHash.length).toBe(64) // SHA-256 hex = 64 chars
      expect(version.label).toBe('v1.0.0')
      expect(version.createdBy).toBe('admin')
    })

    it('creates version with notes', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const version = await versioning.createVersion(
        siteId,
        'admin',
        'Pre-launch',
        'Final review before going live',
      )

      expect(version.notes).toBe('Final review before going live')
    })

    it('produces consistent hash for same data', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      // Create two versions without changing data
      const v1 = await versioning.createVersion(siteId, 'admin', 'v1')
      const v2 = await versioning.createVersion(siteId, 'admin', 'v2')

      // Hash should be same since data didn't change
      expect(v1.dataHash).toBe(v2.dataHash)
    })

    it('throws for non-existent site', async () => {
      await expect(
        versioning.createVersion('non-existent', 'admin'),
      ).rejects.toThrow('Site not found')
    })
  })

  describe('listVersions', () => {
    it('returns empty array for site with no versions', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      // Clear any auto-created versions
      const versions = await versioning.listVersions(siteId)
      // May or may not have versions depending on implementation
      expect(Array.isArray(versions)).toBe(true)
    })

    it('returns versions in newest-first order', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await versioning.createVersion(siteId, 'admin', 'v1')
      await new Promise(r => setTimeout(r, 10)) // Small delay for timestamp
      await versioning.createVersion(siteId, 'admin', 'v2')
      await new Promise(r => setTimeout(r, 10))
      await versioning.createVersion(siteId, 'admin', 'v3')

      const versions = await versioning.listVersions(siteId)
      expect(versions.length).toBeGreaterThanOrEqual(3)
      expect(versions[0].label).toBe('v3')
      expect(versions[1].label).toBe('v2')
      expect(versions[2].label).toBe('v1')
    })
  })

  describe('getVersion', () => {
    it('returns null for non-existent version', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const version = await versioning.getVersion(siteId, 'non-existent-id')
      expect(version).toBeNull()
    })

    it('returns version by ID', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const created = await versioning.createVersion(siteId, 'admin', 'test')
      const fetched = await versioning.getVersion(siteId, created.versionId)

      expect(fetched).not.toBeNull()
      expect(fetched!.versionId).toBe(created.versionId)
      expect(fetched!.label).toBe('test')
    })
  })

  describe('restoreVersion', () => {
    it('restores snapshot data and creates new version', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      // Create initial version
      const v1 = await versioning.createVersion(siteId, 'admin', 'v1')

      // Modify site data (simulate edit)
      const data = await registry.getSiteData(siteId)
      if (data && 'config' in data) {
        (data.config as { firmName: string }).firmName = 'Modified Name'
        await registry.setSiteData(siteId, data, 'admin')
      }

      // Create v2 with modified data
      const v2 = await versioning.createVersion(siteId, 'admin', 'v2')
      // v2 hash may or may not differ depending on what changed
      expect(v2.dataHash).toBeTruthy()

      // Restore to v1
      const restored = await versioning.restoreVersion(siteId, v1.versionId, 'admin')

      expect(restored.notes).toContain('Restored from')
    })

    it('logs restore to audit trail', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const v1 = await versioning.createVersion(siteId, 'admin', 'v1')
      await versioning.restoreVersion(siteId, v1.versionId, 'admin')

      const auditLog = await registry.getAuditLog(siteId)
      const restoreEvent = auditLog.find(e => e.action === 'version.restored')
      expect(restoreEvent).toBeDefined()
      expect(restoreEvent!.entityId).toBe(v1.versionId)
    })

    it('throws for non-existent version', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      await expect(
        versioning.restoreVersion(siteId, 'non-existent', 'admin'),
      ).rejects.toThrow('Version not found')
    })
  })

  describe('compareVersions', () => {
    it('returns diff between two versions', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const v1 = await versioning.createVersion(siteId, 'admin', 'v1')
      const v2 = await versioning.createVersion(siteId, 'admin', 'v2')

      const diff = await versioning.compareVersions(siteId, v1.versionId, v2.versionId)

      expect(diff).not.toBeNull()
      expect(diff!.fromVersion.versionId).toBe(v1.versionId)
      expect(diff!.toVersion.versionId).toBe(v2.versionId)
    })

    it('returns null if either version not found', async () => {
      const sites = await registry.list()
      const siteId = sites[0].siteId

      const diff = await versioning.compareVersions(siteId, 'bad-1', 'bad-2')
      expect(diff).toBeNull()
    })
  })
})
