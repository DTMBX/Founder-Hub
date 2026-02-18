/**
 * apps/sitegen/blueprints/__tests__/blueprints-quality.test.ts
 *
 * Integration tests: every shipped blueprint must pass the B23 quality standard.
 * Fail-closed — if a blueprint is added to the catalog but fails quality
 * validation, the build is blocked.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validateBlueprintQuality,
  validateCatalogQuality,
  REQUIRED_CORE_COMPONENTS,
  COMPLEMENTARY_POOL,
  MIN_COMPLEMENTARY,
  REQUIRED_COMPLIANCE_TYPES,
  type BlueprintForQuality,
} from '../validateBlueprintQuality.js'

// ─── Helpers ────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const BLUEPRINTS_DIR = resolve(__dirname, '..')

function loadBlueprint(filename: string): BlueprintForQuality {
  const raw = readFileSync(resolve(BLUEPRINTS_DIR, filename), 'utf-8')
  return JSON.parse(raw) as BlueprintForQuality
}

interface CatalogEntry {
  id: string
  file: string
  name: string
}

function loadCatalog(): { blueprints: CatalogEntry[] } {
  const raw = readFileSync(resolve(BLUEPRINTS_DIR, 'catalog.json'), 'utf-8')
  return JSON.parse(raw) as { blueprints: CatalogEntry[] }
}

// ─── Load All Blueprints ────────────────────────────────────────────

const catalog = loadCatalog()
const blueprints: { entry: CatalogEntry; bp: BlueprintForQuality }[] =
  catalog.blueprints.map(entry => ({
    entry,
    bp: loadBlueprint(entry.file),
  }))

// ─── Global Catalog Tests ───────────────────────────────────────────

describe('Blueprint Catalog', () => {
  it('contains at least 5 blueprints', () => {
    expect(catalog.blueprints.length).toBeGreaterThanOrEqual(5)
  })

  it('every catalog entry has a matching blueprint file', () => {
    for (const { entry } of blueprints) {
      expect(entry.file).toBeTruthy()
      expect(entry.id).toBeTruthy()
    }
  })

  it('all blueprints pass quality validation (catalog-level)', () => {
    const result = validateCatalogQuality(blueprints.map(b => b.bp))
    if (!result.valid) {
      const failures = result.results
        .filter(r => !r.valid)
        .map(r => `${r.blueprintId}: ${r.errors.map(e => e.message).join('; ')}`)
      throw new Error(`Catalog quality check failed:\n${failures.join('\n')}`)
    }
    expect(result.valid).toBe(true)
  })
})

// ─── Per-Blueprint Tests ────────────────────────────────────────────

describe.each(blueprints.map(b => [b.entry.name, b] as const))(
  'Blueprint: %s',
  (_name, { entry, bp }) => {
    it('passes quality validation with zero errors', () => {
      const result = validateBlueprintQuality(bp)
      if (!result.valid) {
        const msgs = result.errors.map(e => `  [${e.rule}] ${e.message}`).join('\n')
        throw new Error(`Quality validation failed for "${entry.id}":\n${msgs}`)
      }
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('includes all 9 core components in required_components', () => {
      for (const coreId of REQUIRED_CORE_COMPONENTS) {
        expect(bp.required_components).toContain(coreId)
      }
    })

    it(`includes ≥${MIN_COMPLEMENTARY} complementary components`, () => {
      const all = new Set([...bp.required_components, ...(bp.optional_components ?? [])])
      let count = 0
      for (const compId of COMPLEMENTARY_POOL) {
        if (all.has(compId)) count++
      }
      expect(count).toBeGreaterThanOrEqual(MIN_COMPLEMENTARY)
    })

    it('has required compliance types: privacy, terms, accessibility', () => {
      const types = new Set(bp.compliance_blocks.map(b => b.type))
      for (const reqType of REQUIRED_COMPLIANCE_TYPES) {
        expect(types.has(reqType)).toBe(true)
      }
    })

    it('has a contact page with contact-form component', () => {
      const contactPage = bp.required_pages.find(p => p.slug === 'contact')
      expect(contactPage).toBeDefined()
      if (contactPage?.required_sections) {
        const contactSections = bp.required_sections.filter(
          s => contactPage.required_sections!.includes(s.id),
        )
        const hasForm = contactSections.some(s => s.component === 'contact-form')
        expect(hasForm).toBe(true)
      }
    })

    it('has about page or about section', () => {
      const hasAboutPage = bp.required_pages.some(p => p.slug === 'about')
      const hasAboutSection = bp.required_sections.some(
        s => s.component === 'text-block' && s.id.includes('about'),
      )
      expect(hasAboutPage || hasAboutSection).toBe(true)
    })

    it('has services/offerings section', () => {
      const serviceComponents = ['service-list', 'icon-card-grid', 'card-grid']
      const hasServices = bp.required_sections.some(s =>
        serviceComponents.includes(s.component),
      )
      expect(hasServices).toBe(true)
    })

    it('has ≥3 style presets', () => {
      expect(bp.style_presets.length).toBeGreaterThanOrEqual(3)
    })

    it('has valid watermark profile', () => {
      expect(bp.demo_watermark_profile.enabled).toBe(true)
      expect(bp.demo_watermark_profile.text.trim().length).toBeGreaterThan(0)
      expect(bp.demo_watermark_profile.opacity).toBeGreaterThan(0)
      expect(bp.demo_watermark_profile.opacity).toBeLessThanOrEqual(1)
    })

    it('has complete SEO profile', () => {
      expect(bp.seo_profile.title_pattern).toBeTruthy()
      expect(bp.seo_profile.description_pattern).toBeTruthy()
      expect(bp.seo_profile.schema_type).toBeTruthy()
      expect(bp.seo_profile.og_image_pattern).toBeTruthy()
      expect(bp.seo_profile.keywords.length).toBeGreaterThanOrEqual(3)
    })

    it('has at least one CTA section', () => {
      const hasCta = bp.required_sections.some(
        s => s.component === 'cta-block' && s.required !== false,
      )
      expect(hasCta).toBe(true)
    })

    it('has matching demo content fixture', () => {
      const demoPath = resolve(BLUEPRINTS_DIR, 'demo-content', `${entry.file.replace('.json', '.demo.json')}`)
      const raw = readFileSync(demoPath, 'utf-8')
      const demo = JSON.parse(raw)
      expect(demo.blueprint_id).toBe(bp.id)
      expect(demo.business_name).toBeTruthy()
      expect(demo.city).toBeTruthy()
      expect(demo.state).toBeTruthy()
    })
  },
)
