/**
 * apps/sitegen/blueprints/validateBlueprintQuality.ts
 *
 * Validates that a blueprint meets the B23 quality standard.
 * Fail-closed: any missing requirement produces a validation error.
 */

// ─── Required Component IDs ───────────────────────────────────────

/** Core UX components every blueprint must include in required_components. */
export const REQUIRED_CORE_COMPONENTS: readonly string[] = [
  'hero-banner',
  'site-header',
  'nav-bar',
  'site-footer',
  'cta-block',
  'contact-form',
  'faq-accordion',
  'testimonial-carousel',
  'trust-badge-row',
] as const

/** Complementary component pool — blueprint must include ≥6 across required + optional. */
export const COMPLEMENTARY_POOL: readonly string[] = [
  'stats-counter',
  'pricing-table',
  'process-timeline',
  'team-grid',
  'image-gallery',
  'portfolio-grid',
  'project-showcase',
  'blog-feed',
  'case-results-table',
  'before-after-slider',
  'logo-bar',
  'partner-logo-bar',
  'social-proof-bar',
  'badge-grid',
  'hours-widget',
  'event-list',
] as const

export const MIN_COMPLEMENTARY = 6

/** Required compliance block types. */
export const REQUIRED_COMPLIANCE_TYPES: readonly string[] = [
  'privacy',
  'terms',
  'accessibility',
] as const

/** Valid watermark positions. */
export const VALID_WATERMARK_POSITIONS: readonly string[] = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'diagonal',
] as const

// ─── Blueprint Shape (loose — accepts parsed JSON) ────────────────

export interface BlueprintForQuality {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly required_pages: readonly { slug: string; title: string; required_sections?: readonly string[] }[]
  readonly required_sections: readonly { id: string; component: string; required?: boolean }[]
  readonly required_components: readonly string[]
  readonly optional_components?: readonly string[]
  readonly style_presets: readonly string[]
  readonly compliance_blocks: readonly { id: string; type: string; required?: boolean }[]
  readonly content_requirements: {
    readonly min_pages: number
    readonly min_sections: number
    readonly min_words_per_page: number
    readonly require_contact_info: boolean
    readonly require_business_name: boolean
  }
  readonly demo_watermark_profile: {
    readonly enabled: boolean
    readonly text: string
    readonly opacity: number
    readonly position: string
  }
  readonly seo_profile: {
    readonly title_pattern: string
    readonly description_pattern: string
    readonly schema_type: string
    readonly og_image_pattern: string
    readonly keywords: readonly string[]
  }
}

// ─── Validation Result ────────────────────────────────────────────

export interface QualityError {
  readonly rule: string
  readonly message: string
}

export interface QualityResult {
  readonly valid: boolean
  readonly blueprintId: string
  readonly errors: readonly QualityError[]
  readonly complementaryCount: number
}

// ─── Validator ────────────────────────────────────────────────────

/**
 * Validate a blueprint against the B23 quality standard.
 * Returns all errors (does not short-circuit).
 */
