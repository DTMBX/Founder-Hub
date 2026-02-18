/**
 * Preview Montage Definitions
 *
 * Defines the montages for each marketing offer.
 * Each offer gets a video preview showcasing relevant site styles.
 */

import type { PreviewMontage, PreviewScene, ViewportConfig } from './preview.types'

// ─── Constants ───────────────────────────────────────────────

/** Generator version for cache invalidation */
export const PREVIEW_GENERATOR_VERSION = '1.0.0'

/** Default viewport for desktop recordings */
export const DEFAULT_VIEWPORT: ViewportConfig = {
  width: 1280,
  height: 720,
  deviceScaleFactor: 1,
  isMobile: false,
}

/** Mobile viewport for responsive previews */
export const MOBILE_VIEWPORT: ViewportConfig = {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  isMobile: true,
}

/** Default scene duration in seconds */
export const DEFAULT_SCENE_DURATION = 2.0

// ─── Helper: Create Scene ────────────────────────────────────

let sceneCounter = 0

/**
 * Create a scene with sensible defaults.
 */
function createScene(
  label: string,
  siteType: 'law-firm' | 'small-business' | 'agency',
  verticalId: string,
  presetId: string,
  overrides: Partial<PreviewScene> = {},
): PreviewScene {
  sceneCounter++
  return {
    sceneId: `scene-${sceneCounter.toString().padStart(3, '0')}`,
    label,
    siteType,
    verticalId,
    presetId,
    cameraMotion: 'scroll-down',
    scrollStart: 0,
    scrollEnd: 0.4,
    ...overrides,
  }
}

// ─── Law Firm Offer Montage ──────────────────────────────────

/**
 * "Law Firm – 72 Hour Launch" offer montage.
 * Showcases different law practice types with specialized presets.
 */
export const LAW_FIRM_72_HOUR_MONTAGE: PreviewMontage = {
  offerId: 'law-firm-72-hour-launch',
  title: 'Law Firm – 72 Hour Launch',
  description: 'Professional law firm websites for every practice area. Live in 72 hours.',
  defaultDurationSeconds: 1.8,
  viewport: DEFAULT_VIEWPORT,
  defaultCameraMotion: 'scroll-down',
  transitionStyle: 'cut',
  outputFormat: 'webm',
  scenes: [
    createScene(
      'Criminal Defense',
      'law-firm',
      'lawfirm_criminal',
      'criminal-defense-dark',
      { scrollEnd: 0.35 },
    ),
    createScene(
      'Personal Injury',
      'law-firm',
      'lawfirm_personal_injury',
      'personal-injury-bold',
      { scrollEnd: 0.4 },
    ),
    createScene(
      'Family Law',
      'law-firm',
      'lawfirm_family',
      'family-law-warm',
      { scrollEnd: 0.35 },
    ),
    createScene(
      'Immigration',
      'law-firm',
      'lawfirm_immigration',
      'immigration-hope',
      { scrollEnd: 0.4 },
    ),
    createScene(
      'Civil Rights',
      'law-firm',
      'lawfirm_civil_rights',
      'civil-rights-justice',
      { scrollEnd: 0.35 },
    ),
    createScene(
      'Business Law',
      'law-firm',
      'lawfirm_business',
      'business-law-corporate',
      { scrollEnd: 0.4, cameraMotion: 'pan-hero' },
    ),
  ],
}

// ─── Small Business Offer Montage ────────────────────────────

/**
 * "Small Business Starter" offer montage.
 * Showcases various SMB verticals with vibrant presets.
 */
export const SMALL_BUSINESS_STARTER_MONTAGE: PreviewMontage = {
  offerId: 'small-business-starter',
  title: 'Small Business Starter',
  description: 'Professional websites for local businesses. Get online fast.',
  defaultDurationSeconds: 2.0,
  viewport: DEFAULT_VIEWPORT,
  defaultCameraMotion: 'scroll-down',
  transitionStyle: 'cut',
  outputFormat: 'webm',
  scenes: [
    createScene(
      'Contractor',
      'small-business',
      'smb_contractor',
      'smb-friendly-modern',
      { scrollEnd: 0.4 },
    ),
    createScene(
      'Restaurant',
      'small-business',
      'smb_restaurant',
      'smb-warm-artisan',
      { scrollEnd: 0.45 },
    ),
    createScene(
      'Medical Practice',
      'small-business',
      'smb_medical',
      'smb-clean-professional',
      { scrollEnd: 0.35 },
    ),
    createScene(
      'Salon & Spa',
      'small-business',
      'smb_salon',
      'smb-elegant-minimal',
      { scrollEnd: 0.4 },
    ),
    createScene(
      'Auto Shop',
      'small-business',
      'smb_auto',
      'smb-bold-vibrant',
      { scrollEnd: 0.4 },
    ),
    createScene(
      'Retail Store',
      'small-business',
      'smb_retail',
      'smb-friendly-modern',
      { scrollEnd: 0.35 },
    ),
  ],
}

