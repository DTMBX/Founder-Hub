/**
 * apps/sitegen/wizard/WizardSchema.ts
 *
 * Zod schemas for the Operator Wizard step data.
 * Each step has its own schema; the full wizard state is a discriminated
 * union on `currentStep`.
 *
 * Zod 4 — schemas are strict, no extra keys allowed.
 */
import { z } from 'zod'

// ─── Constants ───────────────────────────────────────────────────────

/** Ordered step IDs — the wizard proceeds linearly through these. */
export const WIZARD_STEPS = [
  'business-type',
  'business-info',
  'style-preset',
  'content-review',
  'preview',
  'publish',
] as const

export type WizardStepId = (typeof WIZARD_STEPS)[number]

/** Valid business type IDs (must match catalog blueprint IDs). */
export const BUSINESS_TYPE_IDS = [
  'law-firm',
  'agency',
  'contractor',
  'nonprofit',
  'professional-services',
] as const

export type BusinessTypeId = (typeof BUSINESS_TYPE_IDS)[number]

// ─── Step Schemas ────────────────────────────────────────────────────

/** Step 1: Choose Business Type */
export const BusinessTypeStepSchema = z.object({
  businessTypeId: z.enum(BUSINESS_TYPE_IDS),
})
export type BusinessTypeStep = z.infer<typeof BusinessTypeStepSchema>

/** Step 2: Business Information */
export const BusinessInfoStepSchema = z.object({
  businessName: z.string().min(2, 'Business name is required (min 2 characters).'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().length(2, 'State must be a 2-letter abbreviation.'),
  phone: z.string().min(10, 'Phone number is required.').optional(),
  email: z.string().email('Valid email is required.'),
  address: z.string().min(5, 'Address is required.').optional(),
  tagline: z.string().max(120, 'Tagline must be 120 characters or fewer.').optional(),
})
export type BusinessInfoStep = z.infer<typeof BusinessInfoStepSchema>

/** Step 3: Style Preset selection */
export const StylePresetStepSchema = z.object({
  presetId: z.string().min(1, 'A style preset must be selected.'),
})
export type StylePresetStep = z.infer<typeof StylePresetStepSchema>

/** Step 4: Content Review (operator confirms or adjusts demo content) */
export const ContentReviewStepSchema = z.object({
  heroHeadline: z.string().min(1, 'Hero headline is required.').optional(),
  heroSubheadline: z.string().optional(),
  ctaText: z.string().min(1).optional(),
  confirmed: z.boolean().refine(val => val === true, {
    message: 'Content must be reviewed and confirmed before proceeding.',
  }),
})
export type ContentReviewStep = z.infer<typeof ContentReviewStepSchema>

/** Step 5: Preview — operator must view the watermarked preview */
export const PreviewStepSchema = z.object({
  previewViewed: z.boolean().refine(val => val === true, {
    message: 'Preview must be viewed before proceeding.',
  }),
  previewTimestamp: z.number().positive('Preview timestamp must be a positive number.'),
})
export type PreviewStep = z.infer<typeof PreviewStepSchema>

/** Step 6: Publish — target selection and final confirmation */
export const PublishStepSchema = z.object({
  targetId: z.enum(['hosted', 'zip', 'github_pr']),
  confirmed: z.boolean().refine(val => val === true, {
    message: 'Publish must be explicitly confirmed.',
  }),
})
export type PublishStep = z.infer<typeof PublishStepSchema>

// ─── Aggregate Wizard State ──────────────────────────────────────────

export const WizardStateSchema = z.object({
  currentStep: z.enum(WIZARD_STEPS),
  businessType: BusinessTypeStepSchema.optional(),
  businessInfo: BusinessInfoStepSchema.optional(),
  stylePreset: StylePresetStepSchema.optional(),
  contentReview: ContentReviewStepSchema.optional(),
  preview: PreviewStepSchema.optional(),
  publish: PublishStepSchema.optional(),
})

export type WizardState = z.infer<typeof WizardStateSchema>

// ─── Step Schema Lookup ──────────────────────────────────────────────

/** Map step ID → its Zod schema for runtime validation. */
export const STEP_SCHEMAS: Record<WizardStepId, z.ZodType> = {
  'business-type': BusinessTypeStepSchema,
  'business-info': BusinessInfoStepSchema,
  'style-preset': StylePresetStepSchema,
  'content-review': ContentReviewStepSchema,
  'preview': PreviewStepSchema,
  'publish': PublishStepSchema,
}

/** Data key in WizardState that holds each step's data. */
export const STEP_DATA_KEYS: Record<WizardStepId, keyof WizardState> = {
  'business-type': 'businessType',
  'business-info': 'businessInfo',
  'style-preset': 'stylePreset',
  'content-review': 'contentReview',
  'preview': 'preview',
  'publish': 'publish',
}
