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

export {
  useFocusTrap,
  useAnnounce,
  usePreloadAssets,
  useReducedMotion,
  useKeyboardShortcut,
} from './useA11y'

export type {
  UseFocusTrapOptions,
  UseFocusTrapResult,
  UseAnnounceResult,
  UsePreloadAssetsOptions,
  UseKeyboardShortcutOptions,
  PreloadConfig,
} from './useA11y'
