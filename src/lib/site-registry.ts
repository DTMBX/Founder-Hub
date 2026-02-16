/**
 * Site Registry
 *
 * Multi-tenant site management service.
 * Manages SiteSummary records in `sites:index` and per-site data
 * in `sites:{siteId}:data`.
 *
 * All mutations are auditable via the append-only audit log.
 */

import type {
  SiteSummary,
  SiteType,
  SiteData,
  SiteDataMap,
  SiteAuditEvent,
  LawFirmShowcaseData,
  LawFirmConfig,
  LawFirmSEOConfig,
  SMBTemplateData,
  SMBTemplateConfig,
  SMBSEOConfig,
  AgencyFrameworkData,
  AgencyConfig,
  NormalizedSiteData,
} from '@/lib/types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'
import { normalizeSiteData } from '@/lib/site-normalize'

// ─── Key Helpers ─────────────────────────────────────────────

export const KEYS = {
  SITES_INDEX: 'sites:index',
  SITES_MIGRATED: 'sites:migrated',
  siteData: (siteId: string) => `sites:${siteId}:data`,
  contractsIndex: (siteId: string) => `sites:${siteId}:contracts:index`,
  contract: (siteId: string, docId: string) => `sites:${siteId}:contracts:${docId}`,
  exportsIndex: (siteId: string) => `sites:${siteId}:exports:index`,
  exportRecord: (siteId: string, exportId: string) => `sites:${siteId}:exports:${exportId}`,
  auditIndex: (siteId: string) => `sites:${siteId}:audit:index`,
} as const

// ─── Slug Utilities ──────────────────────────────────────────

/**
 * Convert a name to a URL-safe slug.
 * Deterministic: same input always produces same output.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Ensure slug uniqueness by appending a numeric suffix if needed.
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) return slug
  let i = 2
  while (existingSlugs.includes(`${slug}-${i}`)) i++
  return `${slug}-${i}`
}

// ─── Empty Site Data Factories ───────────────────────────────

function createEmptyLawFirmData(name: string): LawFirmShowcaseData {
  const config: LawFirmConfig = {
    firmName: name,
    intakeFormEnabled: false,
    intakeFields: [],
    seo: {
      sitemapEnabled: false,
    } as LawFirmSEOConfig,
  }
  return {
    config,
    caseResults: [],
    attorneys: [],
    practiceAreas: [],
    testimonials: [],
    blogPosts: [],
    intakeSubmissions: [],
    visibility: 'demo',
  }
}

function createEmptySMBData(name: string): SMBTemplateData {
  const config: SMBTemplateConfig = {
    businessName: name,
    industry: '',
    seo: {
      sitemapEnabled: false,
    } as SMBSEOConfig,
    sections: {
      hero: true,
      services: true,
      about: true,
      team: false,
      testimonials: false,
      faq: false,
      contact: true,
      gallery: false,
      blog: false,
      promotions: false,
      map: false,
    },
  }
  return {
    config,
    services: [],
    team: [],
    testimonials: [],
    faqs: [],
    galleryImages: [],
    promotions: [],
    blogPosts: [],
    contactSubmissions: [],
  }
}

function createEmptyAgencyData(name: string): AgencyFrameworkData {
  const config: AgencyConfig = {
    agencyName: name,
    defaultHourlyRate: 15000,
    currency: 'USD',
    invoicePrefix: 'INV-',
    proposalPrefix: 'PROP-',
    paymentTerms: 'Net 30',
  }
  return {
    config,
    projects: [],
    pipeline: [],
    invoices: [],
    proposals: [],
    timeEntries: [],
    brandingRemoved: true,
  }
}

/**
 * Create an empty site data payload matching the given type.
 */
export function createEmptySiteData(type: SiteType, name: string): SiteData {
  switch (type) {
    case 'law-firm':
      return createEmptyLawFirmData(name)
    case 'small-business':
      return createEmptySMBData(name)
    case 'agency':
      return createEmptyAgencyData(name)
  }
}

// ─── SiteRegistry ────────────────────────────────────────────

export class SiteRegistry {
  constructor(private adapter: StorageAdapter) {}

  // ── Read Operations ──────────────────────────────────────

  /** List all registered sites. */
  async list(): Promise<SiteSummary[]> {
    return (await this.adapter.get<SiteSummary[]>(KEYS.SITES_INDEX)) ?? []
  }

  /** Get a single site by ID. Returns null if not found. */
  async get(siteId: string): Promise<SiteSummary | null> {
    const sites = await this.list()
    return sites.find((s) => s.siteId === siteId) ?? null
  }

  /** Find a site by its slug. Returns null if not found. */
  async findBySlug(slug: string): Promise<SiteSummary | null> {
    const sites = await this.list()
    return sites.find((s) => s.slug === slug) ?? null
  }

  /** Get the full data payload for a site. */
  async getSiteData<T extends SiteType>(siteId: string): Promise<SiteDataMap[T] | null> {
    return this.adapter.get<SiteDataMap[T]>(KEYS.siteData(siteId))
  }

  /**
   * Get fully normalized site data with SiteCore fields.
   * Reads raw data, applies normalization, returns NormalizedSiteData.
   * Returns null if site or data not found.
   */
  async getNormalizedSiteData(siteId: string): Promise<NormalizedSiteData | null> {
    const summary = await this.get(siteId)
    if (!summary) return null
    const raw = await this.adapter.get<SiteData>(KEYS.siteData(siteId))
    if (!raw) return null
    return normalizeSiteData(raw, summary)
  }

  // ── Write Operations ─────────────────────────────────────

