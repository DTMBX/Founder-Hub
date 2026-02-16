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

// Law Firm Practice-Type Presets
export {
  CRIMINAL_DEFENSE_PRESETS,
  CRIMINAL_DEFENSE_DARK,
  CRIMINAL_DEFENSE_STEEL,
  PERSONAL_INJURY_PRESETS,
  PERSONAL_INJURY_BOLD,
  PERSONAL_INJURY_TRUST,
  FAMILY_LAW_PRESETS,
  FAMILY_LAW_WARM,
  FAMILY_LAW_CALM,
  IMMIGRATION_PRESETS,
  IMMIGRATION_HOPE,
  IMMIGRATION_LIBERTY,
  REAL_ESTATE_PRESETS,
  REAL_ESTATE_EARTH,
  REAL_ESTATE_MODERN,
  CIVIL_RIGHTS_PRESETS,
  CIVIL_RIGHTS_JUSTICE,
  CIVIL_RIGHTS_ADVOCATE,
  BUSINESS_LAW_PRESETS,
  BUSINESS_LAW_CORPORATE,
  BUSINESS_LAW_EXECUTIVE,
  ALL_PRACTICE_TYPE_PRESETS,
  PRACTICE_TYPE_PRESET_MAP,
  getPresetsForPracticeType,
  getPracticeTypePreset,
} from './lawfirm.practice-presets'

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
