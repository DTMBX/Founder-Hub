/**
 * Preview Generator Helpers
 *
 * Utility functions for the preview generator script.
 * Extracted for testability and reuse.
 */

import type {
  PreviewScene,
  PreviewMontage,
  ViewportConfig,
  CameraMotion,
  PreviewMeta,
  SceneMeta,
  AssemblyStrategy,
} from './preview.types'

// ─── Constants ───────────────────────────────────────────────

export const GENERATOR_VERSION = '1.0.0'

/**
 * Default viewport for preview generation.
 */
export const DEFAULT_VIEWPORT: ViewportConfig = {
  width: 1280,
  height: 720,
  deviceScaleFactor: 1,
  isMobile: false,
}

/**
 * Mobile viewport for responsive previews.
 */
export const MOBILE_VIEWPORT: ViewportConfig = {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  isMobile: true,
}

// ─── ID Generation ───────────────────────────────────────────

/**
 * Generate a deterministic site ID for a preview scene.
 * Uses offerId + sceneId + seed to ensure reproducibility.
 */
export function generateDemoSiteId(
  offerId: string,
  sceneId: string,
  seedOverride?: string,
): string {
  const seed = seedOverride || `${offerId}-${sceneId}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(36).padStart(6, '0').slice(0, 6)
  return `demo-${hashStr}`
}

/**
 * Generate the preview path for a demo site.
 */
export function getDemoPreviewPath(siteId: string): string {
  return `#preview/${siteId}`
}

// ─── Path Helpers ────────────────────────────────────────────

/**
 * Get the output directory path for a montage.
 */
export function getMontageOutputPath(basePath: string, offerId: string): string {
  return `${basePath}/${offerId}`
}

/**
 * Get the thumbnail path for a scene.
 */
export function getSceneThumbnailPath(montageDir: string, sceneId: string): string {
  return `${montageDir}/thumbs/${sceneId}.png`
}

/**
 * Get the poster path for a montage.
 */
export function getMontagePosterPath(montageDir: string): string {
  return `${montageDir}/poster.png`
}

/**
 * Get the meta.json path for a montage.
 */
export function getMontageMetaPath(montageDir: string): string {
  return `${montageDir}/meta.json`
}

// ─── Scroll Calculations ─────────────────────────────────────

/**
 * Calculate scroll positions based on scroll height and percentages.
 */
export function calculateScrollPositions(
  scrollHeight: number,
  viewportHeight: number,
  startPct: number,
  endPct: number,
): { startY: number; endY: number; maxScroll: number } {
  const maxScroll = Math.max(0, scrollHeight - viewportHeight)
  return {
    startY: Math.floor(maxScroll * startPct),
    endY: Math.floor(maxScroll * endPct),
    maxScroll,
  }
}

/**
 * Calculate interpolated scroll position for animation frames.
 */
export function interpolateScrollPosition(
  startY: number,
  endY: number,
  progress: number,
): number {
  // Clamp progress to [0, 1]
  const p = Math.max(0, Math.min(1, progress))
  return Math.floor(startY + (endY - startY) * p)
}

// ─── Duration Calculations ───────────────────────────────────

/**
 * Get effective scene duration, using defaults if not specified.
 */
export function getSceneDuration(
  scene: Pick<PreviewScene, 'durationSeconds'>,
  montageDefault?: number,
): number {
  return scene.durationSeconds ?? montageDefault ?? 2.0
}

/**
 * Calculate total montage duration from scenes.
 */
export function calculateTotalDuration(
  scenes: Pick<PreviewScene, 'durationSeconds'>[],
  montageDefault?: number,
): number {
  return scenes.reduce(
    (sum, scene) => sum + getSceneDuration(scene, montageDefault),
    0,
  )
}

// ─── Validation ──────────────────────────────────────────────

/**
 * Validate a scene definition has required fields.
 */
