/**
 * Content Uniqueness Engine
 *
 * Generates deterministic, unique content for each site.
 * Uses seeded PRNG to ensure same siteId always produces same content.
 */

import type {
  ContentKit,
  ContentKitMeta,
  ContentGenerationOptions,
  SelectedCopy,
  SelectedFAQ,
  TemplateContext,
  FAQTemplate,
  CopyVariantSet,
} from './content.types'
import type { VerticalPack } from '../verticals/verticals.types'
import { getVerticalPack } from '../verticals/verticals.registry'
import { createSiteRandom, selectOne, selectMany, shuffleArray } from '../media/media-selector'

// ─── Constants ───────────────────────────────────────────────

const CONTENT_KIT_VERSION = '1.0.0'
const DEFAULT_FAQ_COUNT = 4
const DEFAULT_TRUST_BADGE_COUNT = 3

// ─── Template Interpolation ──────────────────────────────────

/**
 * Interpolate template variables in a string.
 * Replaces {{variable}} with values from context.
 */
export function interpolateTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = context[key]
    if (value !== undefined) {
      return String(value)
    }
    // Leave placeholder if no value provided
    return match
  })
}

/**
 * Check if a template has unresolved placeholders.
 */
export function hasUnresolvedPlaceholders(text: string): boolean {
  return /\{\{\w+\}\}/.test(text)
}

/**
 * Extract placeholder names from a template.
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

// ─── Copy Selection ──────────────────────────────────────────

/**
 * Select a single copy variant from a variant set.
 */
function selectCopyVariant(
  variantSet: CopyVariantSet,
  random: () => number,
  context: TemplateContext,
): SelectedCopy {
  const index = Math.floor(random() * variantSet.variants.length)
  const template = variantSet.variants[index]
  const interpolated = interpolateTemplate(template, context)

  return {
    template,
    interpolated,
    variantIndex: index,
  }
}

/**
 * Select a copy variant with fallback for missing fields.
 */
function selectCopyVariantWithFallback(
  copyTemplates: Record<string, CopyVariantSet>,
  key: string,
  random: () => number,
  context: TemplateContext,
  fallbackVariants: string[],
): SelectedCopy {
  const variantSet = copyTemplates[key]
  if (variantSet && variantSet.variants.length > 0) {
    return selectCopyVariant(variantSet, random, context)
  }

  // Use fallback
  const index = Math.floor(random() * fallbackVariants.length)
  const template = fallbackVariants[index]
  return {
    template,
    interpolated: interpolateTemplate(template, context),
    variantIndex: index,
  }
}

// ─── FAQ Selection ───────────────────────────────────────────

/**
 * Select and interpolate FAQ items.
 */
function selectFAQs(
  faqTemplates: FAQTemplate[],
  count: number,
  random: () => number,
  context: TemplateContext,
): SelectedFAQ[] {
  if (!faqTemplates || faqTemplates.length === 0) {
    return []
  }

  const actualCount = Math.min(count, faqTemplates.length)
  const shuffled = shuffleArray([...faqTemplates], random)
  const selected = shuffled.slice(0, actualCount)

  return selected.map(faq => ({
    question: interpolateTemplate(faq.question, context),
    answer: interpolateTemplate(faq.answerTemplate, context),
    originalTemplate: faq,
  }))
}

// ─── Trust Badge Selection ───────────────────────────────────

/**
 * Select trust badge labels from variant set.
 */
function selectTrustBadges(
  copyTemplates: Record<string, CopyVariantSet>,
  count: number,
  random: () => number,
): string[] {
  const variantSet = copyTemplates['trustBadges']
  if (!variantSet || variantSet.variants.length === 0) {
    return []
  }

  const actualCount = Math.min(count, variantSet.variants.length)
  const shuffled = shuffleArray([...variantSet.variants], random)
  return shuffled.slice(0, actualCount)
}

// ─── Default Fallbacks ───────────────────────────────────────

