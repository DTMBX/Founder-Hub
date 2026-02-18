/**
 * Apply Vertical Pack Engine
 *
 * Applies vertical pack configurations to site data, providing
 * business-type-specific defaults for copy, sections, SEO, and more.
 *
 * The vertical pack system is designed to work alongside the preset
 * system: presets handle visual styling, verticals handle content
 * and structural defaults.
 *
 * Key behaviors:
 * - Never overwrites existing content that differs from template defaults
 * - Uses deterministic selection based on siteId for variant choices
 * - Records application metadata for audit purposes
 */

import type { BusinessType, VerticalPack, AppliedVerticalMeta } from './verticals.types'
import { getVerticalPack } from './verticals.registry'

// ─── Seeded Random Variant Selection ─────────────────────────

/**
 * Simple seeded PRNG for deterministic variant selection.
 * Uses FNV-1a hash algorithm for consistent results.
 *
 * @param seed - String seed (typically siteId)
 * @returns Number between 0 and 1
 */
function seededRandom(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return (hash % 10000) / 10000
}

/**
 * Select a variant index deterministically based on siteId.
 *
 * @param siteId - Unique site identifier for seeding
 * @param variantCount - Number of available variants
 * @param field - Field name to vary selection between fields
 * @returns Index of selected variant
 */
function selectVariantIndex(siteId: string, variantCount: number, field: string): number {
  const seed = `${siteId}:${field}`
  const random = seededRandom(seed)
  return Math.floor(random * variantCount)
}

/**
 * Select a copy variant deterministically.
 *
 * @param siteId - Site identifier for seeding
 * @param variants - Array of variant strings
 * @param field - Field name
 * @returns Selected variant string
 */
export function selectCopyVariant(siteId: string, variants: string[], field: string): string {
  if (variants.length === 0) return ''
  if (variants.length === 1) return variants[0]
  const index = selectVariantIndex(siteId, variants.length, field)
  return variants[index]
}

// ─── Template Variable Replacement ───────────────────────────

/**
 * Variables that can be interpolated into copy templates.
 */
export interface TemplateVariables {
  firmName?: string
  businessName?: string
  agencyName?: string
  phone?: string
  email?: string
  location?: string
  yearsInBusiness?: string | number
  foundedYear?: string | number
  practiceAreas?: string
  services?: string
  tagline?: string
  [key: string]: string | number | undefined
}

/**
 * Replace template variables in a string.
 * Variables are denoted by {{variableName}}.
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns String with variables replaced
 */
export function interpolateTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key]
    if (value === undefined) return `{{${key}}}`
    return String(value)
  })
}

// ─── Resolved Copy Output ────────────────────────────────────

/**
 * Resolved copy values after variant selection and interpolation.
 */
export interface ResolvedCopy {
  heroHeadline: string
  heroSubheadline: string
  aboutIntro: string
  ctaText: string
  ctaSecondaryText: string
  trustBadges: string
  contactHeader: string
  servicesHeader: string
}

/**
 * Select and interpolate all copy templates for a site.
 *
 * @param pack - Vertical pack with copy templates
 * @param siteId - Site identifier for deterministic selection
 * @param variables - Template variables for interpolation
 * @returns Resolved copy strings
 */
export function resolveCopyTemplates(
  pack: VerticalPack,
  siteId: string,
  variables: TemplateVariables,
): ResolvedCopy {
  const templates = pack.copyTemplates

  const selectAndInterpolate = (
    field: keyof typeof templates,
  ): string => {
    const template = templates[field]
    if (!template) return ''
    if ('variants' in template) {
      const selected = selectCopyVariant(siteId, template.variants, field)
      return interpolateTemplate(selected, variables)
    }
    return ''
  }

  return {
    heroHeadline: selectAndInterpolate('heroHeadline'),
    heroSubheadline: selectAndInterpolate('heroSubheadline'),
    aboutIntro: selectAndInterpolate('aboutIntro'),
    ctaText: selectAndInterpolate('ctaText'),
    ctaSecondaryText: selectAndInterpolate('ctaSecondaryText'),
    trustBadges: selectAndInterpolate('trustBadges'),
    contactHeader: selectAndInterpolate('contactHeader'),
    servicesHeader: selectAndInterpolate('servicesHeader'),
  }
}

// ─── Vertical Application Result ─────────────────────────────

/**
 * Result of applying a vertical pack.
 */
