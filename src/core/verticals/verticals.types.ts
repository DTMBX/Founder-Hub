/**
 * Vertical Packs — Type Definitions
 *
 * Verticals define business-type-specific templates, rules, and defaults
 * that shape site generation beyond visual presets.
 *
 * A vertical pack provides:
 * - Recommended presets for visual theming
 * - Required/optional field validators
 * - Default sections and ordering
 * - Copy templates (About, Services, FAQ starters)
 * - SEO defaults (title patterns, description patterns)
 * - Structured data builders (JSON-LD templates)
 * - Gallery style recommendations
 * - Trust badge configurations
 */

import type { SiteType } from '@/lib/types'

// ─── Business Type Enum ──────────────────────────────────────

/**
 * Enumeration of all supported business verticals.
 * These drive section defaults, copy templates, and media selection.
 */
export type BusinessType =
  // Law Firm Verticals
  | 'lawfirm_general'
  | 'lawfirm_criminal'
  | 'lawfirm_personal_injury'
  | 'lawfirm_family'
  | 'lawfirm_immigration'
  | 'lawfirm_real_estate'
  | 'lawfirm_civil_rights'
  | 'lawfirm_business'
  // SMB Verticals
  | 'smb_contractor'
  | 'smb_restaurant'
  | 'smb_medical'
  | 'smb_salon'
  | 'smb_auto'
  | 'smb_retail'
  | 'smb_nonprofit'
  // Agency Verticals
  | 'agency_general'
  | 'agency_design'
  | 'agency_marketing'
  | 'agency_development'

/**
 * Maps BusinessType prefixes to SiteType.
 */
export function getSiteTypeFromBusinessType(businessType: BusinessType): SiteType {
  if (businessType.startsWith('lawfirm_')) return 'law-firm'
  if (businessType.startsWith('smb_')) return 'small-business'
  if (businessType.startsWith('agency_')) return 'agency'
  throw new Error(`Unknown business type prefix: ${businessType}`)
}

// ─── Copy Templates ──────────────────────────────────────────

/**
 * Template structure for generating copy.
 * Uses {{placeholder}} syntax for variable substitution.
 */
export interface CopyTemplate {
  /** Multiple variants for uniqueness. Seed determines which is picked. */
  variants: string[]
}

/**
 * Copy templates for a vertical.
 */
export interface VerticalCopyTemplates {
  /** Hero headline templates */
  heroHeadline: CopyTemplate
  /** Hero subheadline templates */
  heroSubheadline: CopyTemplate
  /** About section intro templates */
  aboutIntro: CopyTemplate
  /** CTA button text options */
  ctaText: CopyTemplate
  /** CTA secondary text options */
  ctaSecondaryText: CopyTemplate
  /** Default FAQ questions */
  faqQuestions: Array<{
    question: string
    answerTemplate: string
  }>
  /** Trust badge / value proposition headlines */
  trustBadges: CopyTemplate
  /** Contact section header templates */
  contactHeader: CopyTemplate
  /** Services section header templates */
  servicesHeader: CopyTemplate
}

// ─── Section Defaults ────────────────────────────────────────

/**
 * Section configuration for a vertical.
 */
export interface VerticalSectionDefaults {
  /** Sections enabled by default */
  enabledSections: string[]
  /** Ordering of sections */
  sectionOrder: string[]
  /** Hero style preference */
  heroStyle?: 'solid' | 'gradient' | 'image' | 'video' | 'split'
  /** Gallery layout preference */
  galleryStyle?: 'grid' | 'masonry' | 'carousel' | 'lightbox' | 'before-after'
  /** Contact form style */
  contactStyle?: 'simple' | 'detailed' | 'intake' | 'appointment' | 'estimate' | 'hours' | 'booking' | 'donation' | 'project' | 'consultation'
  /** Show trust badges */
  showTrustBadges?: boolean
  /** Show urgency banner (for emergency services) */
  showUrgencyBanner?: boolean
}

// ─── SEO Defaults ────────────────────────────────────────────

/**
 * SEO configuration templates.
 * Uses {{placeholder}} syntax for variable substitution.
 */
export interface VerticalSEODefaults {
  /** Title pattern: "{{businessName}} | {{tagline}}" */
  titlePattern: string
  /** Meta description pattern */
  descriptionPattern: string
  /** Schema.org type for structured data */
  schemaType: string
  /** Additional schema properties */
  schemaProperties?: Record<string, unknown>
  /** OG image overlay text pattern (for generated OG images) */
  ogTextPattern: string
}

// ─── Structured Data Builder ─────────────────────────────────

/**
 * JSON-LD structured data template.
 */
export interface StructuredDataTemplate {
  '@context': 'https://schema.org'
  '@type': string
  /** Template fields with {{placeholder}} syntax */
  [key: string]: unknown
}

// ─── Trust Badges ────────────────────────────────────────────

export interface TrustBadge {
  id: string
  label: string
  icon?: string
  /** Whether this is shown by default */
  defaultEnabled: boolean
}

// ─── Field Requirements ──────────────────────────────────────

export interface FieldRequirement {
  field: string
  required: boolean
  /** Validation pattern (regex string) */
  pattern?: string
  /** Minimum length */
  minLength?: number
  /** Maximum length */
  maxLength?: number
  /** Default value if not provided */
  defaultValue?: string
}

// ─── Vertical Pack Definition ────────────────────────────────

/**
 * Complete vertical pack definition.
 * Defines everything needed to configure a site for a specific business type.
 */
export interface VerticalPack {
  /** Unique identifier matching BusinessType */
  id: BusinessType
  /** Human-readable label */
  label: string
  /** Short description */
  description: string
  /** Parent site type */
  siteType: SiteType
  /** Icon identifier for UI */
  icon?: string

  // ─── Design ───
  /** Recommended preset IDs for this vertical */
  recommendedPresets: string[]
  /** Default preset to apply if user doesn't choose */
  defaultPreset: string

  // ─── Content ───
  /** Copy templates for generating unique content */
  copyTemplates: VerticalCopyTemplates
  /** Section configuration */
  sectionDefaults: VerticalSectionDefaults
  /** Trust badges available for this vertical */
  trustBadges: TrustBadge[]

  // ─── SEO & Metadata ───
  /** SEO defaults */
  seoDefaults: VerticalSEODefaults
  /** JSON-LD structured data template */
  structuredDataTemplate: StructuredDataTemplate

  // ─── Validation ───
  /** Field requirements beyond base validation */
  fieldRequirements: FieldRequirement[]

  // ─── Media ───
  /** Media category for stock image selection */
  mediaCategory: string
  /** Gallery style preference */
  galleryStyle: 'grid' | 'masonry' | 'carousel' | 'lightbox' | 'before-after'
  /** Hero image style preference */
  heroImageStyle: 'photo' | 'gradient' | 'abstract' | 'illustration' | 'solid'

  // ─── CTA Configuration ───
  /** Primary CTA style */
  ctaStyle: 'standard' | 'urgent' | 'consultation' | 'booking' | 'project' | 'estimate' | 'donation'
  /** Phone CTA emphasis (0-1 scale) */
  phoneEmphasis: number
}

// ─── Applied Vertical Metadata ───────────────────────────────

/**
 * Tracks which vertical pack is applied to a site.
 */
export interface AppliedVerticalMeta {
  verticalId: BusinessType
  appliedAt: number       // Unix timestamp (Date.now())
  appliedBy: string       // actor who applied
}

// ─── Vertical Registry Type ──────────────────────────────────

/**
 * Registry of all vertical packs by business type.
 */
export type VerticalRegistry = {
  [K in BusinessType]?: VerticalPack
}
