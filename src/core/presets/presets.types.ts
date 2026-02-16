/**
 * Preset System Types
 *
 * Defines the shape of design/layout presets that can be applied
 * to sites without overwriting custom-edited fields.
 *
 * Presets control:
 *  - Typography & spacing tokens
 *  - Color palette overrides
 *  - Section enable/disable defaults
 *  - Hero style defaults
 *  - Button styling tokens
 *  - Layout preferences
 */

import type { SiteType } from '@/lib/types'

// ─── Theme Token Overrides ───────────────────────────────────

/**
 * Spacing scale tokens (0-12).
 * Values in rem/px. Applied to margins, paddings, gaps.
 */
export interface SpacingTokens {
  xs: string   // 0.25rem
  sm: string   // 0.5rem
  md: string   // 1rem
  lg: string   // 1.5rem
  xl: string   // 2rem
  '2xl': string // 3rem
  '3xl': string // 4rem
}

/**
 * Typography scale tokens.
 * Font sizes for different semantic levels.
 */
export interface TypographyTokens {
  fontFamily: {
    heading: string
    body: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
  }
  fontWeight: {
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: string
    normal: string
    relaxed: string
  }
}

/**
 * Border radius scale tokens.
 */
export interface RadiusTokens {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
  full: string
}

/**
 * Shadow scale tokens.
 */
export interface ShadowTokens {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
}

/**
 * Button styling tokens.
 */
export interface ButtonTokens {
  borderRadius: string
  paddingX: string
  paddingY: string
  fontSize: string
  fontWeight: number
  textTransform: 'none' | 'uppercase' | 'capitalize'
}

/**
 * Combined theme token overrides that presets can specify.
 * All fields are optional — only specified fields override defaults.
 */
export interface ThemeTokenOverrides {
  spacing?: Partial<SpacingTokens>
  typography?: Partial<TypographyTokens>
  radius?: Partial<RadiusTokens>
  shadows?: Partial<ShadowTokens>
  buttons?: Partial<ButtonTokens>
  colors?: {
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    backgroundColor?: string
    textColor?: string
    mutedColor?: string
  }
}

// ─── Section Defaults ────────────────────────────────────────

/**
 * Section visibility/ordering defaults for law firm sites.
 */
export interface LawFirmSectionDefaults {
  heroStyle?: 'solid' | 'gradient' | 'image'
  showPracticeAreas?: boolean
  showAttorneys?: boolean
  showTestimonials?: boolean
  showCaseResults?: boolean
  showBlog?: boolean
  showIntakeForm?: boolean
  sectionOrder?: string[]
}

/**
 * Section visibility/ordering defaults for SMB sites.
 */
export interface SMBSectionDefaults {
  heroStyle?: 'image' | 'video' | 'gradient' | 'split'
  sections?: {
    hero?: boolean
    services?: boolean
    about?: boolean
    team?: boolean
    testimonials?: boolean
    faq?: boolean
    contact?: boolean
    gallery?: boolean
    blog?: boolean
    promotions?: boolean
    map?: boolean
  }
  sectionOrder?: string[]
}

/**
 * Section visibility/ordering defaults for agency sites.
 */
export interface AgencySectionDefaults {
  showProjects?: boolean
  showPipeline?: boolean
  showInvoices?: boolean
  darkMode?: boolean
  sectionOrder?: string[]
}

/**
 * Union of all section defaults.
 */
export type SectionDefaults = LawFirmSectionDefaults | SMBSectionDefaults | AgencySectionDefaults

// ─── Preset Definition ───────────────────────────────────────

/**
 * Base preset definition shared by all site types.
 */
export interface PresetBase {
  /** Unique identifier for this preset. */
  presetId: string
  /** Human-readable label for UI display. */
  label: string
  /** Short description of the preset's visual style. */
  description: string
  /** Optional thumbnail URL for preset preview. */
  thumbnailUrl?: string
  /** Theme token overrides applied by this preset. */
  tokens: ThemeTokenOverrides
}

/**
 * Law firm preset with type-specific section defaults.
 */
export interface LawFirmPreset extends PresetBase {
  siteType: 'law-firm'
  sectionDefaults: LawFirmSectionDefaults
}

/**
 * SMB preset with type-specific section defaults.
 */
export interface SMBPreset extends PresetBase {
  siteType: 'small-business'
  sectionDefaults: SMBSectionDefaults
}

/**
 * Agency preset with type-specific section defaults.
 */
export interface AgencyPreset extends PresetBase {
  siteType: 'agency'
  sectionDefaults: AgencySectionDefaults
}

/**
 * Union of all preset types.
 */
export type Preset = LawFirmPreset | SMBPreset | AgencyPreset

/**
 * Map from siteType to corresponding preset type.
 */
export interface PresetTypeMap {
  'law-firm': LawFirmPreset
  'small-business': SMBPreset
  'agency': AgencyPreset
}

// ─── Preset Application Metadata ─────────────────────────────

/**
 * Tracks which preset is applied to a site and when.
 * Stored alongside SiteCore fields.
 */
export interface AppliedPresetMeta {
  presetId: string
  appliedAt: string       // ISO 8601
  appliedBy: string       // actor who applied
}

// ─── Preset Registry ─────────────────────────────────────────

/**
 * Get all presets for a given site type.
 */
export type PresetRegistry = {
  [K in SiteType]: PresetTypeMap[K][]
}
