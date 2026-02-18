/**
 * apps/sitegen/preview/WatermarkEnforcer.ts
 *
 * Enforces that all preview outputs include a watermark.
 * Fail-closed: if watermark cannot be verified, the preview is blocked.
 *
 * This module works with both the blueprint's `demo_watermark_profile`
 * and the pipeline's watermark step to guarantee visual distinction
 * between preview and published output.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface WatermarkProfile {
  readonly enabled: boolean
  readonly text: string
  readonly opacity: number
  readonly position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'diagonal'
}

export interface WatermarkEnforcementResult {
  readonly enforced: boolean
  readonly profile: WatermarkProfile | null
  readonly violations: readonly string[]
}

// ─── Constants ───────────────────────────────────────────────────────

/** Minimum opacity to ensure watermark is visible. */
export const MIN_WATERMARK_OPACITY = 0.05

/** Maximum opacity to prevent watermark from obscuring content. */
export const MAX_WATERMARK_OPACITY = 0.5

/** Default watermark text when blueprint doesn't specify one. */
export const DEFAULT_WATERMARK_TEXT = 'PREVIEW — NOT A LIVE SITE'

/** Default watermark position. */
export const DEFAULT_WATERMARK_POSITION: WatermarkProfile['position'] = 'diagonal'

// ─── Valid Positions ─────────────────────────────────────────────────

const VALID_POSITIONS: readonly WatermarkProfile['position'][] = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'diagonal',
] as const

// ─── Enforcer ────────────────────────────────────────────────────────

/**
 * Validate and enforce a watermark profile.
 * Returns the normalized profile (with defaults applied) and any violations.
 *
 * If the profile is null/undefined or disabled, enforcement fails.
 * This is fail-closed: no profile = no preview allowed.
 */
export function enforceWatermark(
  profile: WatermarkProfile | null | undefined,
): WatermarkEnforcementResult {
  const violations: string[] = []

  if (!profile) {
    return {
      enforced: false,
      profile: null,
      violations: ['No watermark profile provided. Preview blocked.'],
    }
  }

  if (!profile.enabled) {
    violations.push('Watermark is disabled. All preview outputs must be watermarked.')
  }

  const text = profile.text?.trim()
  if (!text || text.length === 0) {
    violations.push('Watermark text is empty. A visible identifier is required.')
  }

  if (profile.opacity < MIN_WATERMARK_OPACITY) {
    violations.push(
      `Watermark opacity ${profile.opacity} is below minimum ${MIN_WATERMARK_OPACITY}. Watermark would be invisible.`,
    )
  }

  if (profile.opacity > MAX_WATERMARK_OPACITY) {
    violations.push(
      `Watermark opacity ${profile.opacity} exceeds maximum ${MAX_WATERMARK_OPACITY}. Watermark would obscure content.`,
    )
  }

  if (!VALID_POSITIONS.includes(profile.position)) {
    violations.push(`Invalid watermark position: "${profile.position}".`)
  }

  if (violations.length > 0) {
    return { enforced: false, profile, violations }
  }

  return { enforced: true, profile, violations: [] }
}

/**
 * Build a safe default watermark profile for use when
 * the blueprint profile is invalid or missing.
 */
export function buildDefaultWatermarkProfile(): WatermarkProfile {
  return {
    enabled: true,
    text: DEFAULT_WATERMARK_TEXT,
    opacity: 0.15,
    position: DEFAULT_WATERMARK_POSITION,
  }
}

/**
 * Normalize a watermark profile by applying defaults to missing/invalid fields.
 * Always returns an enabled, valid profile.
 */
export function normalizeWatermarkProfile(
  profile: Partial<WatermarkProfile> | null | undefined,
): WatermarkProfile {
  const defaults = buildDefaultWatermarkProfile()
  if (!profile) return defaults

  const text = profile.text?.trim() || defaults.text
  const opacity = (
    profile.opacity !== undefined
    && profile.opacity >= MIN_WATERMARK_OPACITY
    && profile.opacity <= MAX_WATERMARK_OPACITY
  ) ? profile.opacity : defaults.opacity

  const position = (
    profile.position && VALID_POSITIONS.includes(profile.position)
  ) ? profile.position : defaults.position

  return {
    enabled: true, // Always enabled for previews
    text,
    opacity,
    position,
  }
}
