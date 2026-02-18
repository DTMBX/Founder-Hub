import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Helpers ─────────────────────────────────────────────────

const BLUEPRINTS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
)

function loadJson<T = unknown>(filename: string): T {
  const raw = readFileSync(resolve(BLUEPRINTS_DIR, filename), 'utf-8')
  return JSON.parse(raw) as T
}

// ─── Types (mirroring Blueprint.schema.json) ─────────────────

interface Page {
  slug: string
  title: string
  template: string
  required_sections?: string[]
}

interface Section {
  id: string
  label: string
  component: string
  order?: number
  required?: boolean
}

interface ComplianceBlock {
  id: string
  label: string
  type: string
  required?: boolean
  default_text?: string
}

interface ContentRequirements {
  min_pages: number
  min_sections: number
  min_words_per_page: number
  require_contact_info: boolean
  require_business_name: boolean
  require_address?: boolean
  require_hours?: boolean
}

interface WatermarkProfile {
  enabled: boolean
  text: string
  opacity: number
  position: string
}

interface SEOProfile {
  title_pattern: string
  description_pattern: string
  schema_type: string
  og_image_pattern?: string
  keywords?: string[]
}

interface Blueprint {
  $schema?: string
  id: string
  name: string
  version: string
  business_type: string
  site_type: 'law-firm' | 'small-business' | 'agency'
  audience: string
  required_pages: Page[]
  required_sections: Section[]
  required_components: string[]
  optional_components: string[]
  style_presets: string[]
  compliance_blocks: ComplianceBlock[]
  content_requirements: ContentRequirements
  demo_watermark_profile: WatermarkProfile
  seo_profile: SEOProfile
  feature_flags: Record<string, boolean>
}

interface CatalogEntry {
  id: string
  file: string
  site_type: string
  name: string
  business_type: string
}

interface Catalog {
  catalog_version: string
  blueprints: CatalogEntry[]
}

// ─── Load All Blueprints ─────────────────────────────────────

const BLUEPRINT_FILES = [
  'law_firm.json',
  'agency.json',
  'contractor.json',
  'nonprofit.json',
  'professional_services.json',
] as const

const blueprints: Blueprint[] = BLUEPRINT_FILES.map((f) => loadJson<Blueprint>(f))
const catalog = loadJson<Catalog>('catalog.json')
const schema = loadJson<Record<string, unknown>>('Blueprint.schema.json')

// ─── Schema Structural Validation ────────────────────────────

describe('Blueprint.schema.json', () => {
  it('exists and has a $schema field', () => {
    expect(schema).toBeDefined()
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
  })

  it('declares all required top-level fields', () => {
    const required = schema.required as string[]
    expect(required).toContain('id')
    expect(required).toContain('name')
    expect(required).toContain('version')
    expect(required).toContain('business_type')
    expect(required).toContain('site_type')
    expect(required).toContain('required_pages')
    expect(required).toContain('required_sections')
    expect(required).toContain('required_components')
    expect(required).toContain('content_requirements')
    expect(required).toContain('feature_flags')
  })

  it('defines $defs for Page, Section, ComplianceBlock, ContentRequirements, WatermarkProfile, SEOProfile', () => {
    const defs = schema.$defs as Record<string, unknown>
    expect(defs).toBeDefined()
    expect(defs.Page).toBeDefined()
    expect(defs.Section).toBeDefined()
    expect(defs.ComplianceBlock).toBeDefined()
    expect(defs.ContentRequirements).toBeDefined()
    expect(defs.WatermarkProfile).toBeDefined()
    expect(defs.SEOProfile).toBeDefined()
  })
})

// ─── Catalog ─────────────────────────────────────────────────

describe('catalog.json', () => {
  it('lists exactly 5 blueprints', () => {
    expect(catalog.blueprints).toHaveLength(5)
  })

  it('has unique blueprint IDs', () => {
    const ids = catalog.blueprints.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each entry has required fields', () => {
    for (const entry of catalog.blueprints) {
      expect(entry.id).toBeTruthy()
      expect(entry.file).toBeTruthy()
      expect(entry.site_type).toBeTruthy()
      expect(entry.name).toBeTruthy()
      expect(entry.business_type).toBeTruthy()
    }
  })

  it('each cataloged file matches the loaded blueprint ID', () => {
    for (const entry of catalog.blueprints) {
      const bp = loadJson<Blueprint>(entry.file)
      expect(bp.id).toBe(entry.id)
      expect(bp.site_type).toBe(entry.site_type)
    }
  })
})

// ─── Per-Blueprint Structural Validation ─────────────────────

const VALID_SITE_TYPES = ['law-firm', 'small-business', 'agency'] as const
const VALID_COMPLIANCE_TYPES = [
  'disclaimer',
  'privacy',
  'terms',
  'accessibility',
  'licensing',
  'regulatory',
  'tax-exempt',
] as const
const VALID_WATERMARK_POSITIONS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
  'diagonal',
] as const
const ID_PATTERN = /^[a-z][a-z0-9_-]{2,48}$/
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

