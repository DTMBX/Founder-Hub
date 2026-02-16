/**
 * Marketing Hooks — Public API
 */

export {
  useLazyVideo,
  usePrefetchOnHover,
  usePreviewMetas,
  getThumbnailUrls,
  getSceneThumbnails,
} from './useLazyMedia'

export type {
  UseLazyVideoOptions,
  UseLazyVideoResult,
  UsePrefetchOnHoverResult,
  UsePreviewMetasResult,
} from './useLazyMedia'

export {
  useTrackSection,
  useTrackCTAHover,
  useScrollDepth,
  clearTrackingState,
} from './useTracking'

export type {
  UseTrackSectionOptions,
  UseTrackSectionResult,
  UseTrackCTAHoverOptions,
} from './useTracking'
