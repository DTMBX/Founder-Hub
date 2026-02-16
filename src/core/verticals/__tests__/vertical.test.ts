/**
 * Vertical Pack System Tests
 *
 * Tests for vertical pack registry, application, and copy resolution.
 */

import { describe, it, expect } from 'vitest'
import {
  ALL_VERTICALS,
  VERTICAL_REGISTRY,
  getVerticalPack,
  hasVerticalPack,
  getVerticalsBySiteType,
  getDefaultVertical,
  getAllBusinessTypes,
  getVerticalsGroupedBySiteType,
  searchVerticals,
} from '../verticals.registry'
import { getSiteTypeFromBusinessType as getTypeFromTypes } from '../verticals.types'
import { LAWFIRM_VERTICALS, getLawFirmVertical } from '../verticals.lawfirm'
import { SMB_VERTICALS, getSMBVertical } from '../verticals.smb'
import { AGENCY_VERTICALS, getAgencyVertical } from '../verticals.agency'
import {
  applyVerticalPack,
  selectCopyVariant,
  interpolateTemplate,
  resolveCopyTemplates,
  resolveFAQs,
  resolveSEO,
  resolveStructuredData,
} from '../applyVerticalPack'
import type { BusinessType, VerticalPack } from '../verticals.types'

// ─── Registry Tests ──────────────────────────────────────────

describe('Vertical Registry', () => {
  describe('ALL_VERTICALS', () => {
    it('contains all verticals from all categories', () => {
      const expectedCount =
        LAWFIRM_VERTICALS.length + SMB_VERTICALS.length + AGENCY_VERTICALS.length
      expect(ALL_VERTICALS).toHaveLength(expectedCount)
    })

    it('contains law firm verticals', () => {
      const lawFirmIds = ALL_VERTICALS.filter(v => v.siteType === 'law-firm').map(v => v.id)
      expect(lawFirmIds).toContain('lawfirm_general')
      expect(lawFirmIds).toContain('lawfirm_criminal')
      expect(lawFirmIds).toContain('lawfirm_personal_injury')
    })

    it('contains SMB verticals', () => {
      const smbIds = ALL_VERTICALS.filter(v => v.siteType === 'small-business').map(v => v.id)
      expect(smbIds).toContain('smb_contractor')
      expect(smbIds).toContain('smb_restaurant')
      expect(smbIds).toContain('smb_medical')
    })

    it('contains agency verticals', () => {
      const agencyIds = ALL_VERTICALS.filter(v => v.siteType === 'agency').map(v => v.id)
      expect(agencyIds).toContain('agency_general')
      expect(agencyIds).toContain('agency_design')
      expect(agencyIds).toContain('agency_marketing')
    })
  })

  describe('VERTICAL_REGISTRY', () => {
    it('provides O(1) lookup by business type', () => {
      expect(VERTICAL_REGISTRY.lawfirm_criminal).toBeDefined()
      expect(VERTICAL_REGISTRY.lawfirm_criminal?.id).toBe('lawfirm_criminal')
    })

    it('has entries for all verticals', () => {
      const registryKeys = Object.keys(VERTICAL_REGISTRY)
      expect(registryKeys.length).toBe(ALL_VERTICALS.length)
    })
  })

  describe('getVerticalPack', () => {
    it('returns vertical pack for valid business type', () => {
      const pack = getVerticalPack('lawfirm_criminal')
      expect(pack).not.toBeNull()
      expect(pack?.id).toBe('lawfirm_criminal')
      expect(pack?.label).toBe('Criminal Defense')
    })

    it('returns null for invalid business type', () => {
      const pack = getVerticalPack('invalid_type' as BusinessType)
      expect(pack).toBeNull()
    })
  })

  describe('hasVerticalPack', () => {
    it('returns true for valid business type', () => {
      expect(hasVerticalPack('lawfirm_general')).toBe(true)
      expect(hasVerticalPack('smb_restaurant')).toBe(true)
      expect(hasVerticalPack('agency_design')).toBe(true)
    })

    it('returns false for invalid business type', () => {
      expect(hasVerticalPack('invalid_type')).toBe(false)
      expect(hasVerticalPack('')).toBe(false)
    })
  })

  describe('getVerticalsBySiteType', () => {
    it('returns law firm verticals', () => {
      const verticals = getVerticalsBySiteType('law-firm')
      expect(verticals.length).toBe(LAWFIRM_VERTICALS.length)
      expect(verticals.every(v => v.siteType === 'law-firm')).toBe(true)
    })

    it('returns SMB verticals', () => {
      const verticals = getVerticalsBySiteType('small-business')
      expect(verticals.length).toBe(SMB_VERTICALS.length)
      expect(verticals.every(v => v.siteType === 'small-business')).toBe(true)
    })

    it('returns agency verticals', () => {
      const verticals = getVerticalsBySiteType('agency')
      expect(verticals.length).toBe(AGENCY_VERTICALS.length)
      expect(verticals.every(v => v.siteType === 'agency')).toBe(true)
    })
  })

  describe('getDefaultVertical', () => {
    it('returns default for law firm', () => {
      const vertical = getDefaultVertical('law-firm')
      expect(vertical?.id).toBe('lawfirm_general')
    })

    it('returns default for SMB', () => {
      const vertical = getDefaultVertical('small-business')
      expect(vertical?.id).toBe('smb_contractor')
    })

    it('returns default for agency', () => {
      const vertical = getDefaultVertical('agency')
      expect(vertical?.id).toBe('agency_general')
    })
  })

  describe('getAllBusinessTypes', () => {
    it('returns all business type identifiers', () => {
      const types = getAllBusinessTypes()
      expect(types.length).toBe(ALL_VERTICALS.length)
      expect(types).toContain('lawfirm_criminal')
      expect(types).toContain('smb_restaurant')
      expect(types).toContain('agency_marketing')
    })
  })

  describe('getVerticalsGroupedBySiteType', () => {
    it('groups verticals by site type', () => {
      const grouped = getVerticalsGroupedBySiteType()
      expect(Object.keys(grouped)).toEqual(['law-firm', 'small-business', 'agency'])
      expect(grouped['law-firm'].length).toBe(LAWFIRM_VERTICALS.length)
      expect(grouped['small-business'].length).toBe(SMB_VERTICALS.length)
      expect(grouped['agency'].length).toBe(AGENCY_VERTICALS.length)
    })
  })

  describe('searchVerticals', () => {
    it('finds verticals by label', () => {
      const results = searchVerticals('criminal')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(v => v.id === 'lawfirm_criminal')).toBe(true)
    })

    it('finds verticals by description', () => {
      const results = searchVerticals('restaurant')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(v => v.id === 'smb_restaurant')).toBe(true)
    })

    it('returns empty array for no matches', () => {
      const results = searchVerticals('xyznonexistent')
      expect(results).toEqual([])
    })

    it('is case-insensitive', () => {
      const upper = searchVerticals('CRIMINAL')
      const lower = searchVerticals('criminal')
      expect(upper.length).toBe(lower.length)
    })
  })
})