const FALLBACK_COPIES = {
  heroHeadline: [
    'Welcome to Our Business',
    'Quality Service You Can Trust',
    'Your Success Is Our Priority',
  ],
  heroSubheadline: [
    'We are committed to excellence in everything we do.',
    'Serving our clients with dedication and expertise.',
    'Contact us today to learn more about our services.',
  ],
  aboutIntro: [
    'We are a dedicated team committed to providing exceptional service.',
    'Our mission is to deliver quality and value to every client.',
    'With years of experience, we bring expertise to every project.',
  ],
  ctaText: [
    'Get Started',
    'Contact Us',
    'Learn More',
  ],
  ctaSecondaryText: [
    'View Our Services',
    'About Us',
    'See Our Work',
  ],
  servicesHeader: [
    'Our Services',
    'What We Offer',
    'How We Help',
  ],
  contactHeader: [
    'Contact Us',
    'Get In Touch',
    'Reach Out',
  ],
}

// ─── Content Kit Generation ──────────────────────────────────

/**
 * Generate a complete content kit for a site.
 *
 * Uses seeded random to ensure deterministic output:
 * - Same siteId + verticalId always produces same content
 * - Different sites get different copy combinations
 *
 * @param siteId - Unique site identifier (used as seed)
 * @param verticalId - Vertical pack ID to get copy templates from
 * @param options - Generation options including context
 */
export function generateContentKit(
  siteId: string,
  verticalId: string,
  options: ContentGenerationOptions = {},
): ContentKit | null {
  const vertical = getVerticalPack(verticalId)
  if (!vertical) {
    console.warn(`[generateContentKit] Vertical not found: ${verticalId}`)
    return null
  }

  const {
    context = {},
    faqCount = DEFAULT_FAQ_COUNT,
    trustBadgeCount = DEFAULT_TRUST_BADGE_COUNT,
    salt = 'content',
  } = options

  // Create seeded random generator
  const random = createSiteRandom(siteId, salt)

  // Get copy templates from vertical
  const copyTemplates = vertical.copyTemplates as Record<string, CopyVariantSet> || {}
  const faqTemplates = (vertical.copyTemplates as { faqQuestions?: FAQTemplate[] })?.faqQuestions || []

  // Select copy for each field
  const heroHeadline = selectCopyVariantWithFallback(
    copyTemplates,
    'heroHeadline',
    random,
    context,
    FALLBACK_COPIES.heroHeadline,
  )

  const heroSubheadline = selectCopyVariantWithFallback(
    copyTemplates,
    'heroSubheadline',
    random,
    context,
    FALLBACK_COPIES.heroSubheadline,
  )

  const aboutIntro = selectCopyVariantWithFallback(
    copyTemplates,
    'aboutIntro',
    random,
    context,
    FALLBACK_COPIES.aboutIntro,
  )

  const ctaText = selectCopyVariantWithFallback(
    copyTemplates,
    'ctaText',
    random,
    context,
    FALLBACK_COPIES.ctaText,
  )

  const ctaSecondaryText = selectCopyVariantWithFallback(
    copyTemplates,
    'ctaSecondaryText',
    random,
    context,
    FALLBACK_COPIES.ctaSecondaryText,
  )

  const servicesHeader = selectCopyVariantWithFallback(
    copyTemplates,
    'servicesHeader',
    random,
    context,
    FALLBACK_COPIES.servicesHeader,
  )

  const contactHeader = selectCopyVariantWithFallback(
    copyTemplates,
    'contactHeader',
    random,
    context,
    FALLBACK_COPIES.contactHeader,
  )

  // Select FAQs
  const faqs = selectFAQs(faqTemplates, faqCount, random, context)

  // Select trust badges
  const trustBadges = selectTrustBadges(copyTemplates, trustBadgeCount, random)

  // Build metadata
  const meta: ContentKitMeta = {
    generatedAt: new Date().toISOString(),
    seed: siteId,
    generatorVersion: CONTENT_KIT_VERSION,
    variantsUsed: {
      heroHeadline: heroHeadline.variantIndex,
      heroSubheadline: heroSubheadline.variantIndex,
      aboutIntro: aboutIntro.variantIndex,
      ctaText: ctaText.variantIndex,
      ctaSecondaryText: ctaSecondaryText.variantIndex,
      servicesHeader: servicesHeader.variantIndex,
      contactHeader: contactHeader.variantIndex,
    },
  }

  return {
    siteId,
    verticalId,
    heroHeadline,
    heroSubheadline,
    aboutIntro,
    ctaText,
    ctaSecondaryText,
    servicesHeader,
    contactHeader,
    faqs,
    trustBadges,
    meta,
  }
}

