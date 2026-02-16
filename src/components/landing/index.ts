/**
 * Landing Module Exports
 */

export { default as LandingSections } from './LandingSections'
export type { LandingSectionsProps } from './LandingSections'

export {
  ALLOWED_SECTION_TYPES,
  DEFAULT_LANDING_CONFIG,
  filterSectionsByPathway,
  isValidSectionType
} from './landing.config'

export type {
  LandingSectionType,
  LandingSectionConfig,
  LandingConfig
} from './landing.config'