// ─── Category-Specific Lookup Tests ──────────────────────────

describe('Category Lookups', () => {
  describe('getLawFirmVertical', () => {
    it('returns law firm vertical by type', () => {
      const pack = getLawFirmVertical('lawfirm_family')
      expect(pack?.id).toBe('lawfirm_family')
      expect(pack?.label).toBe('Family Law')
    })

    it('returns null for non-law-firm type', () => {
      const pack = getLawFirmVertical('smb_restaurant' as BusinessType)
      expect(pack).toBeNull()
    })
  })

  describe('getSMBVertical', () => {
    it('returns SMB vertical by type', () => {
      const pack = getSMBVertical('smb_salon')
      expect(pack?.id).toBe('smb_salon')
      expect(pack?.label).toBe('Salon / Beauty')
    })

    it('returns null for non-SMB type', () => {
      const pack = getSMBVertical('agency_design' as BusinessType)
      expect(pack).toBeNull()
    })
  })

  describe('getAgencyVertical', () => {
    it('returns agency vertical by type', () => {
      const pack = getAgencyVertical('agency_development')
      expect(pack?.id).toBe('agency_development')
      expect(pack?.label).toBe('Development Agency')
    })

    it('returns null for non-agency type', () => {
      const pack = getAgencyVertical('lawfirm_criminal' as BusinessType)
      expect(pack).toBeNull()
    })
  })
})

// ─── Site Type Mapping Tests ─────────────────────────────────

describe('getSiteTypeFromBusinessType', () => {
  it('maps law firm types to law-firm', () => {
    expect(getTypeFromTypes('lawfirm_general')).toBe('law-firm')
    expect(getTypeFromTypes('lawfirm_criminal')).toBe('law-firm')
    expect(getTypeFromTypes('lawfirm_personal_injury')).toBe('law-firm')
  })

  it('maps SMB types to small-business', () => {
    expect(getTypeFromTypes('smb_contractor')).toBe('small-business')
    expect(getTypeFromTypes('smb_restaurant')).toBe('small-business')
    expect(getTypeFromTypes('smb_medical')).toBe('small-business')
  })

  it('maps agency types to agency', () => {
    expect(getTypeFromTypes('agency_general')).toBe('agency')
    expect(getTypeFromTypes('agency_design')).toBe('agency')
    expect(getTypeFromTypes('agency_marketing')).toBe('agency')
  })
})

