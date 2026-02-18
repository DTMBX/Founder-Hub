/**
 * Media Kit Type Definitions
 *
 * Types for the unique media generation system.
 * Each site gets a unique, deterministic media kit based on its siteId.
 */

// ─── Media Categories ────────────────────────────────────────

/**
 * Media categories aligned with vertical packs.
 * Each vertical specifies a mediaCategory that maps to image pools.
 */
export type MediaCategory =
  // Law firm categories
  | 'legal-general'
  | 'legal-criminal'
  | 'legal-injury'
  | 'legal-family'
  | 'legal-immigration'
  | 'legal-realestate'
  | 'legal-civilrights'
  | 'legal-business'
  // SMB categories
  | 'smb-contractor'
  | 'smb-restaurant'
  | 'smb-medical'
  | 'smb-salon'
  | 'smb-auto'
  | 'smb-retail'
  | 'smb-nonprofit'
  // Agency categories
  | 'agency-general'
  | 'agency-design'
  | 'agency-marketing'
  | 'agency-development'

// ─── Stock Image Reference ───────────────────────────────────

/**
 * Reference to a stock image in the catalog.
 * Uses placeholder URLs for demo mode.
 */
export interface StockImageRef {
  /** Unique identifier for the image */
  id: string
  /** Display-safe description (no copyrighted content) */
  alt: string
  /** Aspect ratio category */
  aspectRatio: 'hero' | 'square' | 'portrait' | 'landscape' | 'og'
  /** Primary color tone for matching */
  colorTone: 'warm' | 'cool' | 'neutral' | 'dark' | 'light'
  /** Tags for filtering */
  tags: string[]
  /** Placeholder URL pattern (uses picsum or similar) */
  placeholderUrl: string
  /** Optional real URL for production (if licensed) */
  productionUrl?: string
}

// ─── Image Pool ──────────────────────────────────────────────

/**
 * Pool of images for a specific category.
 */
export interface ImagePool {
  /** Category identifier */
  category: MediaCategory
  /** Hero images (wide, dramatic) */
  heroImages: StockImageRef[]
  /** Gallery images (various) */
  galleryImages: StockImageRef[]
  /** Team/headshot images */
  teamImages: StockImageRef[]
  /** Background/texture images */
  backgroundImages: StockImageRef[]
  /** OG/social images */
  ogImages: StockImageRef[]
}

// ─── Generated Media Kit ─────────────────────────────────────

/**
 * Complete media kit generated for a site.
 * All selections are deterministic based on siteId.
 */
export interface MediaKit {
  /** Site identifier used for generation */
  siteId: string
  /** Media category used */
  category: MediaCategory
  /** Selected hero image */
  heroImage: StockImageRef
  /** Selected gallery images (3-6 images) */
  galleryImages: StockImageRef[]
  /** Selected team placeholder images */
  teamImages: StockImageRef[]
  /** Selected background image */
  backgroundImage: StockImageRef
  /** Selected OG image */
  ogImage: StockImageRef
  /** Generation metadata */
  meta: MediaKitMeta
}

/**
 * Metadata about media kit generation.
 */
export interface MediaKitMeta {
  /** Timestamp of generation */
  generatedAt: number
  /** Seed used for selection */
  seed: string
  /** Version of the generator */
  generatorVersion: string
}

// ─── Color Palette Matching ──────────────────────────────────

/**
 * Color palette for matching images to brand colors.
 */
export interface ColorPalette {
  primary: string    // Hex color
  secondary: string  // Hex color
  accent?: string    // Hex color
}

/**
 * Map color tones to complementary palettes.
 */
export type ColorToneMap = Record<StockImageRef['colorTone'], string[]>

// ─── Selection Options ───────────────────────────────────────

/**
 * Options for media selection.
 */
export interface MediaSelectionOptions {
  /** Number of gallery images to select */
  galleryCount?: number
  /** Number of team images to select */
  teamCount?: number
  /** Preferred color tone */
  preferredTone?: StockImageRef['colorTone']
  /** Tags to prefer in selection */
  preferredTags?: string[]
}

/**
 * Default selection options.
 */
export const DEFAULT_SELECTION_OPTIONS: Required<MediaSelectionOptions> = {
  galleryCount: 4,
  teamCount: 3,
  preferredTone: 'neutral',
  preferredTags: [],
}
