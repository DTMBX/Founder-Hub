/**
 * content-schema.ts — Zod validation schemas for all structured content.
 *
 * These schemas mirror the TypeScript interfaces in types.ts but add
 * runtime validation so the visual builder can catch malformed data
 * before it reaches components or gets persisted to disk.
 *
 * Usage:
 *   import { SectionSchema, validateSections } from '@/lib/content-schema'
 *   const result = validateSections(rawJson)
 *   if (!result.success) console.warn(result.error)
 */

import { z } from 'zod'

// ─── Section ────────────────────────────────────────────────────────────────

export const SectionTypeSchema = z.enum([
  'hero', 'about', 'projects', 'offerings', 'services',
  'investor', 'court', 'proof', 'contact', 'governance',
  'now', 'how-it-works', 'faq', 'final-cta',
])

export const SectionSchema = z.object({
  id: z.string().min(1),
  type: SectionTypeSchema,
  title: z.string(),
  content: z.string(),
  order: z.number(),
  enabled: z.boolean(),
  investorRelevant: z.boolean(),
})

export const SectionsArraySchema = z.array(SectionSchema)

// ─── Site Settings ──────────────────────────────────────────────────────────

export const HeroMediaSettingsSchema = z.object({
  videoUrl: z.string().optional(),
  posterUrl: z.string().optional(),
  overlayIntensity: z.number().min(0).max(1),
  vignetteEnabled: z.boolean(),
  textAlignment: z.enum(['left', 'center']),
  headlineText: z.string(),
  subheadText: z.string(),
  ctaPrimary: z.object({ label: z.string(), url: z.string() }).optional(),
  ctaSecondary: z.object({ label: z.string(), url: z.string() }).optional(),
  motionMode: z.enum(['full', 'reduced', 'off']),
  autoContrast: z.boolean(),
})

export const SiteSettingsSchema = z.object({
  siteName: z.string().min(1),
  tagline: z.string(),
  description: z.string(),
  primaryDomain: z.string(),
  domainRedirects: z.array(z.string()),
  socialPreviewImage: z.string().optional(),
  analyticsEnabled: z.boolean(),
  indexingEnabled: z.boolean(),
  investorModeAvailable: z.boolean(),
  motionLevel: z.enum(['full', 'reduced', 'off']).optional(),
  glassIntensity: z.enum(['low', 'medium', 'high']).optional(),
  gradientUsage: z.enum(['off', 'accent', 'enhanced']).optional(),
  contrastMode: z.enum(['standard', 'extra']).optional(),
  heroMedia: HeroMediaSettingsSchema.optional(),
  stripePublishableKey: z.string().optional(),
  stripeEnabled: z.boolean().optional(),
  stripeSuccessUrl: z.string().optional(),
  stripeCancelUrl: z.string().optional(),
})

// ─── Links ──────────────────────────────────────────────────────────────────

export const LinkSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  url: z.string(),
  icon: z.string().optional(),
  category: z.string(),
  order: z.number(),
})

export const LinksArraySchema = z.array(LinkSchema)

// ─── Projects ───────────────────────────────────────────────────────────────

export const ProjectLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  type: z.enum(['repo', 'demo', 'docs', 'other']),
})

export const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  techStack: z.array(z.string()),
  links: z.array(ProjectLinkSchema),
  heroMedia: z.object({
    type: z.enum(['image', 'video']),
    url: z.string(),
  }).optional(),
  order: z.number(),
  enabled: z.boolean(),
  featured: z.boolean(),
  status: z.enum(['active', 'paused', 'archived']),
  customization: z.object({
    icon: z.string().optional(),
    accentColor: z.string().optional(),
    badgeText: z.string().optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const ProjectsArraySchema = z.array(ProjectSchema)

// ─── Offerings ──────────────────────────────────────────────────────────────

export const OfferingPriceTierSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  price: z.number().min(0),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  stripePaymentLink: z.string().optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['month', 'year']).optional(),
})

export const OfferingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string(),
  summary: z.string(),
  description: z.string(),
  category: z.enum(['digital', 'service', 'whitelabel', 'subscription', 'barter']),
  pricingType: z.enum(['free', 'paid', 'donation', 'contact', 'trade']),
  priceTiers: z.array(OfferingPriceTierSchema),
  donationSuggestions: z.array(z.number()).optional(),
  gratuityEnabled: z.boolean().optional(),
  tags: z.array(z.string()),
  icon: z.string().optional(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  turnaround: z.string().optional(),
  featured: z.boolean(),
  order: z.number(),
  visibility: z.enum(['public', 'unlisted', 'private']),
  externalUrl: z.string().optional(),
  downloadUrl: z.string().optional(),
  contactCTA: z.string().optional(),
  stripeProductId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const OfferingsArraySchema = z.array(OfferingSchema)

// ─── About ──────────────────────────────────────────────────────────────────

export const AboutContentSchema = z.object({
  mission: z.string(),
  currentFocus: z.string(),
  values: z.array(z.string()),
  updates: z.array(z.object({
    date: z.string(),
    title: z.string(),
    content: z.string(),
  })),
})

// ─── Profile ────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  ownerName: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  catchAllEmail: z.string().optional(),
  professionalEmails: z.array(z.string()).optional(),
  domain: z.string().optional(),
}).passthrough()

