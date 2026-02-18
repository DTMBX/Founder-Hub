/**
 * Agency Presets
 *
 * Design presets for digital agency/portfolio websites.
 * Dark and light variants with professional styling.
 */

import type { AgencyPreset } from './presets.types'

// ─── Dark Studio ─────────────────────────────────────────────

export const AGENCY_DARK_STUDIO: AgencyPreset = {
  presetId: 'agency-dark-studio',
  siteType: 'agency',
  label: 'Dark Studio',
  description: 'Dark-mode design agency aesthetic. Bold typography and high contrast.',
  tokens: {
    colors: {
      primaryColor: '#111827',
      secondaryColor: '#60a5fa',
      accentColor: '#f472b6',
      backgroundColor: '#030712',
      textColor: '#f9fafb',
      mutedColor: '#9ca3af',
    },
    typography: {
      fontFamily: {
        heading: 'Space Grotesk, system-ui, sans-serif',
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
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    showProjects: true,
    showPipeline: false,
    showInvoices: false,
    darkMode: true,
    sectionOrder: ['hero', 'projects', 'about', 'contact'],
  },
}

// ─── Light Minimal ───────────────────────────────────────────

export const AGENCY_LIGHT_MINIMAL: AgencyPreset = {
  presetId: 'agency-light-minimal',
  siteType: 'agency',
  label: 'Light Minimal',
  description: 'Clean light design with focus on the work. Subtle and sophisticated.',
  tokens: {
    colors: {
      primaryColor: '#18181b',
      secondaryColor: '#3b82f6',
      accentColor: '#6366f1',
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      mutedColor: '#71717a',
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
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
      borderRadius: '0',
      paddingX: '1.25rem',
      paddingY: '0.625rem',
      fontSize: '0.75rem',
      fontWeight: 500,
      textTransform: 'uppercase',
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '2rem',
      lg: '3rem',
      xl: '4rem',
      '2xl': '6rem',
      '3xl': '8rem',
    },
  },
  sectionDefaults: {
    showProjects: true,
    showPipeline: false,
    showInvoices: false,
    darkMode: false,
    sectionOrder: ['hero', 'projects', 'about', 'contact'],
  },
}

// ─── Creative Gradient ───────────────────────────────────────

export const AGENCY_CREATIVE_GRADIENT: AgencyPreset = {
  presetId: 'agency-creative-gradient',
  siteType: 'agency',
  label: 'Creative Gradient',
  description: 'Colorful gradient accents with modern typography. Energetic and creative.',
  tokens: {
    colors: {
      primaryColor: '#7c3aed',
      secondaryColor: '#ec4899',
      accentColor: '#06b6d4',
      backgroundColor: '#0f0f23',
      textColor: '#f8fafc',
      mutedColor: '#a1a1aa',
    },
    typography: {
      fontFamily: {
        heading: 'Plus Jakarta Sans, system-ui, sans-serif',
        body: 'Plus Jakarta Sans, system-ui, sans-serif',
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
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
      full: '9999px',
    },
    buttons: {
      borderRadius: '9999px',
      paddingX: '2rem',
      paddingY: '0.875rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    showProjects: true,
    showPipeline: false,
    showInvoices: false,
    darkMode: true,
    sectionOrder: ['hero', 'projects', 'services', 'contact'],
  },
}

// ─── Corporate Blue ──────────────────────────────────────────

export const AGENCY_CORPORATE_BLUE: AgencyPreset = {
  presetId: 'agency-corporate-blue',
  siteType: 'agency',
  label: 'Corporate Blue',
  description: 'Professional corporate aesthetic for B2B digital agencies. Trust and authority.',
  tokens: {
    colors: {
      primaryColor: '#1e3a5f',
      secondaryColor: '#0ea5e9',
      accentColor: '#22c55e',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      mutedColor: '#64748b',
    },
    typography: {
      fontFamily: {
        heading: 'IBM Plex Sans, system-ui, sans-serif',
        body: 'IBM Plex Sans, system-ui, sans-serif',
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
    showProjects: true,
    showPipeline: true,
    showInvoices: false,
    darkMode: false,
    sectionOrder: ['hero', 'services', 'projects', 'pipeline', 'contact'],
  },
}

// ─── Export All Presets ──────────────────────────────────────

export const AGENCY_PRESETS: AgencyPreset[] = [
  AGENCY_DARK_STUDIO,
  AGENCY_LIGHT_MINIMAL,
  AGENCY_CREATIVE_GRADIENT,
  AGENCY_CORPORATE_BLUE,
]

/**
 * Get an agency preset by ID.
 */
export function getAgencyPreset(presetId: string): AgencyPreset | null {
  return AGENCY_PRESETS.find((p) => p.presetId === presetId) ?? null
}
