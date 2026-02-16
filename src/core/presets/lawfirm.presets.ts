/**
 * Law Firm Presets
 *
 * Professional design presets for law firm websites.
 * Each preset defines visual styling and section defaults
 * without altering business content.
 */

import type { LawFirmPreset } from './presets.types'

// ─── Classic Navy ────────────────────────────────────────────

export const LAWFIRM_CLASSIC_NAVY: LawFirmPreset = {
  presetId: 'lawfirm-classic-navy',
  siteType: 'law-firm',
  label: 'Classic Navy',
  description: 'Traditional law firm aesthetic with navy blue and gold accents. Professional and trustworthy.',
  tokens: {
    colors: {
      primaryColor: '#1a365d',
      secondaryColor: '#c7a44a',
      backgroundColor: '#ffffff',
      textColor: '#1a202c',
      mutedColor: '#718096',
    },
    typography: {
      fontFamily: {
        heading: 'Georgia, serif',
        body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
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

// ─── Modern Slate ────────────────────────────────────────────

export const LAWFIRM_MODERN_SLATE: LawFirmPreset = {
  presetId: 'lawfirm-modern-slate',
  siteType: 'law-firm',
  label: 'Modern Slate',
  description: 'Contemporary design with clean lines and neutral slate tones. Sophisticated and modern.',
  tokens: {
    colors: {
      primaryColor: '#334155',
      secondaryColor: '#0ea5e9',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      mutedColor: '#64748b',
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
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
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0.5rem',
      paddingX: '1.25rem',
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
    showTestimonials: false,
    showCaseResults: true,
    showBlog: true,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'caseResults', 'attorneys', 'blog', 'contact'],
  },
}

// ─── Executive Burgundy ──────────────────────────────────────

export const LAWFIRM_EXECUTIVE_BURGUNDY: LawFirmPreset = {
  presetId: 'lawfirm-executive-burgundy',
  siteType: 'law-firm',
  label: 'Executive Burgundy',
  description: 'Premium executive feel with burgundy and cream. Ideal for corporate and estate law.',
  tokens: {
    colors: {
      primaryColor: '#7f1d1d',
      secondaryColor: '#d4af37',
      backgroundColor: '#fffbeb',
      textColor: '#1c1917',
      mutedColor: '#78716c',
    },
    typography: {
      fontFamily: {
        heading: 'Playfair Display, Georgia, serif',
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
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
  },
}

// ─── Minimal White ───────────────────────────────────────────

export const LAWFIRM_MINIMAL_WHITE: LawFirmPreset = {
  presetId: 'lawfirm-minimal-white',
  siteType: 'law-firm',
  label: 'Minimal White',
  description: 'Ultra-clean minimalist design with maximum whitespace. Content-focused clarity.',
  tokens: {
    colors: {
      primaryColor: '#18181b',
      secondaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      mutedColor: '#a1a1aa',
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
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
      sm: '0',
      md: '0',
      lg: '0',
      xl: '0',
      full: '9999px',
    },
    buttons: {
      borderRadius: '0',
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase',
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
  },
  sectionDefaults: {
    heroStyle: 'solid',
    showPracticeAreas: true,
    showAttorneys: true,
    showTestimonials: false,
    showCaseResults: false,
    showBlog: false,
    showIntakeForm: true,
    sectionOrder: ['hero', 'practiceAreas', 'attorneys', 'contact'],
  },
}

// ─── Export All Presets ──────────────────────────────────────

export const LAWFIRM_PRESETS: LawFirmPreset[] = [
  LAWFIRM_CLASSIC_NAVY,
  LAWFIRM_MODERN_SLATE,
  LAWFIRM_EXECUTIVE_BURGUNDY,
  LAWFIRM_MINIMAL_WHITE,
]

/**
 * Get a law firm preset by ID.
 */
export function getLawFirmPreset(presetId: string): LawFirmPreset | null {
  return LAWFIRM_PRESETS.find((p) => p.presetId === presetId) ?? null
}