export function validateBlueprintQuality(blueprint: BlueprintForQuality): QualityResult {
  const errors: QualityError[] = []
  const allComponents = new Set([
    ...blueprint.required_components,
    ...(blueprint.optional_components ?? []),
  ])

  // 1. Core UX components
  for (const coreId of REQUIRED_CORE_COMPONENTS) {
    if (!blueprint.required_components.includes(coreId)) {
      errors.push({
        rule: 'core-component-missing',
        message: `Required core component missing from required_components: ${coreId}`,
      })
    }
  }

  // 2. Complementary minimum
  let complementaryCount = 0
  for (const compId of COMPLEMENTARY_POOL) {
    if (allComponents.has(compId)) complementaryCount++
  }
  if (complementaryCount < MIN_COMPLEMENTARY) {
    errors.push({
      rule: 'complementary-minimum',
      message: `Blueprint must include at least ${MIN_COMPLEMENTARY} complementary components, found ${complementaryCount}.`,
    })
  }

  // 3. Required pages
  const pageSlugs = new Set(blueprint.required_pages.map(p => p.slug))
  if (!pageSlugs.has('contact')) {
    errors.push({ rule: 'page-contact', message: 'Missing required page: contact' })
  }
  if (blueprint.required_pages.length < blueprint.content_requirements.min_pages) {
    errors.push({
      rule: 'page-minimum',
      message: `Blueprint declares min_pages=${blueprint.content_requirements.min_pages} but only has ${blueprint.required_pages.length} pages.`,
    })
  }

  // 4. CTA check — at least one required CTA section
  const hasRequiredCta = blueprint.required_sections.some(
    s => s.component === 'cta-block' && s.required !== false,
  )
  if (!hasRequiredCta) {
    errors.push({ rule: 'cta-required', message: 'At least one required CTA section must exist.' })
  }

  // 5. Contact form in contact page
  const contactPage = blueprint.required_pages.find(p => p.slug === 'contact')
  if (contactPage?.required_sections) {
    const contactSections = blueprint.required_sections.filter(
      s => contactPage.required_sections!.includes(s.id),
    )
    const hasContactForm = contactSections.some(s => s.component === 'contact-form')
    if (!hasContactForm) {
      errors.push({ rule: 'contact-form-placement', message: 'Contact page must include contact-form section.' })
    }
  }

  // 6. About content
  const hasAboutPage = pageSlugs.has('about')
  const hasAboutSection = blueprint.required_sections.some(
    s => s.component === 'text-block' && s.id.includes('about'),
  )
  if (!hasAboutPage && !hasAboutSection) {
    errors.push({ rule: 'about-content', message: 'Missing About page or About section.' })
  }

  // 7. Services/Offerings content
  const serviceComponents = ['service-list', 'icon-card-grid', 'card-grid']
  const hasServices = blueprint.required_sections.some(s => serviceComponents.includes(s.component))
  if (!hasServices) {
    errors.push({ rule: 'services-content', message: 'Missing services/offerings section.' })
  }

  // 8. Compliance blocks
  const complianceTypes = new Set(blueprint.compliance_blocks.map(b => b.type))
  for (const reqType of REQUIRED_COMPLIANCE_TYPES) {
    if (!complianceTypes.has(reqType)) {
      errors.push({ rule: 'compliance-missing', message: `Missing required compliance block type: ${reqType}` })
    }
  }

  // 9. Style presets minimum
  if (blueprint.style_presets.length < 3) {
    errors.push({ rule: 'presets-minimum', message: 'Blueprint must include at least 3 style presets.' })
  }

  // 10. Watermark profile
  const wp = blueprint.demo_watermark_profile
  if (!wp.enabled) {
    errors.push({ rule: 'watermark-enabled', message: 'demo_watermark_profile.enabled must be true.' })
  }
  if (!wp.text || wp.text.trim().length === 0) {
    errors.push({ rule: 'watermark-text', message: 'demo_watermark_profile.text must be non-empty.' })
  }
  if (wp.opacity <= 0 || wp.opacity > 1) {
    errors.push({ rule: 'watermark-opacity', message: 'demo_watermark_profile.opacity must be >0 and ≤1.' })
  }
  if (!VALID_WATERMARK_POSITIONS.includes(wp.position)) {
    errors.push({ rule: 'watermark-position', message: `Invalid watermark position: ${wp.position}` })
  }

  // 11. SEO profile
  const seo = blueprint.seo_profile
  if (!seo.title_pattern) errors.push({ rule: 'seo-title', message: 'seo_profile.title_pattern required.' })
  if (!seo.description_pattern) errors.push({ rule: 'seo-description', message: 'seo_profile.description_pattern required.' })
  if (!seo.schema_type) errors.push({ rule: 'seo-schema', message: 'seo_profile.schema_type required.' })
  if (!seo.og_image_pattern) errors.push({ rule: 'seo-og', message: 'seo_profile.og_image_pattern required.' })
  if (!seo.keywords || seo.keywords.length < 3) {
    errors.push({ rule: 'seo-keywords', message: 'seo_profile.keywords must have at least 3 entries.' })
  }

  // 12. Content requirements sanity
  if (!blueprint.content_requirements.require_contact_info) {
    errors.push({ rule: 'content-contact', message: 'content_requirements.require_contact_info must be true.' })
  }
  if (!blueprint.content_requirements.require_business_name) {
    errors.push({ rule: 'content-business-name', message: 'content_requirements.require_business_name must be true.' })
  }

  return {
    valid: errors.length === 0,
    blueprintId: blueprint.id,
    errors,
    complementaryCount,
  }
}

/**
 * Validate all blueprints in a catalog. Fail-closed: returns invalid
 * if ANY blueprint fails.
 */
export function validateCatalogQuality(
  blueprints: readonly BlueprintForQuality[],
): { valid: boolean; results: readonly QualityResult[] } {
  const results = blueprints.map(validateBlueprintQuality)
  return {
    valid: results.every(r => r.valid),
    results,
  }
}
