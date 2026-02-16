/**
 * Preview System — Public API
 *
 * Exports types and definitions for the demo-preview video system.
 */

// Types
export type {
  PreviewScene,
  CameraMotion,
  ViewportConfig,
  PreviewMontage,
  TransitionStyle,
  OutputFormat,
  SceneMeta,
  PreviewMeta,
  AssemblyStrategy,
  PreviewGeneratorOptions,
  DemoSiteInput,
  DemoSiteResult,
} from './preview.types'

// Definitions & Constants
export {
  PREVIEW_GENERATOR_VERSION,
  DEFAULT_VIEWPORT,
  MOBILE_VIEWPORT,
  DEFAULT_SCENE_DURATION,
  LAW_FIRM_72_HOUR_MONTAGE,
  SMALL_BUSINESS_STARTER_MONTAGE,
  AGENCY_PRO_MONTAGE,
  PREMIUM_FULL_SERVICE_MONTAGE,
  PREVIEW_MONTAGES,
  getMontageByOfferId,
  getAllOfferIds,
  getTotalSceneCount,
} from './previewDefs'

// Generator Helpers
export {
  GENERATOR_VERSION,
  generateDemoSiteId,
  getDemoPreviewPath,
  getMontageOutputPath,
  getSceneThumbnailPath,
  getMontagePosterPath,
  getMontageMetaPath,
  calculateScrollPositions,
  interpolateScrollPosition,
  getSceneDuration,
  calculateTotalDuration,
  validateScene,
  validateMontage,
  createSceneMeta,
  createPreviewMeta,
  getEffectiveCameraMotion,
  isScrollingMotion,
  getScrollDirection,
} from './generatorHelpers'

// Assembler
export type {
  AssemblyOptions,
  AssemblyResult,
  AssemblyStats,
  PlaylistEntry,
  ScenePlaylist,
  ExportManifest,
} from './assembler'

export {
  DEFAULT_ASSEMBLY_OPTIONS,
  createScenePlaylist,
  generateFfmpegConcatList,
  generateFfmpegFilterComplex,
  calculateAssemblyStats,
  createMontageMetadata,
  getAssemblyPaths,
  validateAssemblyInputs,
  selectAssemblyStrategy,
  selectPosterScene,
  createExportManifest,
} from './assembler'
