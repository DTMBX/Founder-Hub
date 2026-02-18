/**
 * apps/sitegen/preview/HeroPresets.ts
 *
 * Curated hero configurations per business type.
 * Each preset provides a deterministic hero layout, color accent,
 * and placeholder image reference for watermarked preview rendering.
 *
 * Operators select from these — no free-form hero creation.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface HeroPreset {
  readonly id: string
  readonly label: string
  readonly businessType: string
  readonly layout: 'centered' | 'split-left' | 'split-right' | 'fullscreen-overlay'
  readonly accentColor: string
  readonly placeholderImage: string
  readonly overlayOpacity: number
  readonly ctaStyle: 'solid' | 'outline' | 'ghost'
  readonly textAlign: 'left' | 'center' | 'right'
}

// ─── Presets by Business Type ────────────────────────────────────────

export const HERO_PRESETS: readonly HeroPreset[] = [
  // Law Firm
  {
    id: 'lawfirm-authority',
    label: 'Authority',
    businessType: 'law-firm',
    layout: 'split-left',
    accentColor: '#1e3a5f',
    placeholderImage: 'placeholder-law-office.webp',
    overlayOpacity: 0.4,
    ctaStyle: 'solid',
    textAlign: 'left',
  },
  {
    id: 'lawfirm-classic-columns',
    label: 'Classic Columns',
    businessType: 'law-firm',
    layout: 'centered',
    accentColor: '#2c3e50',
    placeholderImage: 'placeholder-courthouse.webp',
    overlayOpacity: 0.5,
    ctaStyle: 'outline',
    textAlign: 'center',
  },
  {
    id: 'lawfirm-modern-trust',
    label: 'Modern Trust',
    businessType: 'law-firm',
    layout: 'fullscreen-overlay',
    accentColor: '#0f4c75',
    placeholderImage: 'placeholder-law-library.webp',
    overlayOpacity: 0.55,
    ctaStyle: 'solid',
    textAlign: 'center',
  },

  // Agency
  {
    id: 'agency-bold-impact',
    label: 'Bold Impact',
    businessType: 'agency',
    layout: 'fullscreen-overlay',
    accentColor: '#e74c3c',
    placeholderImage: 'placeholder-creative-workspace.webp',
    overlayOpacity: 0.35,
    ctaStyle: 'solid',
    textAlign: 'center',
  },
  {
    id: 'agency-minimal-split',
    label: 'Minimal Split',
    businessType: 'agency',
    layout: 'split-right',
    accentColor: '#2d3436',
    placeholderImage: 'placeholder-design-studio.webp',
    overlayOpacity: 0.2,
    ctaStyle: 'ghost',
    textAlign: 'left',
  },
  {
    id: 'agency-neon-edge',
    label: 'Neon Edge',
    businessType: 'agency',
    layout: 'centered',
    accentColor: '#6c5ce7',
    placeholderImage: 'placeholder-neon-studio.webp',
    overlayOpacity: 0.45,
    ctaStyle: 'outline',
    textAlign: 'center',
  },

  // Contractor
  {
    id: 'contractor-worksite',
    label: 'Worksite',
    businessType: 'contractor',
    layout: 'split-left',
    accentColor: '#d35400',
    placeholderImage: 'placeholder-construction-site.webp',
    overlayOpacity: 0.3,
    ctaStyle: 'solid',
    textAlign: 'left',
  },
  {
    id: 'contractor-clean-build',
    label: 'Clean Build',
    businessType: 'contractor',
    layout: 'centered',
    accentColor: '#2f3640',
    placeholderImage: 'placeholder-finished-home.webp',
    overlayOpacity: 0.4,
    ctaStyle: 'solid',
    textAlign: 'center',
  },
  {
    id: 'contractor-craft',
    label: 'Craft',
    businessType: 'contractor',
    layout: 'fullscreen-overlay',
    accentColor: '#6d4c41',
    placeholderImage: 'placeholder-workshop.webp',
    overlayOpacity: 0.5,
    ctaStyle: 'outline',
    textAlign: 'center',
  },

  // Nonprofit
  {
    id: 'nonprofit-impact',
    label: 'Impact',
    businessType: 'nonprofit',
    layout: 'centered',
    accentColor: '#27ae60',
    placeholderImage: 'placeholder-community-event.webp',
    overlayOpacity: 0.35,
    ctaStyle: 'solid',
    textAlign: 'center',
  },
  {
    id: 'nonprofit-mission-forward',
    label: 'Mission Forward',
    businessType: 'nonprofit',
    layout: 'split-left',
    accentColor: '#2980b9',
    placeholderImage: 'placeholder-volunteers.webp',
    overlayOpacity: 0.4,
    ctaStyle: 'solid',
    textAlign: 'left',
  },
  {
    id: 'nonprofit-earth-tone',
    label: 'Earth Tone',
    businessType: 'nonprofit',
    layout: 'fullscreen-overlay',
    accentColor: '#6d8e6e',
    placeholderImage: 'placeholder-nature-path.webp',
    overlayOpacity: 0.45,
    ctaStyle: 'outline',
    textAlign: 'center',
  },

  // Professional Services
  {
    id: 'proserv-confidence',
    label: 'Confidence',
    businessType: 'professional-services',
    layout: 'split-right',
    accentColor: '#34495e',
    placeholderImage: 'placeholder-office-meeting.webp',
    overlayOpacity: 0.35,
    ctaStyle: 'solid',
    textAlign: 'left',
  },
  {
    id: 'proserv-clarity',
    label: 'Clarity',
    businessType: 'professional-services',
    layout: 'centered',
    accentColor: '#1a5276',
    placeholderImage: 'placeholder-professional-office.webp',
    overlayOpacity: 0.4,
    ctaStyle: 'solid',
    textAlign: 'center',
  },
  {
    id: 'proserv-warm-welcome',
    label: 'Warm Welcome',
    businessType: 'professional-services',
    layout: 'fullscreen-overlay',
    accentColor: '#8e6e53',
    placeholderImage: 'placeholder-warm-office.webp',
    overlayOpacity: 0.5,
    ctaStyle: 'outline',
    textAlign: 'center',
  },
] as const

// ─── Lookup Helpers ──────────────────────────────────────────────────

/** Get all hero presets for a given business type. */
export function getPresetsForBusinessType(businessType: string): readonly HeroPreset[] {
  return HERO_PRESETS.filter(p => p.businessType === businessType)
}

/** Get a single hero preset by ID. */
export function getPresetById(id: string): HeroPreset | undefined {
  return HERO_PRESETS.find(p => p.id === id)
}

/** All unique business types with presets. */
export function getBusinessTypesWithPresets(): readonly string[] {
  return [...new Set(HERO_PRESETS.map(p => p.businessType))]
}
