/**
 * Preset System Tests
 * 
 * Validates:
 * - Preset registry completeness
 * - Apply preset determinism
 * - Content preservation (presets don't overwrite custom business data)
 * - Type safety and mismatch handling
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  LAWFIRM_PRESETS,
  SMB_PRESETS,
  AGENCY_PRESETS,
  getLawFirmPreset,
  getSMBPreset,
  getAgencyPreset,
  getPresetsForType,
  getPresetById,
  applyPreset,
  applyPresetWithMeta,
} from '../index'
import type {
  LawFirmSiteData,
  SMBSiteData,
  AgencySiteData,
} from '@/lib/types'

// =============================================================================
// Test Fixtures
// =============================================================================

const createBaseLawFirmSite = (): LawFirmSiteData => ({
  type: 'law-firm',
  siteId: 'test-lawfirm-001',
  name: 'Test Law Firm',
  slug: 'test-law-firm',
  status: 'draft',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  branding: {
    primaryColor: '#000000',
    secondaryColor: '#888888',
  },
  seo: {
    title: 'Test Law Firm',
    description: 'A test law firm',
  },
  config: {
    firmName: 'Smith & Associates',
    primaryColor: '#000000',
    accentColor: '#888888',
    intakeFormEnabled: false,
    intakeFields: [],
    seo: {
      sitemapEnabled: false,
    },
  },
  caseResults: [],
  attorneys: [{ id: 'atty-1', name: 'John Smith', title: 'Partner', bio: 'Experienced attorney', jurisdictions: [], practiceAreas: [], education: [], featured: false, order: 0 }],
  practiceAreas: [{ id: 'pa-1', name: 'Civil Litigation', slug: 'civil-litigation', description: 'Civil cases', keyPoints: [], order: 0 }],
  testimonials: [],
  blogPosts: [],
  intakeSubmissions: [],
  visibility: 'demo',
})

const createBaseSMBSite = (): SMBSiteData => ({
  type: 'small-business',
  siteId: 'test-smb-001',
  name: 'Test Business',
  slug: 'test-business',
  status: 'draft',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  branding: {
    primaryColor: '#000000',
    secondaryColor: '#888888',
  },
  seo: {
    title: 'Test Business',
    description: 'A test business',
  },
  config: {
    businessName: 'ABC Services',
    industry: 'Services',
    tagline: 'Your trusted partner',
    description: 'We provide excellent services',
    primaryColor: '#000000',
    accentColor: '#888888',
    heroStyle: 'image',
    sections: {
      hero: true,
      services: true,
      about: true,
      team: true,
      testimonials: true,
      faq: true,
      contact: true,
      gallery: true,
      blog: false,
      promotions: false,
      map: false,
    },
    seo: {
      sitemapEnabled: false,
    },
  },
  services: [{ id: 'svc-1', name: 'Consulting', description: 'Expert consulting', featured: false, order: 0 }],
  team: [],
  testimonials: [],
  faqs: [],
  galleryImages: [],
  promotions: [],
  blogPosts: [],
  contactSubmissions: [],
})

const createBaseAgencySite = (): AgencySiteData => ({
  type: 'agency',
  siteId: 'test-agency-001',
  name: 'Test Agency',
  slug: 'test-agency',
  status: 'draft',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  branding: {
    primaryColor: '#000000',
    secondaryColor: '#888888',
  },
  seo: {
    title: 'Test Agency',
    description: 'A test agency',
  },
  config: {
    agencyName: 'Creative Studio',
    defaultHourlyRate: 15000,
    currency: 'USD',
    paymentTerms: 'Net 30',
    invoicePrefix: 'INV-',
    proposalPrefix: 'PROP-',
  },
  projects: [{ id: 'proj-1', clientName: 'Test Client', templateType: 'small-business', status: 'discovery', startDate: '2025-01-01', budget: 500000, hoursEstimated: 40, hoursUsed: 0, deliverables: [] }],
  pipeline: [],
  invoices: [],
  proposals: [],
  timeEntries: [],
  brandingRemoved: true,
})

// =============================================================================
// Preset Registry Tests
// =============================================================================

describe('Preset Registry', () => {
  describe('Law Firm Presets', () => {
    it('should have at least 3 law firm presets', () => {
      expect(LAWFIRM_PRESETS.length).toBeGreaterThanOrEqual(3)
    })

    it('should have unique preset IDs', () => {
      const ids = LAWFIRM_PRESETS.map(p => p.presetId)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should return preset by ID via getter', () => {
      const preset = getLawFirmPreset('lawfirm-classic-navy')
      expect(preset).toBeDefined()
      expect(preset?.siteType).toBe('law-firm')
    })

    it('should return null for unknown preset ID', () => {
      const preset = getLawFirmPreset('nonexistent-preset')
      expect(preset).toBeNull()
    })

    it('should have required fields on each preset', () => {
      for (const preset of LAWFIRM_PRESETS) {
        expect(preset.presetId).toBeTruthy()
        expect(preset.label).toBeTruthy()
        expect(preset.siteType).toBe('law-firm')
        expect(preset.tokens).toBeDefined()
        expect(preset.sectionDefaults).toBeDefined()
      }
    })
  })

  describe('SMB Presets', () => {
    it('should have at least 3 SMB presets', () => {
      expect(SMB_PRESETS.length).toBeGreaterThanOrEqual(3)
    })

    it('should have unique preset IDs', () => {
      const ids = SMB_PRESETS.map(p => p.presetId)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should return preset by ID via getter', () => {
      const preset = getSMBPreset('smb-friendly-modern')
      expect(preset).toBeDefined()
      expect(preset?.siteType).toBe('small-business')
    })
  })

  describe('Agency Presets', () => {
    it('should have at least 3 agency presets', () => {
      expect(AGENCY_PRESETS.length).toBeGreaterThanOrEqual(3)
    })

    it('should have unique preset IDs', () => {
      const ids = AGENCY_PRESETS.map(p => p.presetId)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should return preset by ID via getter', () => {
      const preset = getAgencyPreset('agency-dark-studio')
      expect(preset).toBeDefined()
      expect(preset?.siteType).toBe('agency')
    })
  })

  describe('getPresetsForType', () => {
    it('should return law firm presets for law-firm type', () => {
      const presets = getPresetsForType('law-firm')
      // Now includes base presets (4) + practice-type presets (14) = 18
      expect(presets.length).toBe(18)
      // Should include base presets
      expect(presets.slice(0, 4)).toEqual(LAWFIRM_PRESETS)
    })

    it('should return SMB presets for small-business type', () => {
      const presets = getPresetsForType('small-business')
      expect(presets).toEqual(SMB_PRESETS)
    })

    it('should return agency presets for agency type', () => {
      const presets = getPresetsForType('agency')
      expect(presets).toEqual(AGENCY_PRESETS)
    })
  })

  describe('getPresetById', () => {
    it('should find law firm preset by ID', () => {
      const preset = getPresetById('lawfirm-classic-navy')
      expect(preset).not.toBeNull()
      expect(preset?.presetId).toBe('lawfirm-classic-navy')
    })

    it('should find SMB preset by ID', () => {
      const preset = getPresetById('smb-friendly-modern')
      expect(preset).not.toBeNull()
      expect(preset?.presetId).toBe('smb-friendly-modern')
    })

    it('should find agency preset by ID', () => {
      const preset = getPresetById('agency-dark-studio')
      expect(preset).not.toBeNull()
      expect(preset?.presetId).toBe('agency-dark-studio')
    })

    it('should return null for unknown preset', () => {
      const preset = getPresetById('totally-fake-preset')
      expect(preset).toBeNull()
    })
  })
})

// =============================================================================
// Apply Preset Tests
// =============================================================================

describe('applyPreset', () => {
  describe('Law Firm Preset Application', () => {
    let site: LawFirmSiteData

    beforeEach(() => {
      site = createBaseLawFirmSite()
    })

    it('should apply theme colors to branding', () => {
      const result = applyPreset(site, 'lawfirm-classic-navy')
      
      expect(result.branding.primaryColor).toBe('#1a365d')
      expect(result.branding.secondaryColor).toBe('#c7a44a')
    })

    it('should apply colors to config', () => {
      const result = applyPreset(site, 'lawfirm-classic-navy')
      
      expect(result.config.primaryColor).toBe('#1a365d')
      expect(result.config.accentColor).toBe('#c7a44a')
    })

    it('should preserve business content - attorneys', () => {
      const result = applyPreset(site, 'lawfirm-classic-navy')
      
      expect(result.attorneys).toHaveLength(1)
      expect(result.attorneys[0].name).toBe('John Smith')
    })

    it('should preserve business content - practice areas', () => {
      const result = applyPreset(site, 'lawfirm-classic-navy')
      
      expect(result.practiceAreas).toHaveLength(1)
      expect(result.practiceAreas[0].name).toBe('Civil Litigation')
    })

    it('should preserve site identity fields', () => {
      const result = applyPreset(site, 'lawfirm-classic-navy')
      
      expect(result.siteId).toBe(site.siteId)
      expect(result.name).toBe(site.name)
      expect(result.slug).toBe(site.slug)
      expect(result.createdAt).toBe(site.createdAt)
    })

    it('should be deterministic - same input produces same output', () => {
      const result1 = applyPreset(site, 'lawfirm-classic-navy')
      const result2 = applyPreset(site, 'lawfirm-classic-navy')
      
      expect(result1.branding.primaryColor).toBe(result2.branding.primaryColor)
      expect(result1.branding.secondaryColor).toBe(result2.branding.secondaryColor)
      expect(result1.config.primaryColor).toBe(result2.config.primaryColor)
    })

    it('should return unchanged data for unknown preset', () => {
      const result = applyPreset(site, 'unknown-preset-id')
      
      expect(result.branding.primaryColor).toBe(site.branding.primaryColor)
      expect(result.branding.secondaryColor).toBe(site.branding.secondaryColor)
    })
  })

  describe('SMB Preset Application', () => {
    let site: SMBSiteData

    beforeEach(() => {
      site = createBaseSMBSite()
    })

    it('should apply theme colors to branding', () => {
      const result = applyPreset(site, 'smb-friendly-modern')
      
      expect(result.branding.primaryColor).toBe('#2563eb')
      expect(result.branding.secondaryColor).toBe('#f59e0b')
    })

    it('should apply hero style from section defaults', () => {
      const result = applyPreset(site, 'smb-friendly-modern')
      
      expect(result.config.heroStyle).toBe('gradient')
    })

    it('should preserve business content - services', () => {
      const result = applyPreset(site, 'smb-friendly-modern')
      
      expect(result.services).toHaveLength(1)
      expect(result.services[0].name).toBe('Consulting')
    })

    it('should apply different presets with different results', () => {
      const result1 = applyPreset(site, 'smb-friendly-modern')
      const result2 = applyPreset(site, 'smb-warm-artisan')
      
      expect(result1.branding.primaryColor).not.toBe(result2.branding.primaryColor)
    })
  })

  describe('Agency Preset Application', () => {
    let site: AgencySiteData

    beforeEach(() => {
      site = createBaseAgencySite()
    })

    it('should apply theme colors to branding', () => {
      const result = applyPreset(site, 'agency-dark-studio')
      
      expect(result.branding.primaryColor).toBe('#111827')
      expect(result.branding.secondaryColor).toBe('#60a5fa')
    })

    it('should preserve business content - projects', () => {
      const result = applyPreset(site, 'agency-dark-studio')
      
      expect(result.projects).toHaveLength(1)
      expect(result.projects[0].clientName).toBe('Test Client')
    })
  })

  describe('Type Mismatch Handling', () => {
    it('should return unchanged law firm site when SMB preset applied', () => {
      const lawfirmSite = createBaseLawFirmSite()
      const result = applyPreset(lawfirmSite, 'smb-friendly-modern')
      
      // Should be unchanged (type mismatch)
      expect(result.branding.primaryColor).toBe(lawfirmSite.branding.primaryColor)
    })

    it('should return unchanged SMB site when law firm preset applied', () => {
      const smbSite = createBaseSMBSite()
      const result = applyPreset(smbSite, 'lawfirm-classic-navy')
      
      // Should be unchanged (type mismatch)
      expect(result.branding.primaryColor).toBe(smbSite.branding.primaryColor)
    })

    it('should return unchanged agency site when SMB preset applied', () => {
      const agencySite = createBaseAgencySite()
      const result = applyPreset(agencySite, 'smb-warm-artisan')
      
      // Should be unchanged (type mismatch)
      expect(result.branding.primaryColor).toBe(agencySite.branding.primaryColor)
    })
  })
})

// =============================================================================
// Apply Preset With Meta Tests
// =============================================================================

describe('applyPresetWithMeta', () => {
  it('should return metadata with successful application', () => {
    const site = createBaseLawFirmSite()
    const [result, meta] = applyPresetWithMeta(site, 'lawfirm-classic-navy')
    
    expect(meta).not.toBeNull()
    expect(meta?.presetId).toBe('lawfirm-classic-navy')
    expect(meta?.appliedAt).toBeTruthy()
    expect(new Date(meta?.appliedAt ?? '').getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('should return null metadata for unknown preset', () => {
    const site = createBaseLawFirmSite()
    const [result, meta] = applyPresetWithMeta(site, 'unknown-preset')
    
    expect(meta).toBeNull()
  })

  it('should return null metadata for type mismatch', () => {
    const site = createBaseLawFirmSite()
    const [result, meta] = applyPresetWithMeta(site, 'smb-friendly-modern')
    
    expect(meta).toBeNull()
  })

  it('should apply preset correctly alongside metadata', () => {
    const site = createBaseSMBSite()
    const [result, meta] = applyPresetWithMeta(site, 'smb-bold-vibrant')
    
    expect(result.branding.primaryColor).toBe('#7c3aed')
    expect(meta?.presetId).toBe('smb-bold-vibrant')
  })
})

// =============================================================================
// Immutability Tests
// =============================================================================

describe('Immutability', () => {
  it('should not mutate original law firm site data', () => {
    const original = createBaseLawFirmSite()
    const originalCopy = JSON.parse(JSON.stringify(original))
    
    applyPreset(original, 'lawfirm-executive-burgundy')
    
    expect(original).toEqual(originalCopy)
  })

  it('should not mutate original SMB site data', () => {
    const original = createBaseSMBSite()
    const originalCopy = JSON.parse(JSON.stringify(original))
    
    applyPreset(original, 'smb-elegant-minimal')
    
    expect(original).toEqual(originalCopy)
  })

  it('should not mutate original agency site data', () => {
    const original = createBaseAgencySite()
    const originalCopy = JSON.parse(JSON.stringify(original))
    
    applyPreset(original, 'agency-creative-gradient')
    
    expect(original).toEqual(originalCopy)
  })
})

// =============================================================================
// Practice-Type Presets Tests
// =============================================================================

import {
  ALL_PRACTICE_TYPE_PRESETS,
  CRIMINAL_DEFENSE_PRESETS,
  PERSONAL_INJURY_PRESETS,
  FAMILY_LAW_PRESETS,
  IMMIGRATION_PRESETS,
  REAL_ESTATE_PRESETS,
  CIVIL_RIGHTS_PRESETS,
  BUSINESS_LAW_PRESETS,
  getPresetsForPracticeType,
  getPracticeTypePreset,
} from '../lawfirm.practice-presets'

describe('Practice-Type Presets', () => {
  describe('Preset Collections', () => {
    it('should have 14 total practice-type presets (2 per practice area)', () => {
      expect(ALL_PRACTICE_TYPE_PRESETS).toHaveLength(14)
    })

    it('should have 2 criminal defense presets', () => {
      expect(CRIMINAL_DEFENSE_PRESETS).toHaveLength(2)
      expect(CRIMINAL_DEFENSE_PRESETS[0].presetId).toBe('criminal-defense-dark')
      expect(CRIMINAL_DEFENSE_PRESETS[1].presetId).toBe('criminal-defense-steel')
    })

    it('should have 2 personal injury presets', () => {
      expect(PERSONAL_INJURY_PRESETS).toHaveLength(2)
      expect(PERSONAL_INJURY_PRESETS[0].presetId).toBe('personal-injury-bold')
      expect(PERSONAL_INJURY_PRESETS[1].presetId).toBe('personal-injury-trust')
    })

    it('should have 2 family law presets', () => {
      expect(FAMILY_LAW_PRESETS).toHaveLength(2)
      expect(FAMILY_LAW_PRESETS[0].presetId).toBe('family-law-warm')
      expect(FAMILY_LAW_PRESETS[1].presetId).toBe('family-law-calm')
    })

    it('should have 2 immigration presets', () => {
      expect(IMMIGRATION_PRESETS).toHaveLength(2)
      expect(IMMIGRATION_PRESETS[0].presetId).toBe('immigration-hope')
      expect(IMMIGRATION_PRESETS[1].presetId).toBe('immigration-liberty')
    })

    it('should have 2 real estate presets', () => {
      expect(REAL_ESTATE_PRESETS).toHaveLength(2)
      expect(REAL_ESTATE_PRESETS[0].presetId).toBe('real-estate-earth')
      expect(REAL_ESTATE_PRESETS[1].presetId).toBe('real-estate-modern')
    })

    it('should have 2 civil rights presets', () => {
      expect(CIVIL_RIGHTS_PRESETS).toHaveLength(2)
      expect(CIVIL_RIGHTS_PRESETS[0].presetId).toBe('civil-rights-justice')
      expect(CIVIL_RIGHTS_PRESETS[1].presetId).toBe('civil-rights-advocate')
    })

    it('should have 2 business law presets', () => {
      expect(BUSINESS_LAW_PRESETS).toHaveLength(2)
      expect(BUSINESS_LAW_PRESETS[0].presetId).toBe('business-law-corporate')
      expect(BUSINESS_LAW_PRESETS[1].presetId).toBe('business-law-executive')
    })
  })

  describe('getPresetsForPracticeType', () => {
    it('should return criminal defense presets for criminal vertical', () => {
      const presets = getPresetsForPracticeType('lawfirm_criminal')
      expect(presets).toHaveLength(2)
      expect(presets[0].presetId).toBe('criminal-defense-dark')
    })

    it('should return personal injury presets for personal injury vertical', () => {
      const presets = getPresetsForPracticeType('lawfirm_personal_injury')
      expect(presets).toHaveLength(2)
      expect(presets[0].presetId).toBe('personal-injury-bold')
    })

    it('should return empty array for unknown vertical', () => {
      const presets = getPresetsForPracticeType('unknown-vertical')
      expect(presets).toHaveLength(0)
    })
  })

  describe('getPracticeTypePreset', () => {
    it('should return preset by ID', () => {
      const preset = getPracticeTypePreset('criminal-defense-dark')
      expect(preset).not.toBeNull()
      expect(preset?.label).toBe('Criminal Defense Dark')
    })

    it('should return null for unknown preset ID', () => {
      const preset = getPracticeTypePreset('unknown-preset')
      expect(preset).toBeNull()
    })
  })

  describe('Preset Structure', () => {
    it('all practice-type presets should be law-firm type', () => {
      for (const preset of ALL_PRACTICE_TYPE_PRESETS) {
        expect(preset.siteType).toBe('law-firm')
      }
    })

    it('all presets should have required color tokens', () => {
      for (const preset of ALL_PRACTICE_TYPE_PRESETS) {
        expect(preset.tokens.colors?.primaryColor).toBeDefined()
        expect(preset.tokens.colors?.secondaryColor).toBeDefined()
        expect(preset.tokens.colors?.backgroundColor).toBeDefined()
        expect(preset.tokens.colors?.textColor).toBeDefined()
      }
    })

    it('all presets should have required typography tokens', () => {
      for (const preset of ALL_PRACTICE_TYPE_PRESETS) {
        expect(preset.tokens.typography?.fontFamily?.heading).toBeDefined()
        expect(preset.tokens.typography?.fontFamily?.body).toBeDefined()
      }
    })

    it('all presets should have section defaults', () => {
      for (const preset of ALL_PRACTICE_TYPE_PRESETS) {
        expect(preset.sectionDefaults).toBeDefined()
        expect(preset.sectionDefaults.heroStyle).toBeDefined()
      }
    })
  })

  describe('applyPreset with Practice-Type Presets', () => {
    it('should apply criminal defense preset to law firm site', () => {
      const site = createBaseLawFirmSite()
      const result = applyPreset(site, 'criminal-defense-dark')
      
      expect(result.branding.primaryColor).toBe('#1e293b')
      expect(result.branding.secondaryColor).toBe('#ef4444')
    })

    it('should apply family law preset to law firm site', () => {
      const site = createBaseLawFirmSite()
      const result = applyPreset(site, 'family-law-warm')
      
      expect(result.branding.primaryColor).toBe('#92400e')
      expect(result.branding.secondaryColor).toBe('#b45309')
    })

    it('should include practice-type presets in getPresetsForType', () => {
      const presets = getPresetsForType('law-firm')
      
      // Should include both base presets (4) and practice-type presets (14)
      expect(presets.length).toBe(18)
      
      // Should include practice-type presets
      const ids = presets.map(p => p.presetId)
      expect(ids).toContain('criminal-defense-dark')
      expect(ids).toContain('personal-injury-bold')
      expect(ids).toContain('family-law-warm')
    })
  })
})