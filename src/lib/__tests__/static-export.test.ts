/**
 * Tests for Commit 4 — Static Export + GitHub Pages Deployment
 *
 * Covers:
 *  - Single site export (exportSite)
 *  - Batch export (exportAllSites)
 *  - CNAME generation logic (shouldGenerateCNAME)
 *  - SHA-256 hashing (sha256)
 *  - Validation gating (invalid sites produce no artifacts)
 *  - Artifact structure and content
 */

import { describe, it, expect } from 'vitest'
import {
  exportSite,
  exportAllSites,
  shouldGenerateCNAME,
  sha256,
} from '@/lib/static-export'
import { normalizeLawFirm, normalizeSMB, normalizeAgency } from '@/lib/site-normalize'
import type {
  SiteSummary,
  LawFirmShowcaseData,
  SMBTemplateData,
  AgencyFrameworkData,
  LawFirmSiteData,
  NormalizedSiteData,
} from '@/lib/types'

// ─── Fixtures ────────────────────────────────────────────────

const NOW = '2026-01-15T00:00:00.000Z'

const SUMMARY_LAW: SiteSummary = {
  siteId: 'law-001',
  type: 'law-firm',
  name: 'Smith & Associates',
  slug: 'smith-associates',
  status: 'public',
  createdAt: NOW,
  updatedAt: NOW,
}

const SUMMARY_SMB: SiteSummary = {
  siteId: 'smb-001',
  type: 'small-business',
  name: 'Main Street Bakery',
  slug: 'main-street-bakery',
  status: 'public',
  createdAt: NOW,
  updatedAt: NOW,
}

const SUMMARY_AGENCY: SiteSummary = {
  siteId: 'agency-001',
  type: 'agency',
  name: 'Pixel Studio',
  slug: 'pixel-studio',
  status: 'demo',
  createdAt: NOW,
  updatedAt: NOW,
}

const LEGACY_LAW_FIRM: LawFirmShowcaseData = {
  config: {
    firmName: 'Smith & Associates',
    primaryColor: '#1a365d',
    accentColor: '#c7a44a',
    phone: '555-0100',
    email: 'info@smith.law',
    intakeFormEnabled: true,
    intakeFields: [{ id: 'name', label: 'Name', type: 'text', required: true }],
    seo: { sitemapEnabled: false, globalTitle: 'Smith & Associates | Attorneys' },
  },
  caseResults: [],
  attorneys: [
    {
      id: 'a1', name: 'John Smith', title: 'Partner', jurisdictions: ['TX'],
      practiceAreas: ['Criminal Defense'], education: [], bio: 'Experienced attorney.',
      featured: true, order: 1,
    },
  ],
  practiceAreas: [
    { id: 'pa1', name: 'Criminal Defense', slug: 'criminal-defense', description: 'Full defense.', keyPoints: ['DUI', 'Felony'], order: 1 },
  ],
  testimonials: [],
  blogPosts: [],
  intakeSubmissions: [],
  visibility: 'demo',
}

const LEGACY_SMB: SMBTemplateData = {
  config: {
    businessName: 'Main Street Bakery',
    industry: 'Food',
    primaryColor: '#2563eb',
    accentColor: '#f59e0b',
    phone: '555-0200',
    email: 'hello@bakery.com',
    seo: { sitemapEnabled: false, siteTitle: 'Main Street Bakery' },
    sections: {
      hero: true, services: true, about: true, team: false, testimonials: false,
      faq: false, contact: true, gallery: false, blog: false, promotions: false, map: false,
    },
  },
  services: [
    { id: 's1', name: 'Custom Cakes', description: 'Made to order.', featured: true, order: 1 },
  ],
  team: [],
  testimonials: [],
  faqs: [],
  galleryImages: [],
  promotions: [],
  blogPosts: [],
  contactSubmissions: [],
}

const LEGACY_AGENCY: AgencyFrameworkData = {
  config: {
    agencyName: 'Pixel Studio',
    defaultHourlyRate: 15000,
    currency: 'USD',
    invoicePrefix: 'INV-',
    proposalPrefix: 'PROP-',
    paymentTerms: 'Net 30',
  },
  projects: [
    {
      id: 'p1', clientName: 'Acme Corp', projectName: 'Acme Website',
      templateType: 'small-business', status: 'launched', startDate: NOW,
      budget: 500000, hoursEstimated: 40, hoursUsed: 35, deliverables: ['Website', 'Logo'],
    },
  ],
  pipeline: [],
  invoices: [],
  proposals: [],
  timeEntries: [],
  brandingRemoved: true,
}