// ─── Investor ───────────────────────────────────────────────────────────────

export const InvestorContentSchema = z.object({
  pitchVideoUrl: z.string().optional(),
  pitchVideoThumbnail: z.string().optional(),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    date: z.string().optional(),
    status: z.string().optional(),
  })).optional(),
  documents: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
  })).optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  investmentTiers: z.array(z.object({
    name: z.string(),
    amount: z.number().optional(),
    description: z.string().optional(),
  })).optional(),
  raisingAmount: z.number().optional(),
  raisingCurrency: z.string().optional(),
  useOfFunds: z.string().optional(),
  expectedROI: z.string().optional(),
  calendlyUrl: z.string().optional(),
  meetingCTA: z.string().optional(),
  investorEmail: z.string().optional(),
  investorPhone: z.string().optional(),
}).passthrough()

// ─── Court Cases ────────────────────────────────────────────────────────────

export const TimelineEventSchema = z.object({
  id: z.string().min(1),
  date: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
})

export const CaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  docket: z.string(),
  court: z.string(),
  jurisdiction: z.string().optional(),
  parties: z.string().optional(),
  stage: z.string(),
  status: z.enum(['active', 'settled', 'pending', 'closed', 'dismissed']),
  dateRange: z.string(),
  filingDate: z.string().optional(),
  lastUpdate: z.string().optional(),
  summary: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  order: z.number(),
  visibility: z.enum(['public', 'unlisted', 'private']),
  featured: z.boolean(),
  featuredDocIds: z.array(z.string()).optional(),
  sourceNotes: z.string().optional(),
  timeline: z.array(TimelineEventSchema).optional(),
  overview: z.string().optional(),
  publicDisclosureOverride: z.string().optional(),
  reviewNotes: z.object({
    damagesInjuries: z.string().optional(),
    keyEvidenceSources: z.string().optional(),
    deadlinesLimitations: z.string().optional(),
    reliefSought: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  contingencyChecklist: z.array(z.object({
    id: z.string(),
    label: z.string(),
    checked: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
  lastUpdated: z.number(),
  createdAt: z.number(),
})

export const CasesArraySchema = z.array(CaseSchema)

// ─── Landing Section Config ─────────────────────────────────────────────────

/** LandingSectionType excludes 'hero' — this matches landing.config.ts */
export const LandingSectionTypeSchema = z.enum([
  'about', 'governance', 'projects', 'offerings', 'services',
  'investor', 'court', 'proof', 'contact',
  'how-it-works', 'faq', 'final-cta',
])

export const LandingSectionConfigSchema = z.object({
  id: z.string().min(1),
  type: LandingSectionTypeSchema,
  enabled: z.boolean(),
  order: z.number(),
  investorRelevant: z.boolean().optional(),
  legalRelevant: z.boolean().optional(),
  marketplaceRelevant: z.boolean().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
})

// ─── Validation helpers ─────────────────────────────────────────────────────

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: z.ZodIssue[] }

function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    issues: result.error.issues,
  }
}

export const validateSections = (data: unknown) => validate(SectionsArraySchema, data)
export const validateSettings = (data: unknown) => validate(SiteSettingsSchema, data)
export const validateLinks = (data: unknown) => validate(LinksArraySchema, data)
export const validateProjects = (data: unknown) => validate(ProjectsArraySchema, data)
export const validateOfferings = (data: unknown) => validate(OfferingsArraySchema, data)
export const validateAbout = (data: unknown) => validate(AboutContentSchema, data)
export const validateCases = (data: unknown) => validate(CasesArraySchema, data)
export const validateProfile = (data: unknown) => validate(ProfileSchema, data)
export const validateInvestor = (data: unknown) => validate(InvestorContentSchema, data)

// ─── KV Key → Schema Map ────────────────────────────────────────────────────

/**
 * Maps KV storage keys to their Zod validation schema.
 * Used by the studio to validate data before writing.
 */
export const KV_SCHEMAS: Record<string, z.ZodType> = {
  'founder-hub-settings': SiteSettingsSchema,
  'founder-hub-sections': SectionsArraySchema,
  'founder-hub-projects': ProjectsArraySchema,
  'founder-hub-court-cases': CasesArraySchema,
  'founder-hub-proof-links': LinksArraySchema,
  'founder-hub-contact-links': LinksArraySchema,
  'founder-hub-profile': ProfileSchema,
  'founder-hub-about': AboutContentSchema,
  'founder-hub-offerings': OfferingsArraySchema,
  'founder-hub-investor': InvestorContentSchema,
}

/** Validate any KV value by its key. Returns null if no schema registered. */
export function validateKV(key: string, data: unknown): ValidationResult<unknown> | null {
  const schema = KV_SCHEMAS[key]
  if (!schema) return null
  return validate(schema, data)
}
