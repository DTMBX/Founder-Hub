/**
 * Preset System — Public API
 *
 * Re-exports all preset types, definitions, and utilities.
 */

// Types
export type {
  SpacingTokens,
  TypographyTokens,
  RadiusTokens,
  ShadowTokens,
  ButtonTokens,
  ThemeTokenOverrides,
  LawFirmSectionDefaults,
  SMBSectionDefaults,
  AgencySectionDefaults,
  SectionDefaults,
  PresetBase,
  LawFirmPreset,
  SMBPreset,
  AgencyPreset,
  Preset,
  PresetTypeMap,
  AppliedPresetMeta,
  PresetRegistry,
} from './presets.types'

// Law Firm Presets
export {
  LAWFIRM_PRESETS,
  LAWFIRM_CLASSIC_NAVY,
  LAWFIRM_MODERN_SLATE,
  LAWFIRM_EXECUTIVE_BURGUNDY,
  LAWFIRM_MINIMAL_WHITE,
  getLawFirmPreset,
} from './lawfirm.presets'

// SMB Presets
export {
  SMB_PRESETS,
  SMB_FRIENDLY_MODERN,
  SMB_CLEAN_PROFESSIONAL,
  SMB_WARM_ARTISAN,
  SMB_BOLD_VIBRANT,
  SMB_ELEGANT_MINIMAL,
  getSMBPreset,
} from './smb.presets'

// Agency Presets
export {
  AGENCY_PRESETS,
  AGENCY_DARK_STUDIO,
  AGENCY_LIGHT_MINIMAL,
  AGENCY_CREATIVE_GRADIENT,
  AGENCY_CORPORATE_BLUE,
  getAgencyPreset,
} from './agency.presets'

// Apply Engine
export {
  getPresetsForType,
  getPresetById,
  applyPreset,
  applyPresetWithMeta,
  resetToPreset,
} from './applyPreset'