// ─── Agency Offer Montage ────────────────────────────────────

/**
 * "Digital Agency Pro" offer montage.
 * Showcases agency-style portfolio websites.
 */
export const AGENCY_PRO_MONTAGE: PreviewMontage = {
  offerId: 'digital-agency-pro',
  title: 'Digital Agency Pro',
  description: 'Showcase your agency with a modern portfolio site.',
  defaultDurationSeconds: 2.2,
  viewport: DEFAULT_VIEWPORT,
  defaultCameraMotion: 'scroll-down',
  transitionStyle: 'cut',
  outputFormat: 'webm',
  scenes: [
    createScene(
      'Dark Studio',
      'agency',
      'agency_general',
      'agency-dark-studio',
      { cameraMotion: 'pan-hero', scrollEnd: 0.3 },
    ),
    createScene(
      'Creative Gradient',
      'agency',
      'agency_design',
      'agency-creative-gradient',
      { scrollEnd: 0.4 },
    ),
    createScene(
      'Corporate Blue',
      'agency',
      'agency_marketing',
      'agency-corporate-blue',
      { scrollEnd: 0.35 },
    ),
    createScene(
      'Light Minimal',
      'agency',
      'agency_development',
      'agency-light-minimal',
      { scrollEnd: 0.4, cameraMotion: 'scroll-down' },
    ),
  ],
}

// ─── Premium Package Montage ─────────────────────────────────

/**
 * "Premium Full-Service" offer montage.
 * Showcases the best of all site types for premium positioning.
 */
export const PREMIUM_FULL_SERVICE_MONTAGE: PreviewMontage = {
  offerId: 'premium-full-service',
  title: 'Premium Full-Service',
  description: 'The complete package. All features. Premium support.',
  defaultDurationSeconds: 1.5,
  viewport: DEFAULT_VIEWPORT,
  defaultCameraMotion: 'scroll-down',
  transitionStyle: 'cut',
  outputFormat: 'webm',
  scenes: [
    // Best law firm preset
    createScene(
      'Executive Law',
      'law-firm',
      'lawfirm_general',
      'lawfirm-executive-burgundy',
      { cameraMotion: 'pan-hero' },
    ),
    // Best SMB preset
    createScene(
      'Professional SMB',
      'small-business',
      'smb_medical',
      'smb-clean-professional',
    ),
    // Best agency preset
    createScene(
      'Creative Agency',
      'agency',
      'agency_design',
      'agency-creative-gradient',
      { cameraMotion: 'pan-hero' },
    ),
    // Another law firm
    createScene(
      'Modern Law',
      'law-firm',
      'lawfirm_personal_injury',
      'lawfirm-modern-slate',
    ),
    // Another SMB
    createScene(
      'Artisan Business',
      'small-business',
      'smb_restaurant',
      'smb-warm-artisan',
    ),
    // Final agency shot
    createScene(
      'Dark Portfolio',
      'agency',
      'agency_general',
      'agency-dark-studio',
      { cameraMotion: 'pan-hero', scrollEnd: 0.25 },
    ),
  ],
}

// ─── Export All Montages ─────────────────────────────────────

/**
 * All preview montage definitions.
 */
export const PREVIEW_MONTAGES: PreviewMontage[] = [
  LAW_FIRM_72_HOUR_MONTAGE,
  SMALL_BUSINESS_STARTER_MONTAGE,
  AGENCY_PRO_MONTAGE,
  PREMIUM_FULL_SERVICE_MONTAGE,
]

/**
 * Get a montage by offer ID.
 */
export function getMontageByOfferId(offerId: string): PreviewMontage | null {
  return PREVIEW_MONTAGES.find(m => m.offerId === offerId) ?? null
}

/**
 * Get all offer IDs.
 */
export function getAllOfferIds(): string[] {
  return PREVIEW_MONTAGES.map(m => m.offerId)
}

/**
 * Get total scene count across all montages.
 */
export function getTotalSceneCount(): number {
  return PREVIEW_MONTAGES.reduce((sum, m) => sum + m.scenes.length, 0)
}
