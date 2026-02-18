/**
 * apps/sitegen/blueprints/__tests__/quality.test.ts
 *
 * Tests for blueprint quality validation (B23-P1).
 */

import { describe, it, expect } from 'vitest'
import {
  validateBlueprintQuality,
  validateCatalogQuality,
  REQUIRED_CORE_COMPONENTS,
  COMPLEMENTARY_POOL,
  MIN_COMPLEMENTARY,
  REQUIRED_COMPLIANCE_TYPES,
  type BlueprintForQuality,
} from '../validateBlueprintQuality.js'

// ─── Fixture: minimal valid blueprint ─────────────────────────────

function makeValidBlueprint(overrides: Partial<BlueprintForQuality> = {}): BlueprintForQuality {
  return {
    id: 'test-bp',
    name: 'Test Blueprint',
    version: '1.0.0',
    required_pages: [
      { slug: 'home', title: 'Home', required_sections: ['hero', 'cta'] },
      { slug: 'about', title: 'About', required_sections: ['about-intro'] },
      { slug: 'services', title: 'Services', required_sections: ['services-list'] },
      { slug: 'contact', title: 'Contact', required_sections: ['contact-form'] },
    ],
    required_sections: [
      { id: 'hero', component: 'hero-banner', required: true },
      { id: 'cta', component: 'cta-block', required: true },
      { id: 'about-intro', component: 'text-block', required: true },
      { id: 'services-list', component: 'service-list', required: true },
      { id: 'contact-form', component: 'contact-form', required: true },
      { id: 'testimonials', component: 'testimonial-carousel', required: true },
      { id: 'faq', component: 'faq-accordion', required: true },
      { id: 'trust', component: 'trust-badge-row', required: true },
    ],
    required_components: [
      'hero-banner', 'site-header', 'nav-bar', 'site-footer',
      'cta-block', 'contact-form', 'faq-accordion',
      'testimonial-carousel', 'trust-badge-row',
    ],
    optional_components: [
      'stats-counter', 'pricing-table', 'process-timeline',
      'team-grid', 'image-gallery', 'blog-feed',
      'case-results-table',
    ],
    style_presets: ['preset-a', 'preset-b', 'preset-c'],
    compliance_blocks: [
      { id: 'privacy', type: 'privacy', required: true },
      { id: 'terms', type: 'terms', required: true },
      { id: 'a11y', type: 'accessibility', required: true },
    ],
    content_requirements: {
      min_pages: 4,
      min_sections: 6,
      min_words_per_page: 100,
      require_contact_info: true,
      require_business_name: true,
    },
    demo_watermark_profile: {
      enabled: true,
      text: 'PREVIEW — NOT A LIVE SITE',
      opacity: 0.15,
      position: 'diagonal',
    },
    seo_profile: {
      title_pattern: '{{name}} — Services',
      description_pattern: '{{name}} provides professional services.',
      schema_type: 'Organization',
      og_image_pattern: '{{name}} — Trusted',
      keywords: ['services', 'professional', 'quality'],
    },
    ...overrides,
  }
}

// ─── Core validation ──────────────────────────────────────────────