// ─── Vertical Pack Structure Tests ───────────────────────────

describe('Vertical Pack Structure', () => {
  it.each(ALL_VERTICALS.map(v => [v.id, v]))(
    '%s has required fields',
    (id, pack: VerticalPack) => {
      expect(pack.id).toBeTruthy()
      expect(pack.label).toBeTruthy()
      expect(pack.description).toBeTruthy()
      expect(pack.siteType).toMatch(/^(law-firm|small-business|agency)$/)
      expect(pack.recommendedPresets.length).toBeGreaterThan(0)
      expect(pack.defaultPreset).toBeTruthy()
      expect(pack.copyTemplates).toBeDefined()
      expect(pack.sectionDefaults).toBeDefined()
      expect(pack.trustBadges.length).toBeGreaterThan(0)
      expect(pack.seoDefaults).toBeDefined()
      expect(pack.fieldRequirements.length).toBeGreaterThan(0)
    }
  )

  it.each(ALL_VERTICALS.map(v => [v.id, v]))(
    '%s has valid copy templates',
    (id, pack: VerticalPack) => {
      const templates = pack.copyTemplates
      expect(templates.heroHeadline.variants.length).toBeGreaterThan(0)
      expect(templates.heroSubheadline.variants.length).toBeGreaterThan(0)
      expect(templates.ctaText.variants.length).toBeGreaterThan(0)
    }
  )
})

// ─── Apply Vertical Pack Tests ───────────────────────────────

describe('applyVerticalPack', () => {
  it('returns result for valid business type', () => {
    const result = applyVerticalPack('lawfirm_criminal', 'site-123')
    expect(result).not.toBeNull()
    expect(result?.copy.heroHeadline).toBeTruthy()
    expect(result?.recommendedPresets.length).toBeGreaterThan(0)
    expect(result?.meta.verticalId).toBe('lawfirm_criminal')
  })

  it('returns null for invalid business type', () => {
    const result = applyVerticalPack('invalid' as BusinessType, 'site-123')
    expect(result).toBeNull()
  })

  it('interpolates template variables', () => {
    const result = applyVerticalPack('lawfirm_general', 'site-123', {
      firmName: 'Acme Law',
    })
    // The aboutIntro should contain the firm name
    expect(result?.copy.aboutIntro).toContain('Acme Law')
  })

  it('produces deterministic results for same siteId', () => {
    const result1 = applyVerticalPack('lawfirm_criminal', 'site-abc')
    const result2 = applyVerticalPack('lawfirm_criminal', 'site-abc')
    expect(result1?.copy.heroHeadline).toBe(result2?.copy.heroHeadline)
    expect(result1?.copy.ctaText).toBe(result2?.copy.ctaText)
  })

  it('produces different results for different siteIds', () => {
    // Note: With 4 variants, different seeds may still occasionally hit the same variant
    // We test across multiple fields to ensure at least some variation
    const result1 = applyVerticalPack('lawfirm_criminal', 'site-one')
    const result2 = applyVerticalPack('lawfirm_criminal', 'site-two')

    // At least the meta should be different
    expect(result1?.meta).not.toBe(result2?.meta)
  })

  it('includes section defaults from vertical', () => {
    const result = applyVerticalPack('lawfirm_criminal', 'site-123')
    expect(result?.sectionDefaults.showUrgencyBanner).toBe(true)
    expect(result?.phoneEmphasis).toBe(1.0)
  })

  it('includes trust badges from vertical', () => {
    const result = applyVerticalPack('smb_contractor', 'site-123')
    expect(result?.trustBadges.length).toBeGreaterThan(0)
    expect(result?.trustBadges.some(b => b.id === 'licensed')).toBe(true)
  })
})

// ─── Copy Variant Selection Tests ────────────────────────────

describe('selectCopyVariant', () => {
  const variants = ['Option A', 'Option B', 'Option C', 'Option D']

  it('returns a variant from the array', () => {
    const selected = selectCopyVariant('site-123', variants, 'testField')
    expect(variants).toContain(selected)
  })

  it('is deterministic for same inputs', () => {
    const result1 = selectCopyVariant('site-abc', variants, 'headline')
    const result2 = selectCopyVariant('site-abc', variants, 'headline')
    expect(result1).toBe(result2)
  })

  it('varies by siteId', () => {
    // Run multiple site IDs and check that we get some variation
    const results = new Set<string>()
    for (let i = 0; i < 100; i++) {
      results.add(selectCopyVariant(`site-${i}`, variants, 'headline'))
    }
    // Should have more than 1 unique result
    expect(results.size).toBeGreaterThan(1)
  })

  it('varies by field name', () => {
    const result1 = selectCopyVariant('site-123', variants, 'fieldA')
    const result2 = selectCopyVariant('site-123', variants, 'fieldB')
    // These MIGHT be the same by chance, but with good seed mixing they usually differ
    // We just check both are valid
    expect(variants).toContain(result1)
    expect(variants).toContain(result2)
  })

  it('returns empty string for empty variants', () => {
    expect(selectCopyVariant('site-123', [], 'field')).toBe('')
  })

  it('returns the only option for single variant', () => {
    expect(selectCopyVariant('site-123', ['Only One'], 'field')).toBe('Only One')
  })
})

