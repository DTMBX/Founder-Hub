/**
 * Tests for Commit 3.5 — Foundation Reinforcements
 *
 * Covers:
 *  - SiteCore normalization
 *  - Deploy readiness validation
 *  - Static HTML rendering (determinism, no storage calls)
 */

import { describe, it, expect } from 'vitest'
import { normalizeLawFirm, normalizeSMB, normalizeAgency, normalizeSiteData, isNormalized } from '@/lib/site-normalize'
import { validateSiteReadyForDeploy } from '@/lib/site-validation'
import { renderSiteToStaticHtml, escapeHtml } from '@/lib/static-renderer'
import type {
  SiteSummary,
  LawFirmShowcaseData,
  SMBTemplateData,
  AgencyFrameworkData,
  LawFirmSiteData,
  SMBSiteData,
  AgencySiteData,
} from '@/lib/types'

// ─── Fixtures ────────────────────────────────────────────────

const NOW = '2026-01-15T00:00:00.000Z'

const SUMMARY_LAW: SiteSummary = {
  siteId: 'law-001',
  type: 'law-firm',
  name: 'Smith & Associates',
  slug: 'smith-associates',
  status: 'demo',
  createdAt: NOW,
  updatedAt: NOW,
}

const SUMMARY_SMB: SiteSummary = {
  siteId: 'smb-001',
  type: 'small-business',
  name: 'Main Street Bakery',
  slug: 'main-street-bakery',
  status: 'demo',
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

// ─── Normalization Tests ─────────────────────────────────────

describe('normalizeLawFirm', () => {
  it('extracts branding from config', () => {
    const result = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    expect(result.branding.primaryColor).toBe('#1a365d')
    expect(result.branding.secondaryColor).toBe('#c7a44a')
    expect(result.siteId).toBe('law-001')
    expect(result.type).toBe('law-firm')
  })

  it('extracts SEO from config', () => {
    const result = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    expect(result.seo.title).toBe('Smith & Associates | Attorneys')
  })

  it('preserves all content arrays', () => {
    const result = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    expect(result.attorneys).toHaveLength(1)
    expect(result.practiceAreas).toHaveLength(1)
    expect(result.config).toEqual(LEGACY_LAW_FIRM.config)
  })
})

describe('normalizeSMB', () => {
  it('extracts branding from config', () => {
    const result = normalizeSMB(LEGACY_SMB, SUMMARY_SMB)
    expect(result.branding.primaryColor).toBe('#2563eb')
    expect(result.type).toBe('small-business')
  })

  it('extracts SEO from config', () => {
    const result = normalizeSMB(LEGACY_SMB, SUMMARY_SMB)
    expect(result.seo.title).toBe('Main Street Bakery')
  })
})

describe('normalizeAgency', () => {
  it('extracts name from config', () => {
    const result = normalizeAgency(LEGACY_AGENCY, SUMMARY_AGENCY)
    expect(result.seo.title).toBe('Pixel Studio')
    expect(result.type).toBe('agency')
  })

  it('defaults primary color to dark', () => {
    const result = normalizeAgency(LEGACY_AGENCY, SUMMARY_AGENCY)
    expect(result.branding.primaryColor).toBe('#111827')
  })
})

describe('normalizeSiteData', () => {
  it('normalizes law firm data by type', () => {
    const result = normalizeSiteData(LEGACY_LAW_FIRM, SUMMARY_LAW)
    expect(result.type).toBe('law-firm')
    expect(result.siteId).toBe('law-001')
  })

  it('normalizes SMB data by type', () => {
    const result = normalizeSiteData(LEGACY_SMB, SUMMARY_SMB)
    expect(result.type).toBe('small-business')
  })

  it('normalizes agency data by type', () => {
    const result = normalizeSiteData(LEGACY_AGENCY, SUMMARY_AGENCY)
    expect(result.type).toBe('agency')
  })

  it('passes through already-normalized data', () => {
    const normalized = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const result = normalizeSiteData(normalized, SUMMARY_LAW)
    expect(result.siteId).toBe('law-001')
    expect(isNormalized(result)).toBe(true)
  })
})

describe('isNormalized', () => {
  it('returns false for legacy data', () => {
    expect(isNormalized(LEGACY_LAW_FIRM)).toBe(false)
    expect(isNormalized(LEGACY_SMB)).toBe(false)
    expect(isNormalized(LEGACY_AGENCY)).toBe(false)
  })

  it('returns true for normalized data', () => {
    const n = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    expect(isNormalized(n)).toBe(true)
  })
})

// ─── Validation Tests ────────────────────────────────────────

describe('validateSiteReadyForDeploy', () => {
  describe('common rules', () => {
    it('fails when name is empty', () => {
      const data = normalizeLawFirm(LEGACY_LAW_FIRM, { ...SUMMARY_LAW, name: '' })
      data.name = ''
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Site name is required.')
    })

    it('fails when primaryColor is empty', () => {
      const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
      data.branding.primaryColor = ''
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Primary brand color is required.')
    })
  })

  describe('law firm rules', () => {
    it('passes with full valid data', () => {
      const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('fails without practice areas', () => {
      const legacy = { ...LEGACY_LAW_FIRM, practiceAreas: [] }
      const data = normalizeLawFirm(legacy, SUMMARY_LAW)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one practice area is required.')
    })

    it('fails without attorneys', () => {
      const legacy = { ...LEGACY_LAW_FIRM, attorneys: [] }
      const data = normalizeLawFirm(legacy, SUMMARY_LAW)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one attorney profile is required.')
    })

    it('fails without contact method', () => {
      const legacy = {
        ...LEGACY_LAW_FIRM,
        config: { ...LEGACY_LAW_FIRM.config, phone: undefined, email: undefined, intakeFormEnabled: false },
      }
      const data = normalizeLawFirm(legacy, SUMMARY_LAW)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one contact method is required (phone, email, or intake form).')
    })
  })

  describe('SMB rules', () => {
    it('passes with full valid data', () => {
      const data = normalizeSMB(LEGACY_SMB, SUMMARY_SMB)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(true)
    })

    it('fails without services', () => {
      const legacy = { ...LEGACY_SMB, services: [] }
      const data = normalizeSMB(legacy, SUMMARY_SMB)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one service is required.')
    })

    it('fails without contact method', () => {
      const legacy = {
        ...LEGACY_SMB,
        config: { ...LEGACY_SMB.config, phone: undefined, email: undefined },
      }
      const data = normalizeSMB(legacy, SUMMARY_SMB)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one contact method is required (phone or email).')
    })
  })

  describe('agency rules', () => {
    it('passes with launched project', () => {
      const data = normalizeAgency(LEGACY_AGENCY, SUMMARY_AGENCY)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(true)
    })

    it('fails without launched projects', () => {
      const legacy = { ...LEGACY_AGENCY, projects: [] }
      const data = normalizeAgency(legacy, SUMMARY_AGENCY)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one launched project is required.')
    })

    it('fails when projects exist but none launched', () => {
      const legacy = {
        ...LEGACY_AGENCY,
        projects: [{
          ...LEGACY_AGENCY.projects[0],
          status: 'development' as const,
        }],
      }
      const data = normalizeAgency(legacy, SUMMARY_AGENCY)
      const result = validateSiteReadyForDeploy(data)
      expect(result.isValid).toBe(false)
    })
  })
})

// ─── Static Renderer Tests ───────────────────────────────────

describe('renderSiteToStaticHtml', () => {
  it('produces valid HTML with DOCTYPE', () => {
    const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const html = renderSiteToStaticHtml(data)
    expect(html).toMatch(/^<!DOCTYPE html>/)
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('</html>')
  })

  it('includes SEO meta tags', () => {
    const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const html = renderSiteToStaticHtml(data)
    expect(html).toContain('<title>Smith &amp; Associates | Attorneys</title>')
    expect(html).toContain('og:title')
  })

  it('includes canonical URL when provided', () => {
    const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const html = renderSiteToStaticHtml(data, { canonicalUrl: 'https://smith.law/' })
    expect(html).toContain('rel="canonical"')
    expect(html).toContain('https://smith.law/')
  })

  it('embeds serialized siteData snapshot', () => {
    const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const html = renderSiteToStaticHtml(data)
    expect(html).toContain('id="site-data"')
    // Verify JSON is parseable
    const match = html.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/)
    expect(match).not.toBeNull()
    const parsed = JSON.parse(match![1])
    expect(parsed.siteId).toBe('law-001')
    expect(parsed.type).toBe('law-firm')
  })

  it('is deterministic — same input produces same output', () => {
    const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const html1 = renderSiteToStaticHtml(data)
    const html2 = renderSiteToStaticHtml(data)
    expect(html1).toBe(html2)
  })

  it('renders SMB site body', () => {
    const data = normalizeSMB(LEGACY_SMB, SUMMARY_SMB)
    const html = renderSiteToStaticHtml(data)
    expect(html).toContain('Main Street Bakery')
    expect(html).toContain('Custom Cakes')
  })

  it('renders agency site body', () => {
    const data = normalizeAgency(LEGACY_AGENCY, SUMMARY_AGENCY)
    const html = renderSiteToStaticHtml(data)
    expect(html).toContain('Pixel Studio')
    expect(html).toContain('Acme Website')
  })

  it('escapes HTML entities in content', () => {
    const customLaw = {
      ...LEGACY_LAW_FIRM,
      config: { ...LEGACY_LAW_FIRM.config, firmName: 'O\'Brien & <Sons>' },
    }
    const data = normalizeLawFirm(customLaw, { ...SUMMARY_LAW, name: 'O\'Brien & <Sons>' })
    const html = renderSiteToStaticHtml(data)
    // Body HTML should have escaped entities
    expect(html).toContain('O&#39;Brien &amp; &lt;Sons&gt;')
    // No raw <Sons> in body (JSON uses \u003c escape)
    const bodySection = html.split('<script')[0]
    expect(bodySection).not.toContain('<Sons>')
  })

  it('does not contain useKV, localStorage, or window.location references', () => {
    const data = normalizeLawFirm(LEGACY_LAW_FIRM, SUMMARY_LAW)
    const html = renderSiteToStaticHtml(data)
    expect(html).not.toContain('useKV')
    expect(html).not.toContain('localStorage')
    expect(html).not.toContain('window.location')
  })
})

describe('escapeHtml', () => {
  it('escapes all HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("O'Brien")).toBe('O&#39;Brien')
  })
})
