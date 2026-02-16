/**
 * Content Uniqueness Engine Types
 *
 * Types for the deterministic content generation system.
 * Each site gets unique, reproducible content based on its siteId.
 */

// ─── Copy Template Types ─────────────────────────────────────

/**
 * A variant set contains multiple copy options for a single field.
 */
export interface CopyVariantSet {
  /** Array of copy variants to select from */
  variants: string[]
}

/**
 * A FAQ item with question and answer template.
 */
export interface FAQTemplate {
  question: string
  answerTemplate: string
}

/**
 * Context variables for template interpolation.
 */
export interface TemplateContext {
  /** Firm/business name */
  firmName?: string
  /** Business name (SMB) */
  businessName?: string
  /** Agency name */
  agencyName?: string
  /** Location/city */
  location?: string
  /** Years in business */
  yearsInBusiness?: number
  /** Phone number */
  phone?: string
  /** Email address */
  email?: string
  /** Address */
  address?: string
  /** Website URL */
  website?: string
  /** Tagline */
  tagline?: string
  /** Practice areas / services as comma-separated list */
  practiceAreas?: string
  /** Services list */
  services?: string
  /** Founded year */
  foundedYear?: number
  /** Owner/principal name */
  ownerName?: string
  /** Any additional context */
  [key: string]: string | number | undefined
}

// ─── Generated Content Types ─────────────────────────────────

/**
 * Selected copy for a specific field.
 */
export interface SelectedCopy {
  /** The raw template with placeholders */
  template: string
  /** The interpolated result (if context provided) */
  interpolated: string
  /** Index of the variant that was selected */
  variantIndex: number
}

/**
 * Selected FAQ item with interpolated values.
 */
export interface SelectedFAQ {
  question: string
  answer: string
  originalTemplate: FAQTemplate
}

/**
 * Complete content kit generated for a site.
 */
export interface ContentKit {
  /** Unique site identifier used as seed */
  siteId: string
  /** Vertical pack ID this was generated from */
  verticalId: string
  /** Hero section copy */
  heroHeadline: SelectedCopy
  heroSubheadline: SelectedCopy
  /** About section */
  aboutIntro: SelectedCopy
  /** CTA text variants */
  ctaText: SelectedCopy
  ctaSecondaryText: SelectedCopy
  /** Section headers */
  servicesHeader: SelectedCopy
  contactHeader: SelectedCopy
  /** Selected FAQ items */
  faqs: SelectedFAQ[]
  /** Selected trust badges */
  trustBadges: string[]
  /** Generation metadata */
  meta: ContentKitMeta
}

/**
 * Metadata about content kit generation.
 */
export interface ContentKitMeta {
  generatedAt: string
  seed: string
  generatorVersion: string
  variantsUsed: {
    heroHeadline: number
    heroSubheadline: number
    aboutIntro: number
    ctaText: number
    ctaSecondaryText: number
    servicesHeader: number
    contactHeader: number
  }
}

// ─── Generation Options ──────────────────────────────────────

/**
 * Options for content kit generation.
 */
export interface ContentGenerationOptions {
  /** Template context for interpolation */
  context?: TemplateContext
  /** Number of FAQs to select (default: 4) */
  faqCount?: number
  /** Number of trust badges to select (default: 3) */
  trustBadgeCount?: number
  /** Salt for further randomization */
  salt?: string
}