describe('validateBlueprintQuality', () => {
  it('passes valid blueprint', () => {
    const result = validateBlueprintQuality(makeValidBlueprint())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.blueprintId).toBe('test-bp')
  })

  it('reports missing core components', () => {
    const bp = makeValidBlueprint({
      required_components: ['hero-banner', 'site-header'], // missing many
    })
    const result = validateBlueprintQuality(bp)
    expect(result.valid).toBe(false)
    const missing = result.errors.filter(e => e.rule === 'core-component-missing')
    expect(missing.length).toBeGreaterThan(0)
  })

  it('reports each missing core component individually', () => {
    const bp = makeValidBlueprint({
      required_components: [],
    })
    const result = validateBlueprintQuality(bp)
    const missing = result.errors.filter(e => e.rule === 'core-component-missing')
    expect(missing.length).toBe(REQUIRED_CORE_COMPONENTS.length)
  })

  it('reports insufficient complementary components', () => {
    const bp = makeValidBlueprint({
      optional_components: ['stats-counter'], // only 1 complementary
      required_components: [
        ...REQUIRED_CORE_COMPONENTS,
      ],
    })
    const result = validateBlueprintQuality(bp)
    const err = result.errors.find(e => e.rule === 'complementary-minimum')
    expect(err).toBeTruthy()
  })

  it('counts complementary from both required and optional', () => {
    const bp = makeValidBlueprint({
      required_components: [
        ...REQUIRED_CORE_COMPONENTS,
        'team-grid', 'stats-counter', 'pricing-table',
      ],
      optional_components: [
        'process-timeline', 'image-gallery', 'blog-feed',
      ],
    })
    const result = validateBlueprintQuality(bp)
    expect(result.complementaryCount).toBe(6)
    expect(result.errors.find(e => e.rule === 'complementary-minimum')).toBeUndefined()
  })

  it('fails if contact page missing', () => {
    const bp = makeValidBlueprint({
      required_pages: [
        { slug: 'home', title: 'Home' },
        { slug: 'about', title: 'About' },
        { slug: 'services', title: 'Services' },
        // no contact page
      ],
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'page-contact')).toBe(true)
  })

  it('fails if no required CTA section', () => {
    const bp = makeValidBlueprint({
      required_sections: [
        { id: 'hero', component: 'hero-banner', required: true },
        { id: 'cta', component: 'cta-block', required: false }, // optional, not required
        { id: 'about-intro', component: 'text-block', required: true },
        { id: 'services-list', component: 'service-list', required: true },
        { id: 'contact-form', component: 'contact-form', required: true },
        { id: 'testimonials', component: 'testimonial-carousel', required: true },
        { id: 'faq', component: 'faq-accordion', required: true },
        { id: 'trust', component: 'trust-badge-row', required: true },
      ],
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'cta-required')).toBe(true)
  })

  it('fails if about page/section missing', () => {
    const bp = makeValidBlueprint({
      required_pages: [
        { slug: 'home', title: 'Home' },
        { slug: 'services', title: 'Services' },
        { slug: 'contact', title: 'Contact', required_sections: ['contact-form'] },
        { slug: 'other', title: 'Other' },
      ],
      required_sections: [
        { id: 'hero', component: 'hero-banner', required: true },
        { id: 'cta', component: 'cta-block', required: true },
        // no about section (no text-block with 'about' in id)
        { id: 'services-list', component: 'service-list', required: true },
        { id: 'contact-form', component: 'contact-form', required: true },
        { id: 'testimonials', component: 'testimonial-carousel', required: true },
        { id: 'faq', component: 'faq-accordion', required: true },
        { id: 'trust', component: 'trust-badge-row', required: true },
      ],
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'about-content')).toBe(true)
  })

  it('fails if services section missing', () => {
    const bp = makeValidBlueprint({
      required_sections: [
        { id: 'hero', component: 'hero-banner', required: true },
        { id: 'cta', component: 'cta-block', required: true },
        { id: 'about-intro', component: 'text-block', required: true },
        // no service-list/icon-card-grid/card-grid
        { id: 'contact-form', component: 'contact-form', required: true },
        { id: 'testimonials', component: 'testimonial-carousel', required: true },
        { id: 'faq', component: 'faq-accordion', required: true },
        { id: 'trust', component: 'trust-badge-row', required: true },
      ],
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'services-content')).toBe(true)
  })

  // ─── Compliance ──────────────────────────────────────────────

  it('fails if compliance block types missing', () => {
    const bp = makeValidBlueprint({
      compliance_blocks: [
        { id: 'privacy', type: 'privacy', required: true },
        // missing terms and accessibility
      ],
    })
    const result = validateBlueprintQuality(bp)
    const compErrors = result.errors.filter(e => e.rule === 'compliance-missing')
    expect(compErrors.length).toBe(2) // terms + accessibility
  })

  it('requires all compliance types', () => {
    expect(REQUIRED_COMPLIANCE_TYPES).toContain('privacy')
    expect(REQUIRED_COMPLIANCE_TYPES).toContain('terms')
    expect(REQUIRED_COMPLIANCE_TYPES).toContain('accessibility')
  })

  // ─── Style presets ───────────────────────────────────────────

  it('fails if fewer than 3 style presets', () => {
    const bp = makeValidBlueprint({ style_presets: ['a', 'b'] })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'presets-minimum')).toBe(true)
  })

  // ─── Watermark ───────────────────────────────────────────────

  it('fails if watermark disabled', () => {
    const bp = makeValidBlueprint({
      demo_watermark_profile: { enabled: false, text: 'PREVIEW', opacity: 0.15, position: 'diagonal' },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'watermark-enabled')).toBe(true)
  })

  it('fails if watermark text empty', () => {
    const bp = makeValidBlueprint({
      demo_watermark_profile: { enabled: true, text: '', opacity: 0.15, position: 'diagonal' },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'watermark-text')).toBe(true)
  })

  it('fails if watermark opacity out of range', () => {
    const bp = makeValidBlueprint({
      demo_watermark_profile: { enabled: true, text: 'X', opacity: 0, position: 'diagonal' },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'watermark-opacity')).toBe(true)
  })

  it('fails if watermark position invalid', () => {
    const bp = makeValidBlueprint({
      demo_watermark_profile: { enabled: true, text: 'X', opacity: 0.1, position: 'invalid' },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'watermark-position')).toBe(true)
  })

  // ─── SEO ─────────────────────────────────────────────────────

  it('fails if SEO fields missing', () => {
    const bp = makeValidBlueprint({
      seo_profile: {
        title_pattern: '',
        description_pattern: '',
        schema_type: '',
        og_image_pattern: '',
        keywords: [],
      },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'seo-title')).toBe(true)
    expect(result.errors.some(e => e.rule === 'seo-description')).toBe(true)
    expect(result.errors.some(e => e.rule === 'seo-schema')).toBe(true)
    expect(result.errors.some(e => e.rule === 'seo-og')).toBe(true)
    expect(result.errors.some(e => e.rule === 'seo-keywords')).toBe(true)
  })

  it('fails if fewer than 3 keywords', () => {
    const bp = makeValidBlueprint({
      seo_profile: {
        title_pattern: 'X', description_pattern: 'X',
        schema_type: 'X', og_image_pattern: 'X',
        keywords: ['a', 'b'],
      },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'seo-keywords')).toBe(true)
  })

  // ─── Content requirements ────────────────────────────────────

  it('fails if contact info not required', () => {
    const bp = makeValidBlueprint({
      content_requirements: {
        min_pages: 4, min_sections: 6, min_words_per_page: 100,
        require_contact_info: false,
        require_business_name: true,
      },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'content-contact')).toBe(true)
  })

  it('fails if business name not required', () => {
    const bp = makeValidBlueprint({
      content_requirements: {
        min_pages: 4, min_sections: 6, min_words_per_page: 100,
        require_contact_info: true,
        require_business_name: false,
      },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.errors.some(e => e.rule === 'content-business-name')).toBe(true)
  })

  // ─── Multiple errors ─────────────────────────────────────────

  it('reports all errors, does not short-circuit', () => {
    const bp = makeValidBlueprint({
      required_components: [],
      optional_components: [],
      compliance_blocks: [],
      style_presets: [],
      demo_watermark_profile: { enabled: false, text: '', opacity: 0, position: 'bad' },
      seo_profile: {
        title_pattern: '', description_pattern: '',
        schema_type: '', og_image_pattern: '', keywords: [],
      },
      content_requirements: {
        min_pages: 4, min_sections: 6, min_words_per_page: 100,
        require_contact_info: false, require_business_name: false,
      },
    })
    const result = validateBlueprintQuality(bp)
    expect(result.valid).toBe(false)
    // Should have many errors covering multiple rules
    expect(result.errors.length).toBeGreaterThan(15)
  })
})

// ─── Catalog validation ───────────────────────────────────────────

describe('validateCatalogQuality', () => {
  it('passes if all blueprints valid', () => {
    const result = validateCatalogQuality([makeValidBlueprint(), makeValidBlueprint({ id: 'bp2' })])
    expect(result.valid).toBe(true)
    expect(result.results).toHaveLength(2)
  })

  it('fails if any blueprint invalid', () => {
    const bad = makeValidBlueprint({ id: 'bad', required_components: [] })
    const result = validateCatalogQuality([makeValidBlueprint(), bad])
    expect(result.valid).toBe(false)
  })

  it('returns individual results for each blueprint', () => {
    const result = validateCatalogQuality([
      makeValidBlueprint({ id: 'a' }),
      makeValidBlueprint({ id: 'b' }),
    ])
    expect(result.results[0].blueprintId).toBe('a')
    expect(result.results[1].blueprintId).toBe('b')
  })
})