export function validateScene(scene: PreviewScene): string[] {
  const errors: string[] = []
  
  if (!scene.sceneId || typeof scene.sceneId !== 'string') {
    errors.push('sceneId is required and must be a string')
  }
  if (!scene.label || typeof scene.label !== 'string') {
    errors.push('label is required and must be a string')
  }
  if (!scene.siteType) {
    errors.push('siteType is required')
  }
  if (scene.scrollStart !== undefined && (scene.scrollStart < 0 || scene.scrollStart > 1)) {
    errors.push('scrollStart must be between 0 and 1')
  }
  if (scene.scrollEnd !== undefined && (scene.scrollEnd < 0 || scene.scrollEnd > 1)) {
    errors.push('scrollEnd must be between 0 and 1')
  }
  if (scene.durationSeconds !== undefined && scene.durationSeconds <= 0) {
    errors.push('durationSeconds must be positive')
  }
  
  return errors
}

/**
 * Validate a montage definition.
 */
export function validateMontage(montage: PreviewMontage): string[] {
  const errors: string[] = []
  
  if (!montage.offerId || typeof montage.offerId !== 'string') {
    errors.push('offerId is required and must be a string')
  }
  if (!montage.title || typeof montage.title !== 'string') {
    errors.push('title is required and must be a string')
  }
  if (!montage.scenes || montage.scenes.length === 0) {
    errors.push('at least one scene is required')
  }
  if (!montage.viewport) {
    errors.push('viewport configuration is required')
  }
  
  // Validate each scene
  const sceneIds = new Set<string>()
  montage.scenes?.forEach((scene, idx) => {
    if (sceneIds.has(scene.sceneId)) {
      errors.push(`duplicate sceneId "${scene.sceneId}" at index ${idx}`)
    }
    sceneIds.add(scene.sceneId)
    
    const sceneErrors = validateScene(scene)
    sceneErrors.forEach(err => {
      errors.push(`scene ${idx} (${scene.sceneId || 'unknown'}): ${err}`)
    })
  })
  
  return errors
}

// ─── Meta Generation ─────────────────────────────────────────

/**
 * Create scene metadata after recording.
 */
export function createSceneMeta(
  scene: PreviewScene,
  offerId: string,
  generatedSiteId: string,
  videoFilename: string | null,
): SceneMeta {
  return {
    sceneId: scene.sceneId,
    label: scene.label,
    presetId: scene.presetId,
    verticalId: scene.verticalId,
    siteType: scene.siteType,
    generatedSiteId,
    recordedAt: new Date().toISOString(),
    durationSeconds: scene.durationSeconds ?? 2.0,
    thumbnailFilename: `thumbs/${scene.sceneId}.png`,
    videoFilename,
  }
}

/**
 * Create preview metadata for a completed montage.
 */
export function createPreviewMeta(
  montage: PreviewMontage,
  scenes: SceneMeta[],
  strategy: AssemblyStrategy,
  videoFilename: string | null,
): PreviewMeta {
  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0)
  
  return {
    offerId: montage.offerId,
    title: montage.title,
    description: montage.description,
    generatorVersion: GENERATOR_VERSION,
    generatedAt: new Date().toISOString(),
    totalDurationSeconds: totalDuration,
    viewport: montage.viewport,
    assemblyStrategy: strategy,
    videoFilename,
    posterFilename: 'poster.png',
    scenes,
  }
}

// ─── Camera Motion Helpers ───────────────────────────────────

/**
 * Get effective camera motion for a scene.
 */
export function getEffectiveCameraMotion(
  scene: Pick<PreviewScene, 'cameraMotion'>,
  montageDefault?: CameraMotion,
): CameraMotion {
  return scene.cameraMotion ?? montageDefault ?? 'scroll-down'
}

/**
 * Check if camera motion involves scrolling.
 */
export function isScrollingMotion(motion: CameraMotion): boolean {
  return motion === 'scroll-down' || motion === 'scroll-up'
}

/**
 * Get scroll direction multiplier (-1 for up, 1 for down, 0 for static).
 */
export function getScrollDirection(motion: CameraMotion): -1 | 0 | 1 {
  switch (motion) {
    case 'scroll-down':
      return 1
    case 'scroll-up':
      return -1
    default:
      return 0
  }
}