  /**
   * Create a new site with empty data.
   * Generates a unique slug from the name.
   * Returns the created SiteSummary.
   */
  async create(
    type: SiteType,
    name: string,
    slugOverride?: string,
    actor: string = 'system',
  ): Promise<SiteSummary> {
    const sites = await this.list()
    const existingSlugs = sites.map((s) => s.slug)

    const baseSlug = slugOverride ? generateSlug(slugOverride) : generateSlug(name)
    const slug = ensureUniqueSlug(baseSlug, existingSlugs)

    const siteId = crypto.randomUUID()
    const now = new Date().toISOString()

    const summary: SiteSummary = {
      siteId,
      type,
      name,
      slug,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }

    // Write empty site data
    const emptyData = createEmptySiteData(type, name)
    await this.adapter.set(KEYS.siteData(siteId), emptyData)

    // Initialize empty sub-indexes
    await this.adapter.set(KEYS.contractsIndex(siteId), [])
    await this.adapter.set(KEYS.exportsIndex(siteId), [])
    await this.adapter.set(KEYS.auditIndex(siteId), [])

    // Add to index
    sites.push(summary)
    await this.adapter.set(KEYS.SITES_INDEX, sites)

    // Audit
    await this.appendAudit(siteId, {
      actor,
      action: 'site.created',
      entityType: 'site',
      entityId: siteId,
      details: { type, name, slug },
    })

    return summary
  }

  /**
   * Update mutable fields on a SiteSummary.
   * Allowed updates: name, slug, status, domain.
   */
  async update(
    siteId: string,
    updates: Partial<Pick<SiteSummary, 'name' | 'slug' | 'status' | 'domain'>>,
    actor: string = 'system',
  ): Promise<SiteSummary> {
    const sites = await this.list()
    const idx = sites.findIndex((s) => s.siteId === siteId)
    if (idx === -1) throw new Error(`Site not found: ${siteId}`)

    // If slug is being changed, validate uniqueness
    if (updates.slug) {
      const newSlug = generateSlug(updates.slug)
      const existingSlugs = sites.filter((s) => s.siteId !== siteId).map((s) => s.slug)
      if (existingSlugs.includes(newSlug)) {
        throw new Error(`Slug already in use: ${newSlug}`)
      }
      updates.slug = newSlug
    }

    const updated: SiteSummary = {
      ...sites[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    sites[idx] = updated
    await this.adapter.set(KEYS.SITES_INDEX, sites)

    await this.appendAudit(siteId, {
      actor,
      action: 'site.updated',
      entityType: 'site',
      entityId: siteId,
      details: updates,
    })

    return updated
  }

  /**
   * Update the full data payload for a site.
   */
  async setSiteData(siteId: string, data: SiteData, actor: string = 'system'): Promise<void> {
    // Verify site exists
    const summary = await this.get(siteId)
    if (!summary) throw new Error(`Site not found: ${siteId}`)

    await this.adapter.set(KEYS.siteData(siteId), data)

    // Touch updatedAt on the summary
    await this.update(siteId, {}, actor)

    await this.appendAudit(siteId, {
      actor,
      action: 'site.data.updated',
      entityType: 'site-data',
      entityId: siteId,
    })
  }

  /**
   * Delete a site and all associated data.
   * Removes: summary from index, site data, contracts, exports, audit log.
   */
  async delete(siteId: string, actor: string = 'system'): Promise<void> {
    const sites = await this.list()
    const idx = sites.findIndex((s) => s.siteId === siteId)
    if (idx === -1) throw new Error(`Site not found: ${siteId}`)

    const removed = sites[idx]

    // Remove sub-resources
    await this.adapter.del(KEYS.siteData(siteId))
    await this.adapter.del(KEYS.contractsIndex(siteId))
    await this.adapter.del(KEYS.exportsIndex(siteId))
    // Note: audit log is intentionally preserved for compliance
    // await this.adapter.del(KEYS.auditIndex(siteId))

    // Remove from index
    sites.splice(idx, 1)
    await this.adapter.set(KEYS.SITES_INDEX, sites)

    // Log deletion to a separate global audit (since site audit may be orphaned)
    await this.appendAudit(siteId, {
      actor,
      action: 'site.deleted',
      entityType: 'site',
      entityId: siteId,
      details: { name: removed.name, type: removed.type, slug: removed.slug },
    })
  }

  // ── Audit ────────────────────────────────────────────────

  /** Append an audit event (append-only, never overwrite). */
  async appendAudit(
    siteId: string,
    event: Omit<SiteAuditEvent, 'eventId' | 'at'>,
  ): Promise<SiteAuditEvent> {
    const events = (await this.adapter.get<SiteAuditEvent[]>(KEYS.auditIndex(siteId))) ?? []

    const full: SiteAuditEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      at: new Date().toISOString(),
    }

    events.push(full)
    await this.adapter.set(KEYS.auditIndex(siteId), events)
    return full
  }

  /** Read audit log for a site. */
  async getAuditLog(siteId: string): Promise<SiteAuditEvent[]> {
    return (await this.adapter.get<SiteAuditEvent[]>(KEYS.auditIndex(siteId))) ?? []
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _registryInstance: SiteRegistry | null = null

/**
 * Get the global SiteRegistry instance.
 * Uses the default StorageAdapter (KVAdapter in demo mode).
 */
export function getSiteRegistry(adapter?: StorageAdapter): SiteRegistry {
  if (adapter) {
    _registryInstance = new SiteRegistry(adapter)
    return _registryInstance
  }
  if (!_registryInstance) {
    _registryInstance = new SiteRegistry(createStorageAdapter())
  }
  return _registryInstance
}
