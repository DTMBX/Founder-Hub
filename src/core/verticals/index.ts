/**
 * Verticals Module - Public API
 *
 * Business-type-specific configuration packs for site generation.
 * Each vertical provides copy templates, section defaults, SEO patterns,
 * and recommended presets for a specific business category.
 */

// ─── Types ───────────────────────────────────────────────────

export type {
  BusinessType,
  CopyTemplate,
  VerticalCopyTemplates,
  VerticalSectionDefaults,
  VerticalSEODefaults,
  StructuredDataTemplate,
  TrustBadge,
  FieldRequirement,
  VerticalPack,
  AppliedVerticalMeta,
  VerticalRegistry,
} from './verticals.types'

export { getSiteTypeFromBusinessType } from './verticals.types'

// ─── Registry ────────────────────────────────────────────────

export {
  ALL_VERTICALS,
  VERTICAL_REGISTRY,
  getVerticalPack,
  hasVerticalPack,
  getVerticalsBySiteType,
  getDefaultVertical,
  getAllBusinessTypes,
  getVerticalsGroupedBySiteType,
  searchVerticals,
} from './verticals.registry'

// ─── Vertical Collections ────────────────────────────────────

export { LAWFIRM_VERTICALS, getLawFirmVertical } from './verticals.lawfirm'
export { SMB_VERTICALS, getSMBVertical } from './verticals.smb'
export { AGENCY_VERTICALS, getAgencyVertical } from './verticals.agency'

// ─── Apply Engine ────────────────────────────────────────────

export {
  applyVerticalPack,
  selectCopyVariant,
  interpolateTemplate,
  resolveCopyTemplates,
  resolveFAQs,
  resolveSEO,
  resolveStructuredData,
} from './applyVerticalPack'

export type {
  TemplateVariables,
  ResolvedCopy,
  VerticalApplicationResult,
  ResolvedFAQ,
  ResolvedSEO,
} from './applyVerticalPack'
