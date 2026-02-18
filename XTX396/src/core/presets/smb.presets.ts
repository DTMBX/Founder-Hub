/**
 * Small Business (SMB) Presets
 *
 * Design presets for small business websites.
 * Covers various industries with appropriate styling.
 */

import type { SMBPreset } from './presets.types'

// ─── Friendly Modern ─────────────────────────────────────────

export const SMB_FRIENDLY_MODERN: SMBPreset = {
  presetId: 'smb-friendly-modern',
  siteType: 'small-business',
  label: 'Friendly Modern',
  description: 'Warm and approachable design with rounded corners and friendly colors. Great for service businesses.',
  tokens: {
    colors: {
      primaryColor: '#2563eb',
      secondaryColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      mutedColor: '#6b7280',
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
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
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'gradient',
    sections: {
      hero: true,
      services: true,
      about: true,
      team: false,
      testimonials: true,
      faq: true,
      contact: true,
      gallery: false,
      blog: false,
      promotions: false,
      map: true,
    },
    sectionOrder: ['hero', 'services', 'about', 'testimonials', 'faq', 'contact', 'map'],
  },
}

// ─── Clean Professional ──────────────────────────────────────

export const SMB_CLEAN_PROFESSIONAL: SMBPreset = {
  presetId: 'smb-clean-professional',
  siteType: 'small-business',
  label: 'Clean Professional',
  description: 'Crisp and professional look with sharp lines. Perfect for consultants and B2B services.',
  tokens: {
    colors: {
      primaryColor: '#0f172a',
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
      borderRadius: '0.25rem',
      paddingX: '1.25rem',
      paddingY: '0.625rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    sections: {
      hero: true,
      services: true,
      about: true,
      team: true,
      testimonials: true,
      faq: false,
      contact: true,
      gallery: false,
      blog: true,
      promotions: false,
      map: false,
    },
    sectionOrder: ['hero', 'services', 'about', 'team', 'testimonials', 'blog', 'contact'],
  },
}

// ─── Warm Artisan ───────────────────────────────────────────

export const SMB_WARM_ARTISAN: SMBPreset = {
  presetId: 'smb-warm-artisan',
  siteType: 'small-business',
  label: 'Warm Artisan',
  description: 'Earthy tones with handcrafted feel. Ideal for bakeries, cafes, and artisan shops.',
  tokens: {
    colors: {
      primaryColor: '#92400e',
      secondaryColor: '#d97706',
      backgroundColor: '#fffbeb',
      textColor: '#451a03',
      mutedColor: '#a16207',
    },
    typography: {
      fontFamily: {
        heading: 'Playfair Display, Georgia, serif',
        body: 'Lato, system-ui, sans-serif',
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
      paddingX: '1.75rem',
      paddingY: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  sectionDefaults: {
    heroStyle: 'image',
    sections: {
      hero: true,
      services: true,
      about: true,
      team: true,
      testimonials: true,
      faq: false,
      contact: true,
      gallery: true,
      blog: false,
      promotions: true,
      map: true,
    },
    sectionOrder: ['hero', 'about', 'services', 'gallery', 'team', 'testimonials', 'promotions', 'contact', 'map'],
  },
}

// ─── Bold Vibrant ────────────────────────────────────────────

export const SMB_BOLD_VIBRANT: SMBPreset = {
  presetId: 'smb-bold-vibrant',
  siteType: 'small-business',
  label: 'Bold Vibrant',
  description: 'High-energy design with bold colors and strong typography. Great for fitness, events, entertainment.',
  tokens: {
    colors: {
      primaryColor: '#7c3aed',
      secondaryColor: '#f43f5e',
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      mutedColor: '#71717a',
    },
    typography: {
      fontFamily: {
        heading: 'Poppins, system-ui, sans-serif',
        body: 'Poppins, system-ui, sans-serif',
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
      borderRadius: '0.75rem',
      paddingX: '2rem',
      paddingY: '1rem',
      fontSize: '1rem',
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
  sectionDefaults: {
    heroStyle: 'video',
    sections: {
      hero: true,
      services: true,
      about: false,
      team: true,
      testimonials: true,
      faq: false,
      contact: true,
      gallery: true,
      blog: false,
      promotions: true,
      map: false,
    },
    sectionOrder: ['hero', 'services', 'gallery', 'team', 'testimonials', 'promotions', 'contact'],
  },
}

// ─── Elegant Minimal ─────────────────────────────────────────

export const SMB_ELEGANT_MINIMAL: SMBPreset = {
  presetId: 'smb-elegant-minimal',
  siteType: 'small-business',
  label: 'Elegant Minimal',
  description: 'Refined minimalist aesthetic with generous whitespace. Perfect for luxury services and boutiques.',
  tokens: {
    colors: {
      primaryColor: '#18181b',
      secondaryColor: '#a3a3a3',
      backgroundColor: '#ffffff',
      textColor: '#18181b',
      mutedColor: '#a1a1aa',
    },
    typography: {
      fontFamily: {
        heading: 'Cormorant Garamond, Georgia, serif',
        body: 'Montserrat, system-ui, sans-serif',
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
      paddingX: '2rem',
      paddingY: '0.875rem',
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
    heroStyle: 'split',
    sections: {
      hero: true,
      services: true,
      about: true,
      team: false,
      testimonials: true,
      faq: false,
      contact: true,
      gallery: true,
      blog: false,
      promotions: false,
      map: false,
    },
    sectionOrder: ['hero', 'about', 'services', 'gallery', 'testimonials', 'contact'],
  },
}

// ─── Export All Presets ──────────────────────────────────────

export const SMB_PRESETS: SMBPreset[] = [
  SMB_FRIENDLY_MODERN,
  SMB_CLEAN_PROFESSIONAL,
  SMB_WARM_ARTISAN,
  SMB_BOLD_VIBRANT,
  SMB_ELEGANT_MINIMAL,
]

/**
 * Get an SMB preset by ID.
 */
export function getSMBPreset(presetId: string): SMBPreset | null {
  return SMB_PRESETS.find((p) => p.presetId === presetId) ?? null
}