/**
 * Regenerate copy for a specific field.
 * Uses a different salt to get a new variant.
 */
export function regenerateCopyField(
  siteId: string,
  verticalId: string,
  field: keyof typeof FALLBACK_COPIES,
  excludeIndex?: number,
  context: TemplateContext = {},
): SelectedCopy | null {
  const vertical = getVerticalPack(verticalId)
  if (!vertical) return null

  const copyTemplates = vertical.copyTemplates as Record<string, CopyVariantSet> || {}
  const variantSet = copyTemplates[field]

  if (!variantSet || variantSet.variants.length === 0) {
    // Use fallbacks
    const fallbacks = FALLBACK_COPIES[field]
    const filteredFallbacks = excludeIndex !== undefined
      ? fallbacks.filter((_, i) => i !== excludeIndex)
      : fallbacks

    if (filteredFallbacks.length === 0) return null

    const random = createSiteRandom(siteId, `regen-${field}-${Date.now()}`)
    const index = Math.floor(random() * filteredFallbacks.length)
    const template = filteredFallbacks[index]

    return {
      template,
      interpolated: interpolateTemplate(template, context),
      variantIndex: index,
    }
  }

  // Filter out excluded index
  const availableIndices = variantSet.variants
    .map((_, i) => i)
    .filter(i => i !== excludeIndex)

  if (availableIndices.length === 0) return null

  const random = createSiteRandom(siteId, `regen-${field}-${Date.now()}`)
  const indexOfIndex = Math.floor(random() * availableIndices.length)
  const selectedIndex = availableIndices[indexOfIndex]
  const template = variantSet.variants[selectedIndex]

  return {
    template,
    interpolated: interpolateTemplate(template, context),
    variantIndex: selectedIndex,
  }
}

/**
 * Validate a content kit for completeness.
 */
export function validateContentKit(kit: ContentKit): {
  valid: boolean
  missingFields: string[]
  unresolvedPlaceholders: string[]
} {
  const missingFields: string[] = []
  const unresolvedPlaceholders: string[] = []

  // Check required fields
  const requiredFields: (keyof ContentKit)[] = [
    'heroHeadline',
    'heroSubheadline',
    'aboutIntro',
    'ctaText',
  ]

  for (const field of requiredFields) {
    const value = kit[field] as SelectedCopy | undefined
    if (!value || !value.interpolated) {
      missingFields.push(field)
    } else if (hasUnresolvedPlaceholders(value.interpolated)) {
      unresolvedPlaceholders.push(field)
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    unresolvedPlaceholders,
  }
}

/**
 * Get copy for a specific field without generating full kit.
 * Useful for previewing or updating individual fields.
 */
export function getFieldCopy(
  siteId: string,
  verticalId: string,
  field: keyof typeof FALLBACK_COPIES,
  context: TemplateContext = {},
): SelectedCopy | null {
  const vertical = getVerticalPack(verticalId)
  if (!vertical) return null

  const copyTemplates = vertical.copyTemplates as Record<string, CopyVariantSet> || {}
  const random = createSiteRandom(siteId, field)

  return selectCopyVariantWithFallback(
    copyTemplates,
    field,
    random,
    context,
    FALLBACK_COPIES[field],
  )
}