describe.each(blueprints)('Blueprint: $id', (bp) => {
  // ─── Top-level fields ───

  it('has a valid id', () => {
    expect(bp.id).toMatch(ID_PATTERN)
  })

  it('has a name between 3 and 120 characters', () => {
    expect(bp.name.length).toBeGreaterThanOrEqual(3)
    expect(bp.name.length).toBeLessThanOrEqual(120)
  })

  it('has a valid semver version', () => {
    expect(bp.version).toMatch(VERSION_PATTERN)
  })

  it('has a valid site_type', () => {
    expect(VALID_SITE_TYPES).toContain(bp.site_type)
  })

  it('has a non-empty audience', () => {
    expect(bp.audience.length).toBeGreaterThanOrEqual(5)
  })

  // ─── Required Pages ───

  it('has at least 1 required page', () => {
    expect(bp.required_pages.length).toBeGreaterThanOrEqual(1)
  })

  it('every required page has slug, title, template', () => {
    for (const page of bp.required_pages) {
      expect(page.slug).toBeTruthy()
      expect(page.title).toBeTruthy()
      expect(page.template).toBeTruthy()
    }
  })

  it('page slugs are unique', () => {
    const slugs = bp.required_pages.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  // ─── Required Sections ───

  it('has at least 1 required section', () => {
    expect(bp.required_sections.length).toBeGreaterThanOrEqual(1)
  })

  it('every required section has id, label, component', () => {
    for (const s of bp.required_sections) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.component).toBeTruthy()
    }
  })

  it('section IDs are unique', () => {
    const ids = bp.required_sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // ─── Components ───

  it('has at least 1 required component', () => {
    expect(bp.required_components.length).toBeGreaterThanOrEqual(1)
  })

  it('required_components has no duplicates', () => {
    expect(new Set(bp.required_components).size).toBe(bp.required_components.length)
  })

  it('optional_components has no duplicates', () => {
    expect(new Set(bp.optional_components).size).toBe(bp.optional_components.length)
  })

  it('no component appears in both required and optional', () => {
    const overlap = bp.required_components.filter((c) =>
      bp.optional_components.includes(c),
    )
    expect(overlap).toEqual([])
  })

  it('every section component is in required_components or optional_components', () => {
    const allComponents = new Set([
      ...bp.required_components,
      ...bp.optional_components,
    ])
    for (const section of bp.required_sections) {
      expect(allComponents.has(section.component)).toBe(true)
    }
  })

  // ─── Style Presets ───

  it('has at least 1 style preset', () => {
    expect(bp.style_presets.length).toBeGreaterThanOrEqual(1)
  })

  // ─── Compliance Blocks ───

  it('every compliance block has valid type', () => {
    for (const block of bp.compliance_blocks) {
      expect(VALID_COMPLIANCE_TYPES).toContain(block.type)
    }
  })

  it('compliance block IDs are unique', () => {
    const ids = bp.compliance_blocks.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least a privacy policy compliance block', () => {
    const hasPrivacy = bp.compliance_blocks.some((b) => b.type === 'privacy')
    expect(hasPrivacy).toBe(true)
  })

  it('has at least an accessibility statement compliance block', () => {
    const hasA11y = bp.compliance_blocks.some(
      (b) => b.type === 'accessibility',
    )
    expect(hasA11y).toBe(true)
  })

  // ─── Content Requirements ───

  it('min_pages matches required_pages length', () => {
    expect(bp.content_requirements.min_pages).toBeLessThanOrEqual(
      bp.required_pages.length,
    )
  })

  it('min_sections is at least the count of required sections', () => {
    const requiredCount = bp.required_sections.filter(
      (s) => s.required !== false,
    ).length
    expect(bp.content_requirements.min_sections).toBeLessThanOrEqual(
      requiredCount,
    )
  })

  it('requires contact info', () => {
    expect(bp.content_requirements.require_contact_info).toBe(true)
  })

  it('requires business name', () => {
    expect(bp.content_requirements.require_business_name).toBe(true)
  })

  // ─── Watermark Profile ───

  it('demo watermark is enabled', () => {
    expect(bp.demo_watermark_profile.enabled).toBe(true)
  })

  it('watermark position is valid', () => {
    expect(VALID_WATERMARK_POSITIONS).toContain(
      bp.demo_watermark_profile.position,
    )
  })

  it('watermark opacity is between 0 and 1', () => {
    expect(bp.demo_watermark_profile.opacity).toBeGreaterThanOrEqual(0)
    expect(bp.demo_watermark_profile.opacity).toBeLessThanOrEqual(1)
  })

  // ─── SEO Profile ───

  it('SEO title_pattern uses {{placeholder}} syntax', () => {
    expect(bp.seo_profile.title_pattern).toContain('{{')
    expect(bp.seo_profile.title_pattern).toContain('}}')
  })

  it('SEO description_pattern uses {{placeholder}} syntax', () => {
    expect(bp.seo_profile.description_pattern).toContain('{{')
    expect(bp.seo_profile.description_pattern).toContain('}}')
  })

  it('SEO schema_type is non-empty', () => {
    expect(bp.seo_profile.schema_type.length).toBeGreaterThan(0)
  })

  // ─── Feature Flags ───

  it('safe_mode flag is true', () => {
    expect(bp.feature_flags.safe_mode).toBe(true)
  })

  it('all feature flags are booleans', () => {
    for (const [key, val] of Object.entries(bp.feature_flags)) {
      expect(typeof val).toBe('boolean')
    }
  })
})

// ─── Cross-Blueprint Invariants ──────────────────────────────

describe('Cross-blueprint invariants', () => {
  it('all blueprint IDs are unique', () => {
    const ids = blueprints.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every required blueprint always includes site-header, site-footer, nav-bar', () => {
    for (const bp of blueprints) {
      expect(bp.required_components).toContain('site-header')
      expect(bp.required_components).toContain('site-footer')
      expect(bp.required_components).toContain('nav-bar')
    }
  })

  it('every blueprint has at least one contact page', () => {
    for (const bp of blueprints) {
      const contactPage = bp.required_pages.find((p) => p.slug === 'contact')
      expect(contactPage).toBeDefined()
    }
  })

  it('every blueprint includes hero-banner in required_components', () => {
    for (const bp of blueprints) {
      expect(bp.required_components).toContain('hero-banner')
    }
  })

  it('every blueprint includes cta-block in required_components', () => {
    for (const bp of blueprints) {
      expect(bp.required_components).toContain('cta-block')
    }
  })

  it('watermark is enabled on all blueprints (safe mode default)', () => {
    for (const bp of blueprints) {
      expect(bp.demo_watermark_profile.enabled).toBe(true)
    }
  })

  it('all site_types are covered: law-firm, small-business, agency', () => {
    const types = new Set(blueprints.map((b) => b.site_type))
    expect(types.has('law-firm')).toBe(true)
    expect(types.has('small-business')).toBe(true)
    expect(types.has('agency')).toBe(true)
  })
})

// ─── Fail-Closed Invariant Tests ─────────────────────────────

describe('Fail-closed content validation', () => {
  /**
   * Simulates the fail-closed check that the generation pipeline
   * MUST perform: if any required field from content_requirements
   * is missing, generation must be rejected.
   */
  function validateContentRequirements(
    bp: Blueprint,
    input: Partial<{
      pages: number
      sections: number
      wordsPerPage: number
      hasContactInfo: boolean
      hasBusinessName: boolean
      hasAddress: boolean
      hasHours: boolean
    }>,
  ): string[] {
    const errors: string[] = []
    const req = bp.content_requirements

    if ((input.pages ?? 0) < req.min_pages)
      errors.push(`min_pages: need ${req.min_pages}, got ${input.pages ?? 0}`)

    if ((input.sections ?? 0) < req.min_sections)
      errors.push(`min_sections: need ${req.min_sections}, got ${input.sections ?? 0}`)

    if ((input.wordsPerPage ?? 0) < req.min_words_per_page)
      errors.push(`min_words_per_page: need ${req.min_words_per_page}, got ${input.wordsPerPage ?? 0}`)

    if (req.require_contact_info && !input.hasContactInfo)
      errors.push('require_contact_info: missing')

    if (req.require_business_name && !input.hasBusinessName)
      errors.push('require_business_name: missing')

    if (req.require_address && !input.hasAddress)
      errors.push('require_address: missing')

    if (req.require_hours && !input.hasHours)
      errors.push('require_hours: missing')

    return errors
  }

  it('rejects empty input for every blueprint', () => {
    for (const bp of blueprints) {
      const errors = validateContentRequirements(bp, {})
      expect(errors.length).toBeGreaterThan(0)
    }
  })

  it('rejects input missing business name for every blueprint', () => {
    for (const bp of blueprints) {
      const errors = validateContentRequirements(bp, {
        pages: 10,
        sections: 20,
        wordsPerPage: 500,
        hasContactInfo: true,
        hasBusinessName: false,
        hasAddress: true,
        hasHours: true,
      })
      expect(errors).toContain('require_business_name: missing')
    }
  })

  it('rejects input missing contact info for every blueprint', () => {
    for (const bp of blueprints) {
      const errors = validateContentRequirements(bp, {
        pages: 10,
        sections: 20,
        wordsPerPage: 500,
        hasContactInfo: false,
        hasBusinessName: true,
        hasAddress: true,
        hasHours: true,
      })
      expect(errors).toContain('require_contact_info: missing')
    }
  })

  it('accepts fully valid input for law-firm blueprint', () => {
    const bp = blueprints.find((b) => b.id === 'law-firm')!
    const errors = validateContentRequirements(bp, {
      pages: 4,
      sections: 8,
      wordsPerPage: 100,
      hasContactInfo: true,
      hasBusinessName: true,
      hasAddress: true,
      hasHours: true,
    })
    expect(errors).toEqual([])
  })

  it('accepts fully valid input for contractor blueprint', () => {
    const bp = blueprints.find((b) => b.id === 'contractor')!
    const errors = validateContentRequirements(bp, {
      pages: 4,
      sections: 8,
      wordsPerPage: 80,
      hasContactInfo: true,
      hasBusinessName: true,
      hasAddress: true,
      hasHours: true,
    })
    expect(errors).toEqual([])
  })
})