// Build normalized fixtures
function makeLawFirm(): LawFirmSiteData {
  return normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
}

function makeSMB() {
  return normalizeSMB(LEGACY_SMB, SUMMARY_SMB)
}

function makeAgency() {
  return normalizeAgency(LEGACY_AGENCY, SUMMARY_AGENCY)
}

// ─── sha256 ──────────────────────────────────────────────────

describe('sha256', () => {
  it('produces 64-char hex hash', async () => {
    const hash = await sha256('hello')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('is deterministic', async () => {
    const a = await sha256('deterministic test')
    const b = await sha256('deterministic test')
    expect(a).toBe(b)
  })

  it('produces different hashes for different inputs', async () => {
    const a = await sha256('input-a')
    const b = await sha256('input-b')
    expect(a).not.toBe(b)
  })
})

// ─── exportSite ──────────────────────────────────────────────

describe('exportSite', () => {
  it('exports a valid law firm site', async () => {
    const data = makeLawFirm()
    const result = await exportSite(data)

    expect(result.success).toBe(true)
    expect(result.validation.isValid).toBe(true)
    expect(result.artifacts).toHaveLength(2)
    expect(result.htmlHash).toHaveLength(64)
  })

  it('produces index.html and site.json artifacts', async () => {
    const data = makeLawFirm()
    const result = await exportSite(data)

    const paths = result.artifacts.map(a => a.path)
    expect(paths).toContain('sites/smith-associates/index.html')
    expect(paths).toContain('sites/smith-associates/site.json')
  })

  it('includes valid HTML in index.html artifact', async () => {
    const data = makeLawFirm()
    const result = await exportSite(data)

    const html = result.artifacts.find(a => a.path.endsWith('index.html'))!
    expect(html.content).toContain('<!DOCTYPE html>')
    expect(html.content).toContain('Smith &amp; Associates')
    expect(html.content).toContain('<meta charset="utf-8" />')
  })

  it('includes site snapshot in site.json artifact', async () => {
    const data = makeLawFirm()
    const result = await exportSite(data)

    const json = result.artifacts.find(a => a.path.endsWith('site.json'))!
    const snapshot = JSON.parse(json.content)
    expect(snapshot.siteId).toBe('law-001')
    expect(snapshot.slug).toBe('smith-associates')
    expect(snapshot.type).toBe('law-firm')
    expect(snapshot.data).toBeDefined()
    expect(snapshot.exportedAt).toBeDefined()
  })

  it('adds canonical URL when baseUrl is provided', async () => {
    const data = makeLawFirm()
    const result = await exportSite(data, { baseUrl: 'https://devon-tyler.com' })

    const html = result.artifacts.find(a => a.path.endsWith('index.html'))!
    expect(html.content).toContain('rel="canonical"')
    expect(html.content).toContain('https://devon-tyler.com/s/smith-associates')
  })

  it('respects custom outputPrefix', async () => {
    const data = makeLawFirm()
    const result = await exportSite(data, { outputPrefix: 'public/sites' })

    const paths = result.artifacts.map(a => a.path)
    expect(paths).toContain('public/sites/smith-associates/index.html')
    expect(paths).toContain('public/sites/smith-associates/site.json')
  })

  it('rejects sites that fail validation', async () => {
    const data = makeLawFirm()
    // Remove all attorneys — required for law firm
    data.attorneys = []
    const result = await exportSite(data)

    expect(result.success).toBe(false)
    expect(result.validation.isValid).toBe(false)
    expect(result.artifacts).toHaveLength(0)
    expect(result.htmlHash).toBe('')
  })

  it('rejects sites missing SEO title', async () => {
    const data = makeLawFirm()
    data.seo.title = ''
    const result = await exportSite(data)

    expect(result.success).toBe(false)
    expect(result.validation.errors).toContain('SEO title is required.')
  })

  it('exports SMB sites correctly', async () => {
    const data = makeSMB()
    const result = await exportSite(data)

    expect(result.success).toBe(true)
    const html = result.artifacts.find(a => a.path.endsWith('index.html'))!
    expect(html.content).toContain('Main Street Bakery')
  })

  it('exports Agency sites correctly', async () => {
    const data = makeAgency()
    const result = await exportSite(data)

    expect(result.success).toBe(true)
    const html = result.artifacts.find(a => a.path.endsWith('index.html'))!
    expect(html.content).toContain('Pixel Studio')
  })

  it('produces deterministic hash for same input', async () => {
    const data = makeLawFirm()
    const r1 = await exportSite(data)
    const r2 = await exportSite(data)

    expect(r1.htmlHash).toBe(r2.htmlHash)
  })
})

// ─── shouldGenerateCNAME ─────────────────────────────────────

describe('shouldGenerateCNAME', () => {
  it('returns true for the first public site with a domain', () => {
    const data = makeLawFirm()
    data.domain = 'smith-law.com'
    const sites: SiteSummary[] = [
      { ...SUMMARY_LAW, domain: 'smith-law.com', status: 'public' },
    ]
    expect(shouldGenerateCNAME(data, sites)).toBe(true)
  })

  it('returns false when site has no domain', () => {
    const data = makeLawFirm()
    data.domain = undefined
    expect(shouldGenerateCNAME(data, [SUMMARY_LAW])).toBe(false)
  })

  it('returns false when site is not the first public domain site', () => {
    const data = makeSMB()
    data.domain = 'bakery.com'
    const earlier: SiteSummary = {
      ...SUMMARY_LAW,
      domain: 'smith-law.com',
      status: 'public',
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    const later: SiteSummary = {
      ...SUMMARY_SMB,
      domain: 'bakery.com',
      status: 'public',
      createdAt: '2026-06-01T00:00:00.000Z',
    }
    expect(shouldGenerateCNAME(data, [earlier, later])).toBe(false)
  })

  it('returns false when site is not public', () => {
    const data = makeLawFirm()
    data.domain = 'smith-law.com'
    const sites: SiteSummary[] = [
      { ...SUMMARY_LAW, domain: 'smith-law.com', status: 'draft' },
    ]
    expect(shouldGenerateCNAME(data, sites)).toBe(false)
  })
})

// ─── exportAllSites ──────────────────────────────────────────

describe('exportAllSites', () => {
  it('exports only public and demo sites', async () => {
    const lawData = makeLawFirm()
    const smbData = makeSMB()
    const agencyData = makeAgency()

    const dataMap: Record<string, NormalizedSiteData> = {
      'law-001': lawData,
      'smb-001': smbData,
      'agency-001': agencyData,
    }

    // Law: public, SMB: public, Agency: demo
    const sites: SiteSummary[] = [
      { ...SUMMARY_LAW, status: 'public' },
      { ...SUMMARY_SMB, status: 'public' },
      { ...SUMMARY_AGENCY, status: 'demo' },
    ]

    const result = await exportAllSites(
      sites,
      async (id) => dataMap[id] ?? null,
    )

    expect(result.successCount).toBe(3)
    expect(result.failedCount).toBe(0)
    expect(result.totalArtifacts).toBe(6) // 2 per site × 3 sites
  })

  it('skips draft and private sites', async () => {
    const lawData = makeLawFirm()

    const sites: SiteSummary[] = [
      { ...SUMMARY_LAW, status: 'draft' },
      { ...SUMMARY_SMB, status: 'private' as any },
    ]

    const result = await exportAllSites(
      sites,
      async () => lawData,
    )

    expect(result.successCount).toBe(0)
    expect(result.totalArtifacts).toBe(0)
  })

  it('records failure when site data is missing', async () => {
    const sites: SiteSummary[] = [
      { ...SUMMARY_LAW, status: 'public' },
    ]

    const result = await exportAllSites(
      sites,
      async () => null,
    )

    expect(result.failedCount).toBe(1)
    expect(result.results['law-001'].success).toBe(false)
    expect(result.results['law-001'].validation.errors).toContain('Site data not found.')
  })

  it('detects CNAME from first public domain site', async () => {
    const lawData = makeLawFirm()
    lawData.domain = 'smith-law.com'

    const sites: SiteSummary[] = [
      { ...SUMMARY_LAW, status: 'public', domain: 'smith-law.com' },
    ]

    const result = await exportAllSites(
      sites,
      async () => lawData,
    )

    expect(result.cname).toBe('smith-law.com')
  })

  it('returns null CNAME when no domain sites exist', async () => {
    const smbData = makeSMB()

    const sites: SiteSummary[] = [
      { ...SUMMARY_SMB, status: 'public' },
    ]

    const result = await exportAllSites(
      sites,
      async () => smbData,
    )

    expect(result.cname).toBeNull()
  })
})