export interface VerticalApplicationResult {
  /** Selected copy values (after variant selection + interpolation) */
  copy: ResolvedCopy
  /** Section visibility and ordering defaults */
  sectionDefaults: VerticalPack['sectionDefaults']
  /** Trust badges with default enabled state */
  trustBadges: VerticalPack['trustBadges']
  /** SEO pattern defaults */
  seoDefaults: VerticalPack['seoDefaults']
  /** Recommended preset IDs for this vertical */
  recommendedPresets: string[]
  /** Default preset to apply */
  defaultPreset: string
  /** CTA style recommendation */
  ctaStyle: VerticalPack['ctaStyle']
  /** Phone emphasis level (0-1) */
  phoneEmphasis: number
  /** Media category for generation */
  mediaCategory: string
  /** Metadata about the application */
  meta: AppliedVerticalMeta
}

/**
 * Apply a vertical pack to generate site defaults.
 *
 * This function does NOT mutate site data directly. Instead, it
 * returns a result object that can be merged into site data by
 * the calling code (respecting field provenance rules).
 *
 * @param businessType - The business type identifier
 * @param siteId - Site identifier for deterministic variant selection
 * @param variables - Template variables for copy interpolation
 * @returns VerticalApplicationResult or null if vertical not found
 *
 * @example
 * ```ts
 * const result = applyVerticalPack('lawfirm_criminal', 'site-123', {
 *   firmName: 'Johnson Defense',
 *   phone: '555-123-4567',
 *   location: 'Austin, TX',
 * })
 *
 * if (result) {
 *   console.log(result.copy.heroHeadline)
 *   // "Aggressive Criminal Defense When You Need It Most"
 * }
 * ```
 */
export function applyVerticalPack(
  businessType: BusinessType,
  siteId: string,
  variables: TemplateVariables = {},
): VerticalApplicationResult | null {
  const pack = getVerticalPack(businessType)
  if (!pack) return null

  const copy = resolveCopyTemplates(pack, siteId, variables)

  return {
    copy,
    sectionDefaults: pack.sectionDefaults,
    trustBadges: pack.trustBadges,
    seoDefaults: pack.seoDefaults,
    recommendedPresets: pack.recommendedPresets,
    defaultPreset: pack.defaultPreset,
    ctaStyle: pack.ctaStyle,
    phoneEmphasis: pack.phoneEmphasis,
    mediaCategory: pack.mediaCategory,
    meta: {
      verticalId: businessType,
      appliedAt: Date.now(),
      appliedBy: 'system',
    },
  }
}

// ─── FAQ Resolution ──────────────────────────────────────────

/**
 * Resolved FAQ item after interpolation.
 */
export interface ResolvedFAQ {
  question: string
  answer: string
}

/**
 * Resolve FAQ templates with variable interpolation.
 *
 * @param pack - Vertical pack with FAQ templates
 * @param variables - Template variables
 * @returns Array of resolved FAQ items
 */
export function resolveFAQs(
  pack: VerticalPack,
  variables: TemplateVariables,
): ResolvedFAQ[] {
  const faqTemplates = pack.copyTemplates.faqQuestions
  if (!faqTemplates) return []

  return faqTemplates.map(faq => ({
    question: faq.question,
    answer: interpolateTemplate(faq.answerTemplate, variables),
  }))
}

// ─── SEO Resolution ──────────────────────────────────────────

/**
 * Resolved SEO values.
 */
export interface ResolvedSEO {
  title: string
  description: string
  ogText: string
  schemaType: string
}

/**
 * Resolve SEO patterns with variable interpolation.
 *
 * @param pack - Vertical pack with SEO defaults
 * @param variables - Template variables
 * @returns Resolved SEO values
 */
export function resolveSEO(
  pack: VerticalPack,
  variables: TemplateVariables,
): ResolvedSEO {
  const seo = pack.seoDefaults
  return {
    title: interpolateTemplate(seo.titlePattern, variables),
    description: interpolateTemplate(seo.descriptionPattern, variables),
    ogText: interpolateTemplate(seo.ogTextPattern, variables),
    schemaType: seo.schemaType,
  }
}

// ─── Structured Data Resolution ──────────────────────────────

/**
 * Resolve structured data template with variable interpolation.
 *
 * @param pack - Vertical pack with structured data template
 * @param variables - Template variables
 * @returns JSON-LD object with variables interpolated
 */
export function resolveStructuredData(
  pack: VerticalPack,
  variables: TemplateVariables,
): Record<string, unknown> {
  const template = pack.structuredDataTemplate

  // Deep clone and interpolate
  const interpolateValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return interpolateTemplate(value, variables)
    }
    if (Array.isArray(value)) {
      return value.map(interpolateValue)
    }
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) {
        result[k] = interpolateValue(v)
      }
      return result
    }
    return value
  }

  return interpolateValue(template) as Record<string, unknown>
}
