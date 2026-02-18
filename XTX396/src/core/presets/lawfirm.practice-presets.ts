/**
 * Law Firm Practice-Type Presets
 *
 * Specialized design presets for each law firm practice area.
 * Each preset is tailored to the emotional tone and expectations
 * of clients seeking that type of legal representation.
 */

import type { LawFirmPreset } from './presets.types'

// ─── Criminal Defense Presets ────────────────────────────────

/**
 * Dark and serious, conveying strength and determination.
 * For clients facing serious criminal charges who need a fighter.
 */
export const CRIMINAL_DEFENSE_DARK: LawFirmPreset = {
  presetId: 'criminal-defense-dark',
  siteType: 'law-firm',
  label: 'Criminal Defense Dark',
  description: 'Dark, powerful aesthetic conveying strength and determination for criminal defense.',
  tokens: {
    colors: {
      primaryColor: '#1e293b',
      secondaryColor: '#ef4444',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      mutedColor: '#94a3b8',
    },
    typography: {
      fontFamily: {
        heading: 'Oswald, Impact, sans-serif',
        body: 'Roboto, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.25rem',
      xl: '0.375rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.25rem',
      paddingX: '1.75rem',
      paddingY: '1rem',
      fontSize: '0.875rem',
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: true,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'caseResults', 'attorneys', 'testimonials', 'contact'],
  },
}

/**
 * Steel blue professional, serious but accessible.
 */
export const CRIMINAL_DEFENSE_STEEL: LawFirmPreset = {
  presetId: 'criminal-defense-steel',
  siteType: 'law-firm',
  label: 'Criminal Defense Steel',
  description: 'Professional steel blue aesthetic, serious yet accessible for criminal defense.',
  tokens: {
    colors: {
      primaryColor: '#1e40af',
      secondaryColor: '#64748b',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      mutedColor: '#64748b',
    },
    typography: {
      fontFamily: {
        heading: 'Montserrat, system-ui, sans-serif',
        body: 'Open Sans, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.375rem',
      paddingX: '1.5rem',
      paddingY: '0.875rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'gradient',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: true,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'caseResults', 'attorneys', 'testimonials', 'contact'],
  },
}

// ─── Personal Injury Presets ─────────────────────────────────

/**
 * Bold red accents conveying urgency and action.
 * For clients who need aggressive representation.
 */
export const PERSONAL_INJURY_BOLD: LawFirmPreset = {
  presetId: 'personal-injury-bold',
  siteType: 'law-firm',
  label: 'Personal Injury Bold',
  description: 'Bold, action-oriented design with urgent red accents for personal injury cases.',
  tokens: {
    colors: {
      primaryColor: '#b91c1c',
      secondaryColor: '#1e3a8a',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      mutedColor: '#6b7280',
    },
    typography: {
      fontFamily: {
        heading: 'Poppins, system-ui, sans-serif',
        body: 'Source Sans Pro, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 800,
      },
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.5rem',
      paddingX: '2rem',
      paddingY: '1rem',
      fontSize: '1rem',
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: true,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'caseResults', 'practiceAreas', 'testimonials', 'attorneys', 'contact'],
  },
}

/**
 * Professional with trust-building green accents.
 */
export const PERSONAL_INJURY_TRUST: LawFirmPreset = {
  presetId: 'personal-injury-trust',
  siteType: 'law-firm',
  label: 'Personal Injury Trust',
  description: 'Professional design with trust-building green accents for personal injury practices.',
  tokens: {
    colors: {
      primaryColor: '#047857',
      secondaryColor: '#0369a1',
      backgroundColor: '#f0fdf4',
      textColor: '#14532d',
      mutedColor: '#6b7280',
    },
    typography: {
      fontFamily: {
        heading: 'Nunito, system-ui, sans-serif',
        body: 'Nunito, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '9999px',
      paddingX: '1.75rem',
      paddingY: '0.875rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'solid',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: true,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'testimonials', 'caseResults', 'practiceAreas', 'attorneys', 'contact'],
  },
}

// ─── Family Law Presets ──────────────────────────────────────

/**
 * Warm and approachable, conveying compassion and understanding.
 */
export const FAMILY_LAW_WARM: LawFirmPreset = {
  presetId: 'family-law-warm',
  siteType: 'law-firm',
  label: 'Family Law Warm',
  description: 'Warm, compassionate design conveying understanding for family law matters.',
  tokens: {
    colors: {
      primaryColor: '#92400e',
      secondaryColor: '#b45309',
      backgroundColor: '#fffbeb',
      textColor: '#451a03',
      mutedColor: '#78716c',
    },
    typography: {
      fontFamily: {
        heading: 'Lora, Georgia, serif',
        body: 'Lato, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.75rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'solid',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'testimonials', 'blog', 'contact'],
  },
}

/**
 * Soft rose and sage, calming and supportive.
 */
export const FAMILY_LAW_CALM: LawFirmPreset = {
  presetId: 'family-law-calm',
  siteType: 'law-firm',
  label: 'Family Law Calm',
  description: 'Calming rose and sage palette for supportive family law representation.',
  tokens: {
    colors: {
      primaryColor: '#9d174d',
      secondaryColor: '#065f46',
      backgroundColor: '#fdf2f8',
      textColor: '#831843',
      mutedColor: '#9ca3af',
    },
    typography: {
      fontFamily: {
        heading: 'Merriweather, Georgia, serif',
        body: 'Source Sans Pro, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '9999px',
      paddingX: '1.5rem',
      paddingY: '0.625rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'gradient',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'testimonials', 'attorneys', 'blog', 'contact'],
  },
}

// ─── Immigration Law Presets ─────────────────────────────────

/**
 * Hopeful blue with welcoming accents, inspired by fresh starts.
 */
export const IMMIGRATION_HOPE: LawFirmPreset = {
  presetId: 'immigration-hope',
  siteType: 'law-firm',
  label: 'Immigration Hope',
  description: 'Hopeful, welcoming design for immigration law practices helping clients achieve their dreams.',
  tokens: {
    colors: {
      primaryColor: '#0284c7',
      secondaryColor: '#059669',
      backgroundColor: '#f0f9ff',
      textColor: '#0c4a6e',
      mutedColor: '#64748b',
    },
    typography: {
      fontFamily: {
        heading: 'Raleway, system-ui, sans-serif',
        body: 'Open Sans, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.5rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'testimonials', 'attorneys', 'blog', 'contact'],
  },
}

/**
 * Patriotic red, white, and blue theme.
 */
export const IMMIGRATION_LIBERTY: LawFirmPreset = {
  presetId: 'immigration-liberty',
  siteType: 'law-firm',
  label: 'Immigration Liberty',
  description: 'Patriotic design evoking American ideals for immigration practices.',
  tokens: {
    colors: {
      primaryColor: '#1e3a8a',
      secondaryColor: '#dc2626',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      mutedColor: '#64748b',
    },
    typography: {
      fontFamily: {
        heading: 'Playfair Display, Georgia, serif',
        body: 'Libre Franklin, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      xl: '0.5rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.25rem',
      paddingX: '1.75rem',
      paddingY: '0.875rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  },
  sectionDefaults: {
    heroStyle: 'solid',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
  },
}

// ─── Real Estate Law Presets ─────────────────────────────────

/**
 * Earth tones with professional green accents.
 */
export const REAL_ESTATE_EARTH: LawFirmPreset = {
  presetId: 'real-estate-earth',
  siteType: 'law-firm',
  label: 'Real Estate Earth',
  description: 'Professional earth tones with green accents for real estate law practices.',
  tokens: {
    colors: {
      primaryColor: '#166534',
      secondaryColor: '#854d0e',
      backgroundColor: '#fefce8',
      textColor: '#14532d',
      mutedColor: '#6b7280',
    },
    typography: {
      fontFamily: {
        heading: 'DM Serif Display, Georgia, serif',
        body: 'DM Sans, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.375rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
  },
}

/**
 * Clean modern with slate and gold.
 */
export const REAL_ESTATE_MODERN: LawFirmPreset = {
  presetId: 'real-estate-modern',
  siteType: 'law-firm',
  label: 'Real Estate Modern',
  description: 'Modern, clean design with slate and gold for contemporary real estate practices.',
  tokens: {
    colors: {
      primaryColor: '#334155',
      secondaryColor: '#ca8a04',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      mutedColor: '#94a3b8',
    },
    typography: {
      fontFamily: {
        heading: 'Outfit, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.25rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.75rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'gradient',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'testimonials', 'attorneys', 'contact'],
  },
}

// ─── Civil Rights Law Presets ────────────────────────────────

/**
 * Justice-focused with dignified blue and gold.
 */
export const CIVIL_RIGHTS_JUSTICE: LawFirmPreset = {
  presetId: 'civil-rights-justice',
  siteType: 'law-firm',
  label: 'Civil Rights Justice',
  description: 'Dignified design with justice-focused blue and gold for civil rights advocacy.',
  tokens: {
    colors: {
      primaryColor: '#1e40af',
      secondaryColor: '#ca8a04',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      mutedColor: '#64748b',
    },
    typography: {
      fontFamily: {
        heading: 'Cormorant Garamond, Georgia, serif',
        body: 'Lato, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      xl: '0.5rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.25rem',
      paddingX: '1.75rem',
      paddingY: '0.875rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  },
  sectionDefaults: {
    heroStyle: 'solid',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: true,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'caseResults', 'attorneys', 'testimonials', 'blog', 'contact'],
  },
}

/**
 * Bold advocacy with deep purple and white.
 */
export const CIVIL_RIGHTS_ADVOCATE: LawFirmPreset = {
  presetId: 'civil-rights-advocate',
  siteType: 'law-firm',
  label: 'Civil Rights Advocate',
  description: 'Bold advocacy design with deep purple for civil rights practices.',
  tokens: {
    colors: {
      primaryColor: '#7c3aed',
      secondaryColor: '#f59e0b',
      backgroundColor: '#faf5ff',
      textColor: '#581c87',
      mutedColor: '#9ca3af',
    },
    typography: {
      fontFamily: {
        heading: 'Bitter, Georgia, serif',
        body: 'Source Sans Pro, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.5rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'gradient',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: true,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'caseResults', 'testimonials', 'attorneys', 'blog', 'contact'],
  },
}

// ─── Business Law Presets ────────────────────────────────────

/**
 * Clean corporate with navy and silver.
 */
export const BUSINESS_LAW_CORPORATE: LawFirmPreset = {
  presetId: 'business-law-corporate',
  siteType: 'law-firm',
  label: 'Business Law Corporate',
  description: 'Clean corporate design with navy and silver for business law practices.',
  tokens: {
    colors: {
      primaryColor: '#0f172a',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      mutedColor: '#94a3b8',
    },
    typography: {
      fontFamily: {
        heading: 'IBM Plex Sans, system-ui, sans-serif',
        body: 'IBM Plex Sans, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.375rem',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'solid',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: false,
    showCaseResults: false,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'blog', 'contact'],
  },
}

/**
 * Premium executive with dark green and gold.
 */
export const BUSINESS_LAW_EXECUTIVE: LawFirmPreset = {
  presetId: 'business-law-executive',
  siteType: 'law-firm',
  label: 'Business Law Executive',
  description: 'Premium executive design with dark green and gold for high-end business practices.',
  tokens: {
    colors: {
      primaryColor: '#14532d',
      secondaryColor: '#d97706',
      backgroundColor: '#f0fdf4',
      textColor: '#14532d',
      mutedColor: '#6b7280',
    },
    typography: {
      fontFamily: {
        heading: 'Libre Baskerville, Georgia, serif',
        body: 'Libre Franklin, system-ui, sans-serif',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      xl: '0.5rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.25rem',
      paddingX: '1.75rem',
      paddingY: '0.875rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: true,
    showCaseResults: false,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'testimonials', 'blog', 'contact'],
  },
}

// ─── Export Practice Type Presets ────────────────────────────

/** Criminal Defense presets */
export const CRIMINAL_DEFENSE_PRESETS = [CRIMINAL_DEFENSE_DARK, CRIMINAL_DEFENSE_STEEL]

/** Personal Injury presets */
export const PERSONAL_INJURY_PRESETS = [PERSONAL_INJURY_BOLD, PERSONAL_INJURY_TRUST]

/** Family Law presets */
export const FAMILY_LAW_PRESETS = [FAMILY_LAW_WARM, FAMILY_LAW_CALM]

/** Immigration Law presets */
export const IMMIGRATION_PRESETS = [IMMIGRATION_HOPE, IMMIGRATION_LIBERTY]

/** Real Estate Law presets */
export const REAL_ESTATE_PRESETS = [REAL_ESTATE_EARTH, REAL_ESTATE_MODERN]

/** Civil Rights Law presets */
export const CIVIL_RIGHTS_PRESETS = [CIVIL_RIGHTS_JUSTICE, CIVIL_RIGHTS_ADVOCATE]

/** Business Law presets */
export const BUSINESS_LAW_PRESETS = [BUSINESS_LAW_CORPORATE, BUSINESS_LAW_EXECUTIVE]

/** All practice-type presets combined */
export const ALL_PRACTICE_TYPE_PRESETS: LawFirmPreset[] = [
  ...CRIMINAL_DEFENSE_PRESETS,
  ...PERSONAL_INJURY_PRESETS,
  ...FAMILY_LAW_PRESETS,
  ...IMMIGRATION_PRESETS,
  ...REAL_ESTATE_PRESETS,
  ...CIVIL_RIGHTS_PRESETS,
  ...BUSINESS_LAW_PRESETS,
]

/** Mapping of practice type to recommended presets */
export const PRACTICE_TYPE_PRESET_MAP: Record<string, LawFirmPreset[]> = {
  lawfirm_criminal: CRIMINAL_DEFENSE_PRESETS,
  lawfirm_personal_injury: PERSONAL_INJURY_PRESETS,
  lawfirm_family: FAMILY_LAW_PRESETS,
  lawfirm_immigration: IMMIGRATION_PRESETS,
  lawfirm_real_estate: REAL_ESTATE_PRESETS,
  lawfirm_civil_rights: CIVIL_RIGHTS_PRESETS,
  lawfirm_business: BUSINESS_LAW_PRESETS,
}

/**
 * Get presets recommended for a specific practice type vertical.
 */
export function getPresetsForPracticeType(verticalId: string): LawFirmPreset[] {
  return PRACTICE_TYPE_PRESET_MAP[verticalId] ?? []
}

/**
 * Get a practice-type preset by ID.
 */
export function getPracticeTypePreset(presetId: string): LawFirmPreset | null {
  return ALL_PRACTICE_TYPE_PRESETS.find((p) => p.presetId === presetId) ?? null
}
