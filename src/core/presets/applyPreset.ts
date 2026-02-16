/**
 * Apply Preset Engine
 *
 * Applies design presets to site data without overwriting
 * custom-edited fields. Only updates fields marked as "generated"
 * (see field provenance system in Commit 7).
 *
 * For now (pre-Commit 7), we apply preset values to known
 * styling fields only, preserving business content.
 */

import type {
  NormalizedSiteData,
  LawFirmSiteData,
  SMBSiteData,
  AgencySiteData,
  SiteType,
} from '@/lib/types'
import type {
  Preset,
  LawFirmPreset,
  SMBPreset,
  AgencyPreset,
  ThemeTokenOverrides,
  AppliedPresetMeta,
} from './presets.types'
import { getLawFirmPreset, LAWFIRM_PRESETS } from './lawfirm.presets'
import { getSMBPreset, SMB_PRESETS } from './smb.presets'
import { getAgencyPreset, AGENCY_PRESETS } from './agency.presets'

// ─── Preset Registry ─────────────────────────────────────────

/**
 * Get all available presets for a given site type.
 */
export function getPresetsForType(siteType: SiteType): Preset[] {
  switch (siteType) {
    case 'law-firm':
      return LAWFIRM_PRESETS
    case 'small-business':
      return SMB_PRESETS
    case 'agency':
      return AGENCY_PRESETS
  }
}

/**
 * Get a preset by ID, regardless of type.
 */
export function getPresetById(presetId: string): Preset | null {
  return (
    getLawFirmPreset(presetId) ??
    getSMBPreset(presetId) ??
    getAgencyPreset(presetId) ??
    null
  )
}

// ─── Apply Preset to Site Data ───────────────────────────────

/**
 * Apply a preset's token overrides to site branding.
 * Only updates branding colors — does not touch content.
 */
function applyTokensToBranding(
  branding: NormalizedSiteData['branding'],
  tokens: ThemeTokenOverrides,
): NormalizedSiteData['branding'] {
  return {
    ...branding,
    primaryColor: tokens.colors?.primaryColor ?? branding.primaryColor,
    secondaryColor: tokens.colors?.secondaryColor ?? branding.secondaryColor,
    // logo and favicon are never overwritten by presets
  }
}

/**
 * Apply law firm preset section defaults.
 * Only updates config section toggles, not content.
 */
function applyLawFirmPreset(
  data: LawFirmSiteData,
  preset: LawFirmPreset,
): LawFirmSiteData {
  const newBranding = applyTokensToBranding(data.branding, preset.tokens)

  // Apply section defaults to config (preserving business details)
  const newConfig = {
    ...data.config,
    primaryColor: preset.tokens.colors?.primaryColor ?? data.config.primaryColor,
    accentColor: preset.tokens.colors?.secondaryColor ?? data.config.accentColor,
    // Section toggles would be stored here if we add them to LawFirmConfig
    // For now, section visibility is managed by sectionDefaults
  }

  return {
    ...data,
    branding: newBranding,
    config: newConfig,
  }
}

/**
 * Apply SMB preset section defaults.
 */
function applySMBPreset(
  data: SMBSiteData,
  preset: SMBPreset,
): SMBSiteData {
  const newBranding = applyTokensToBranding(data.branding, preset.tokens)

  // Apply section toggles from preset
  const newSections = preset.sectionDefaults.sections
    ? { ...data.config.sections, ...preset.sectionDefaults.sections }
    : data.config.sections

  const newConfig = {
    ...data.config,
    primaryColor: preset.tokens.colors?.primaryColor ?? data.config.primaryColor,
    accentColor: preset.tokens.colors?.secondaryColor ?? data.config.accentColor,
    heroStyle: preset.sectionDefaults.heroStyle ?? data.config.heroStyle,
    sections: newSections,
    // Font tokens would be stored here:
    fontHeading: preset.tokens.typography?.fontFamily?.heading ?? data.config.fontHeading,
    fontBody: preset.tokens.typography?.fontFamily?.body ?? data.config.fontBody,
  }

  return {
    ...data,
    branding: newBranding,
    config: newConfig,
  }
}

/**
 * Apply agency preset section defaults.
 */
function applyAgencyPreset(
  data: AgencySiteData,
  preset: AgencyPreset,
): AgencySiteData {
  const newBranding = applyTokensToBranding(data.branding, preset.tokens)

  // Agency config doesn't have visual tokens, so we just update branding
  return {
    ...data,
    branding: newBranding,
  }
}

/**
 * Apply a preset to site data.
 *
 * This is a pure function: same inputs always produce the same output.
 * Only styling-related fields are updated. Business content is preserved.
 *
 * @param siteData - The current site data (NormalizedSiteData)
 * @param presetId - The preset ID to apply
 * @returns Updated site data with preset applied, or original if preset not found
 */
export function applyPreset<T extends NormalizedSiteData>(
  siteData: T,
  presetId: string,
): T {
  const preset = getPresetById(presetId)
  if (!preset) {
    console.warn(`[applyPreset] Preset not found: ${presetId}`)
    return siteData
  }

  // Type guard: ensure preset matches site type
  if (preset.siteType !== siteData.type) {
    console.warn(
      `[applyPreset] Preset type mismatch: ${preset.siteType} !== ${siteData.type}`,
    )
    return siteData
  }

  switch (siteData.type) {
    case 'law-firm':
      return applyLawFirmPreset(siteData as LawFirmSiteData, preset as LawFirmPreset) as T
    case 'small-business':
      return applySMBPreset(siteData as SMBSiteData, preset as SMBPreset) as T
    case 'agency':
      return applyAgencyPreset(siteData as AgencySiteData, preset as AgencyPreset) as T
  }
}

/**
 * Apply preset and generate metadata for tracking.
 *
 * @returns Tuple of [updatedSiteData, presetMeta]
 */
export function applyPresetWithMeta<T extends NormalizedSiteData>(
  siteData: T,
  presetId: string,
  actor: string = 'system',
): [T, AppliedPresetMeta | null] {
  const updated = applyPreset(siteData, presetId)

  // If nothing changed (preset not found or type mismatch), return null meta
  if (updated === siteData) {
    return [siteData, null]
  }

  const meta: AppliedPresetMeta = {
    presetId,
    appliedAt: new Date().toISOString(),
    appliedBy: actor,
  }

  return [updated, meta]
}

/**
 * Reset site styling to a preset's defaults.
 * Useful for "Reset to preset defaults" functionality.
 * Same as applyPreset but semantically clearer.
 */
export function resetToPreset<T extends NormalizedSiteData>(
  siteData: T,
  presetId: string,
): T {
  return applyPreset(siteData, presetId)
}

// ─── Re-export for convenience ───────────────────────────────

export { LAWFIRM_PRESETS } from './lawfirm.presets'
export { SMB_PRESETS } from './smb.presets'
export { AGENCY_PRESETS } from './agency.presets'
