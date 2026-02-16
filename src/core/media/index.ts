/**
 * Media Kit Module - Public API
 *
 * Provides unique, deterministic media selection per siteId.
 * Each site gets a unique combination of hero, gallery, team,
 * background, and OG images based on its category and seed.
 */

// ─── Types ───────────────────────────────────────────────────

export type {
  MediaCategory,
  StockImageRef,
  ImagePool,
  MediaKit,
  MediaKitMeta,
  ColorPalette,
  ColorToneMap,
  MediaSelectionOptions,
} from './media.types'

export { DEFAULT_SELECTION_OPTIONS } from './media.types'

// ─── Catalog ─────────────────────────────────────────────────

export {
  MEDIA_CATALOG,
  getImagePool,
  getAllMediaCategories,
} from './media.catalog'

// ─── Selection & Generation ──────────────────────────────────

export {
  createSiteRandom,
  selectOne,
  selectMany,
  selectWithPreference,
  shuffleArray,
  generateMediaKit,
  regenerateHeroImage,
  getImageById,
  validateMediaKit,
  MEDIA_KIT_VERSION,
} from './media-selector'