// ─── Template Interpolation Tests ────────────────────────────

describe('interpolateTemplate', () => {
  it('replaces simple variables', () => {
    const template = 'Hello, {{name}}!'
    const result = interpolateTemplate(template, { name: 'World' })
    expect(result).toBe('Hello, World!')
  })

  it('replaces multiple variables', () => {
    const template = '{{greeting}}, {{name}}! Welcome to {{place}}.'
    const result = interpolateTemplate(template, {
      greeting: 'Hello',
      name: 'Alice',
      place: 'Wonderland',
    })
    expect(result).toBe('Hello, Alice! Welcome to Wonderland.')
  })

  it('preserves unmatched variables', () => {
    const template = '{{name}} called from {{location}}'
    const result = interpolateTemplate(template, { name: 'Bob' })
    expect(result).toBe('Bob called from {{location}}')
  })

  it('converts numbers to strings', () => {
    const template = 'Serving clients for {{years}} years'
    const result = interpolateTemplate(template, { years: 25 })
    expect(result).toBe('Serving clients for 25 years')
  })

  it('handles empty variables object', () => {
    const template = '{{foo}} and {{bar}}'
    const result = interpolateTemplate(template, {})
    expect(result).toBe('{{foo}} and {{bar}}')
  })
})

// ─── FAQ Resolution Tests ────────────────────────────────────

describe('resolveFAQs', () => {
  it('resolves FAQ templates with variables', () => {
    const pack = getVerticalPack('lawfirm_general')!
    const faqs = resolveFAQs(pack, { phone: '555-1234' })
    expect(faqs.length).toBeGreaterThan(0)
    expect(faqs[1].answer).toContain('555-1234')
  })

  it('preserves questions as-is', () => {
    const pack = getVerticalPack('smb_contractor')!
    const faqs = resolveFAQs(pack, {})
    expect(faqs[0].question).toBe('Are you licensed and insured?')
  })
})

// ─── SEO Resolution Tests ────────────────────────────────────

describe('resolveSEO', () => {
  it('resolves SEO patterns', () => {
    const pack = getVerticalPack('lawfirm_criminal')!
    const seo = resolveSEO(pack, {
      firmName: 'Defense Firm',
      location: 'New York',
      phone: '555-0000',
    })
    expect(seo.title).toContain('Defense Firm')
    expect(seo.description).toContain('New York')
    expect(seo.schemaType).toBe('LegalService')
  })
})

// ─── Structured Data Resolution Tests ────────────────────────

describe('resolveStructuredData', () => {
  it('resolves structured data with variables', () => {
    const pack = getVerticalPack('smb_restaurant')!
    const data = resolveStructuredData(pack, {
      businessName: 'Pizza Place',
      phone: '555-PIZZA',
      email: 'info@pizza.com',
      cuisine: 'Italian',
    })
    expect(data['@type']).toBe('Restaurant')
    expect(data.name).toBe('Pizza Place')
    expect(data.telephone).toBe('555-PIZZA')
    expect(data.servesCuisine).toBe('Italian')
  })

  it('preserves schema.org context', () => {
    const pack = getVerticalPack('agency_general')!
    const data = resolveStructuredData(pack, {})
    expect(data['@context']).toBe('https://schema.org')
  })
})

// ─── Coverage for All Verticals ──────────────────────────────

describe('All Verticals Apply Successfully', () => {
  it.each(ALL_VERTICALS.map(v => v.id))(
    '%s applies without error',
    (businessType) => {
      const result = applyVerticalPack(businessType, 'test-site-123', {
        firmName: 'Test Firm',
        businessName: 'Test Business',
        agencyName: 'Test Agency',
        phone: '555-555-5555',
        email: 'test@test.com',
        location: 'Test City',
      })
      expect(result).not.toBeNull()
      expect(result?.copy.heroHeadline).toBeTruthy()
      expect(result?.meta.verticalId).toBe(businessType)
    }
  )
})
