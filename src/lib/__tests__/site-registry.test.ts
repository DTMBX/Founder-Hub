/**
 * Site Registry + Migration Tests
 *
 * Uses MemoryAdapter — no browser, no localStorage, no side effects.
 * Tests cover: registry CRUD, slug resolution, migration behavior, audit trail.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAdapter } from '@/lib/storage-adapter'
import { SiteRegistry, KEYS, generateSlug, ensureUniqueSlug } from '@/lib/site-registry'
import { migrateToMultiInstance, isMigrated, resetMigration } from '@/lib/site-migration'
import type { SiteSummary, LawFirmShowcaseData, SMBTemplateData, AgencyFrameworkData, SiteAuditEvent } from '@/lib/types'

// ─── Slug Utilities ──────────────────────────────────────────

describe('generateSlug', () => {
  it('converts a name to a URL-safe slug', () => {
    expect(generateSlug('My Law Firm')).toBe('my-law-firm')
  })

  it('strips special characters', () => {
    expect(generateSlug('Café & Bar!')).toBe('caf-bar')
  })

  it('trims leading/trailing hyphens', () => {
    expect(generateSlug('  --hello world--  ')).toBe('hello-world')
  })

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(100)
    expect(generateSlug(long).length).toBeLessThanOrEqual(60)
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('ensureUniqueSlug', () => {
  it('returns slug unchanged if unique', () => {
    expect(ensureUniqueSlug('my-firm', ['other-firm'])).toBe('my-firm')
  })

  it('appends -2 on first collision', () => {
    expect(ensureUniqueSlug('my-firm', ['my-firm'])).toBe('my-firm-2')
  })

  it('increments suffix on multiple collisions', () => {
    expect(ensureUniqueSlug('my-firm', ['my-firm', 'my-firm-2', 'my-firm-3'])).toBe('my-firm-4')
  })
})

// ─── SiteRegistry CRUD ──────────────────────────────────────

describe('SiteRegistry', () => {
  let adapter: MemoryAdapter
  let registry: SiteRegistry

  beforeEach(() => {
    adapter = new MemoryAdapter()
    registry = new SiteRegistry(adapter)
  })

  // ── Create ─────────────────────────────────────────────

  describe('create', () => {
    it('creates a law-firm site with empty data', async () => {
      const site = await registry.create('law-firm', 'Smith & Associates')

      expect(site.siteId).toBeTruthy()
      expect(site.type).toBe('law-firm')
      expect(site.name).toBe('Smith & Associates')
      expect(site.slug).toBe('smith-associates')
      expect(site.status).toBe('draft')
      expect(site.createdAt).toBeTruthy()
      expect(site.updatedAt).toBeTruthy()
    })

    it('creates a small-business site with empty data', async () => {
      const site = await registry.create('small-business', "Joe's Pizza")

      expect(site.type).toBe('small-business')
      expect(site.slug).toBe('joe-s-pizza')

      const data = await registry.getSiteData<'small-business'>(site.siteId)
      expect(data).not.toBeNull()
      expect(data!.config.businessName).toBe("Joe's Pizza")
      expect(data!.services).toEqual([])
    })

    it('creates an agency site with empty data', async () => {
      const site = await registry.create('agency', 'Digital Agency')

      const data = await registry.getSiteData<'agency'>(site.siteId)
      expect(data).not.toBeNull()
      expect(data!.config.defaultHourlyRate).toBe(15000)
      expect(data!.projects).toEqual([])
      expect(data!.brandingRemoved).toBe(true)
    })

    it('auto-deduplicates slugs', async () => {
      const a = await registry.create('law-firm', 'Test Firm')
      const b = await registry.create('law-firm', 'Test Firm')

      expect(a.slug).toBe('test-firm')
      expect(b.slug).toBe('test-firm-2')
    })

    it('allows custom slug override', async () => {
      const site = await registry.create('law-firm', 'My Firm', 'custom-slug')
      expect(site.slug).toBe('custom-slug')
    })

    it('initializes empty sub-indexes', async () => {
      const site = await registry.create('law-firm', 'Test')

      const contracts = await adapter.get(KEYS.contractsIndex(site.siteId))
      const exports = await adapter.get(KEYS.exportsIndex(site.siteId))
      const audit = await adapter.get(KEYS.auditIndex(site.siteId))

      expect(contracts).toEqual([])
      expect(exports).toEqual([])
      // audit has the creation event
      expect(Array.isArray(audit)).toBe(true)
    })
  })

  // ── List ───────────────────────────────────────────────

  describe('list', () => {
    it('returns empty array when no sites exist', async () => {
      const sites = await registry.list()
      expect(sites).toEqual([])
    })

    it('returns all created sites', async () => {
      await registry.create('law-firm', 'Firm A')
      await registry.create('small-business', 'Shop B')
      await registry.create('agency', 'Agency C')

      const sites = await registry.list()
      expect(sites).toHaveLength(3)
      expect(sites.map((s: SiteSummary) => s.type)).toEqual(['law-firm', 'small-business', 'agency'])
    })
  })

  // ── Get ────────────────────────────────────────────────

  describe('get', () => {
    it('returns site by ID', async () => {
      const created = await registry.create('law-firm', 'Test Firm')
      const fetched = await registry.get(created.siteId)

      expect(fetched).not.toBeNull()
      expect(fetched!.siteId).toBe(created.siteId)
      expect(fetched!.name).toBe('Test Firm')
    })

    it('returns null for nonexistent ID', async () => {
      const result = await registry.get('nonexistent-id')
      expect(result).toBeNull()
    })
  })

  // ── findBySlug ─────────────────────────────────────────

  describe('findBySlug', () => {
    it('resolves a site by slug', async () => {
      const created = await registry.create('law-firm', 'Smith Legal')
      const found = await registry.findBySlug('smith-legal')

      expect(found).not.toBeNull()
      expect(found!.siteId).toBe(created.siteId)
    })

    it('returns null for unknown slug', async () => {
      const result = await registry.findBySlug('unknown-slug')
      expect(result).toBeNull()
    })
  })

  // ── Update ─────────────────────────────────────────────

  describe('update', () => {
    it('updates site name', async () => {
      const site = await registry.create('law-firm', 'Old Name')
      // Small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 5))
      const updated = await registry.update(site.siteId, { name: 'New Name' })

      expect(updated.name).toBe('New Name')
      expect(updated.siteId).toBe(site.siteId)
      // updatedAt should be at least as recent as createdAt
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(site.updatedAt).getTime()
      )
    })

    it('updates site status', async () => {
      const site = await registry.create('law-firm', 'Test')
      const updated = await registry.update(site.siteId, { status: 'public' })

      expect(updated.status).toBe('public')
    })

    it('updates slug with uniqueness check', async () => {
      const a = await registry.create('law-firm', 'Firm A')
      await registry.create('law-firm', 'Firm B')

      const updated = await registry.update(a.siteId, { slug: 'new-slug' })
      expect(updated.slug).toBe('new-slug')
    })

    it('rejects duplicate slug', async () => {
      await registry.create('law-firm', 'Firm A', 'slug-a')
      const b = await registry.create('law-firm', 'Firm B', 'slug-b')

      await expect(
        registry.update(b.siteId, { slug: 'slug-a' })
      ).rejects.toThrow('Slug already in use')
    })

    it('throws for nonexistent site', async () => {
      await expect(
        registry.update('nonexistent', { name: 'Test' })
      ).rejects.toThrow('Site not found')
    })

    it('sets domain', async () => {
      const site = await registry.create('law-firm', 'Test')
      const updated = await registry.update(site.siteId, { domain: 'smithlaw.com' })
      expect(updated.domain).toBe('smithlaw.com')
    })
  })

  // ── Delete ─────────────────────────────────────────────

  describe('delete', () => {
    it('removes site from index', async () => {
      const site = await registry.create('law-firm', 'Doomed Firm')
      await registry.delete(site.siteId)

      const sites = await registry.list()
      expect(sites).toHaveLength(0)
    })

    it('removes site data', async () => {
      const site = await registry.create('law-firm', 'Doomed')
      await registry.delete(site.siteId)

      const data = await adapter.get(KEYS.siteData(site.siteId))
      expect(data).toBeNull()
    })

    it('preserves audit log after deletion', async () => {
      const site = await registry.create('law-firm', 'Audited')
      await registry.delete(site.siteId)

      const audit = await adapter.get<SiteAuditEvent[]>(KEYS.auditIndex(site.siteId))
      expect(audit).not.toBeNull()
      expect(audit!.length).toBeGreaterThan(0)
    })

    it('throws for nonexistent site', async () => {
      await expect(registry.delete('nonexistent')).rejects.toThrow('Site not found')
    })
  })

  // ── Site Data ──────────────────────────────────────────

  describe('setSiteData / getSiteData', () => {
    it('writes and reads site data', async () => {
      const site = await registry.create('law-firm', 'Test Firm')

      const newData: LawFirmShowcaseData = {
        config: {
          firmName: 'Updated Firm Name',
          intakeFormEnabled: true,
          intakeFields: [{ id: '1', label: 'Name', type: 'text', required: true }],
          seo: { sitemapEnabled: true },
        },
        caseResults: [],
        attorneys: [],
        practiceAreas: [],
        testimonials: [],
        blogPosts: [],
        intakeSubmissions: [],
        visibility: 'demo',
      }

      await registry.setSiteData(site.siteId, newData)

      const retrieved = await registry.getSiteData<'law-firm'>(site.siteId)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.config.firmName).toBe('Updated Firm Name')
      expect(retrieved!.config.intakeFormEnabled).toBe(true)
    })

    it('throws when setting data for nonexistent site', async () => {
      await expect(
        registry.setSiteData('nonexistent', {} as LawFirmShowcaseData)
      ).rejects.toThrow('Site not found')
    })
  })

  // ── Audit ──────────────────────────────────────────────

  describe('audit trail', () => {
    it('records creation event', async () => {
      const site = await registry.create('law-firm', 'Test')
      const events = await registry.getAuditLog(site.siteId)

      expect(events.length).toBeGreaterThanOrEqual(1)
      const createEvent = events.find((e: SiteAuditEvent) => e.action === 'site.created')
      expect(createEvent).toBeTruthy()
      expect(createEvent!.entityId).toBe(site.siteId)
      expect(createEvent!.actor).toBe('system')
    })

    it('records update events', async () => {
      const site = await registry.create('law-firm', 'Test')
      await registry.update(site.siteId, { name: 'Renamed' }, 'admin')

      const events = await registry.getAuditLog(site.siteId)
      const updateEvent = events.find((e: SiteAuditEvent) => e.action === 'site.updated')
      expect(updateEvent).toBeTruthy()
      expect(updateEvent!.actor).toBe('admin')
    })

    it('records deletion event', async () => {
      const site = await registry.create('law-firm', 'Test')
      const siteId = site.siteId
      await registry.delete(siteId, 'admin')

      const events = await registry.getAuditLog(siteId)
      const deleteEvent = events.find((e: SiteAuditEvent) => e.action === 'site.deleted')
      expect(deleteEvent).toBeTruthy()
    })

    it('audit events have unique IDs and timestamps', async () => {
      const site = await registry.create('law-firm', 'Test')
      await registry.update(site.siteId, { name: 'Update 1' })
      await registry.update(site.siteId, { name: 'Update 2' })

      const events = await registry.getAuditLog(site.siteId)
      const ids = events.map((e: SiteAuditEvent) => e.eventId)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  // ── Isolation ──────────────────────────────────────────

  describe('site isolation', () => {
    it('creating site A does not affect site B', async () => {
      const a = await registry.create('law-firm', 'Firm A')
      const b = await registry.create('small-business', 'Shop B')

      const dataA = await registry.getSiteData<'law-firm'>(a.siteId)
      const dataB = await registry.getSiteData<'small-business'>(b.siteId)

      // Each has its own data
      expect((dataA as LawFirmShowcaseData).config.firmName).toBe('Firm A')
      expect((dataB as SMBTemplateData).config.businessName).toBe('Shop B')

      // Modifying A doesn't affect B
      const updated: LawFirmShowcaseData = {
        ...(dataA as LawFirmShowcaseData),
        config: { ...(dataA as LawFirmShowcaseData).config, firmName: 'Changed' },
      }
      await registry.setSiteData(a.siteId, updated)

      const dataB2 = await registry.getSiteData<'small-business'>(b.siteId)
      expect((dataB2 as SMBTemplateData).config.businessName).toBe('Shop B')
    })
  })
})

// ─── Migration ───────────────────────────────────────────────

describe('migrateToMultiInstance', () => {
  let adapter: MemoryAdapter

  beforeEach(() => {
    adapter = new MemoryAdapter()
  })

  it('migrates all three legacy keys', async () => {
    // Seed legacy data
    await adapter.set('law-firm-showcase', {
      config: { firmName: 'Legacy Firm', intakeFormEnabled: false, intakeFields: [], seo: { sitemapEnabled: false } },
      caseResults: [],
      attorneys: [],
      practiceAreas: [],
      testimonials: [],
      blogPosts: [],
      intakeSubmissions: [],
      visibility: 'demo',
    })
    await adapter.set('smb-template', {
      config: { businessName: 'Legacy Shop', industry: 'Retail', seo: { sitemapEnabled: false }, sections: { hero: true, services: true, about: true, team: false, testimonials: false, faq: false, contact: true, gallery: false, blog: false, promotions: false, map: false } },
      services: [],
      team: [],
      testimonials: [],
      faqs: [],
      galleryImages: [],
      promotions: [],
      blogPosts: [],
      contactSubmissions: [],
    })
    await adapter.set('agency-framework', {
      config: { defaultHourlyRate: 15000, currency: 'USD', invoicePrefix: 'INV-', proposalPrefix: 'PROP-', paymentTerms: 'Net 30' },
      projects: [],
      pipeline: [],
      invoices: [],
      proposals: [],
      timeEntries: [],
      brandingRemoved: true,
    })

    const result = await migrateToMultiInstance(adapter)

    expect(result.migrated).toBe(true)
    expect(result.sitesCreated).toBe(3)
    expect(result.siteIds).toHaveLength(3)
    expect(result.errors).toHaveLength(0)

    // Verify sites in index
    const registry = new SiteRegistry(adapter)
    const sites = await registry.list()
    expect(sites).toHaveLength(3)

    // Verify slugs from legacy keys
    const slugs = sites.map((s: SiteSummary) => s.slug)
    expect(slugs).toContain('law-firm-showcase')
    expect(slugs).toContain('smb-template')
    expect(slugs).toContain('agency-framework')

    // Verify data was copied
    const lawFirmSite = sites.find((s: SiteSummary) => s.type === 'law-firm')!
    const lawFirmData = await registry.getSiteData<'law-firm'>(lawFirmSite.siteId) as LawFirmShowcaseData
    expect(lawFirmData.config.firmName).toBe('Legacy Firm')

    // Verify status is demo
    expect(lawFirmSite.status).toBe('demo')
  })

  it('derives name from legacy config', async () => {
    await adapter.set('law-firm-showcase', {
      config: { firmName: 'Smith & Associates', intakeFormEnabled: false, intakeFields: [], seo: { sitemapEnabled: false } },
      caseResults: [],
      attorneys: [],
      practiceAreas: [],
      testimonials: [],
      blogPosts: [],
      intakeSubmissions: [],
      visibility: 'demo',
    })

    await migrateToMultiInstance(adapter)

    const registry = new SiteRegistry(adapter)
    const sites = await registry.list()
    expect(sites[0].name).toBe('Smith & Associates')
  })

  it('is idempotent — skips if already migrated', async () => {
    await adapter.set('law-firm-showcase', {
      config: { firmName: 'Test', intakeFormEnabled: false, intakeFields: [], seo: { sitemapEnabled: false } },
      caseResults: [], attorneys: [], practiceAreas: [], testimonials: [], blogPosts: [], intakeSubmissions: [], visibility: 'demo',
    })

    const first = await migrateToMultiInstance(adapter)
    expect(first.migrated).toBe(true)
    expect(first.sitesCreated).toBe(1)

    const second = await migrateToMultiInstance(adapter)
    expect(second.skipped).toBe(true)
    expect(second.sitesCreated).toBe(0)

    // Only one site exists
    const registry = new SiteRegistry(adapter)
    const sites = await registry.list()
    expect(sites).toHaveLength(1)
  })

  it('handles missing legacy keys gracefully', async () => {
    // No legacy data at all
    const result = await migrateToMultiInstance(adapter)

    expect(result.migrated).toBe(true)
    expect(result.sitesCreated).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('handles partial legacy data', async () => {
    // Only law-firm exists
    await adapter.set('law-firm-showcase', {
      config: { firmName: 'Only Firm', intakeFormEnabled: false, intakeFields: [], seo: { sitemapEnabled: false } },
      caseResults: [], attorneys: [], practiceAreas: [], testimonials: [], blogPosts: [], intakeSubmissions: [], visibility: 'demo',
    })

    const result = await migrateToMultiInstance(adapter)

    expect(result.sitesCreated).toBe(1)

    const registry = new SiteRegistry(adapter)
    const sites = await registry.list()
    expect(sites).toHaveLength(1)
    expect(sites[0].type).toBe('law-firm')
  })

  it('preserves legacy keys after migration', async () => {
    await adapter.set('law-firm-showcase', {
      config: { firmName: 'Test', intakeFormEnabled: false, intakeFields: [], seo: { sitemapEnabled: false } },
      caseResults: [], attorneys: [], practiceAreas: [], testimonials: [], blogPosts: [], intakeSubmissions: [], visibility: 'demo',
    })

    await migrateToMultiInstance(adapter)

    // Legacy key still accessible
    const legacy = await adapter.get('law-firm-showcase')
    expect(legacy).not.toBeNull()
  })

  it('isMigrated returns correct state', async () => {
    expect(await isMigrated(adapter)).toBe(false)

    await migrateToMultiInstance(adapter)
    expect(await isMigrated(adapter)).toBe(true)

    await resetMigration(adapter)
    expect(await isMigrated(adapter)).toBe(false)
  })
})
