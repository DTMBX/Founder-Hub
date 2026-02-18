/**
 * Montage Assembler
 *
 * Handles the assembly of recorded scenes into a complete montage.
 * Supports multiple assembly strategies:
 * - single-run: Record all scenes in one continuous video
 * - scene-playlist: Keep scenes separate, use JS to sequence
 * - ffmpeg-concat: Concatenate scenes using ffmpeg (optional)
 */

import type {
  PreviewMontage,
  PreviewMeta,
  SceneMeta,
  AssemblyStrategy,
  TransitionStyle,
} from './preview.types'
import { GENERATOR_VERSION } from './generatorHelpers'

// ─── Types ───────────────────────────────────────────────────

/**
 * Options for montage assembly.
 */
export interface AssemblyOptions {
  /** Assembly strategy to use */
  strategy: AssemblyStrategy
  
  /** Apply transitions between scenes */
  transitionStyle?: TransitionStyle
  
  /** Duration of transitions in seconds */
  transitionDuration?: number
  
  /** Output format for final video */
  outputFormat?: 'webm' | 'mp4'
  
  /** Video quality (0-100) */
  quality?: number
  
  /** Whether to keep intermediate files */
  keepIntermediates?: boolean
}

/**
 * Result of montage assembly.
 */
export interface AssemblyResult {
  success: boolean
  meta: PreviewMeta | null
  videoFile: string | null
  posterFile: string | null
  thumbnails: string[]
  errors: string[]
  stats: AssemblyStats
}

/**
 * Statistics from assembly process.
 */
export interface AssemblyStats {
  totalScenes: number
  successfulScenes: number
  failedScenes: number
  totalDurationSeconds: number
  assemblyTimeMs: number
  outputSizeBytes: number
}

/**
 * Playlist entry for scene-playlist strategy.
 */
export interface PlaylistEntry {
  sceneId: string
  label: string
  videoSrc: string
  thumbnailSrc: string
  durationSeconds: number
  startTime: number
  endTime: number
}

/**
 * Complete playlist for JS-based playback.
 */
export interface ScenePlaylist {
  offerId: string
  title: string
  totalDuration: number
  transitionStyle: TransitionStyle
  transitionDuration: number
  entries: PlaylistEntry[]
}

// ─── Default Options ─────────────────────────────────────────

export const DEFAULT_ASSEMBLY_OPTIONS: AssemblyOptions = {
  strategy: 'scene-playlist',
  transitionStyle: 'crossfade',
  transitionDuration: 0.3,
  outputFormat: 'webm',
  quality: 80,
  keepIntermediates: false,
}

// ─── Playlist Generation ─────────────────────────────────────

/**
 * Create a scene playlist from montage metadata.
 * This is used by the scene-playlist strategy for JS-based playback.
 */
export function createScenePlaylist(
  montage: PreviewMontage,
  sceneMetas: SceneMeta[],
  options: Pick<AssemblyOptions, 'transitionStyle' | 'transitionDuration'> = {},
): ScenePlaylist {
  const transitionStyle = options.transitionStyle ?? 'crossfade'
  const transitionDuration = options.transitionDuration ?? 0.3
  
  let currentTime = 0
  const entries: PlaylistEntry[] = []
  
  for (const sceneMeta of sceneMetas) {
    const entry: PlaylistEntry = {
      sceneId: sceneMeta.sceneId,
      label: sceneMeta.label,
      videoSrc: sceneMeta.videoFilename || '',
      thumbnailSrc: sceneMeta.thumbnailFilename,
      durationSeconds: sceneMeta.durationSeconds,
      startTime: currentTime,
      endTime: currentTime + sceneMeta.durationSeconds,
    }
    
    entries.push(entry)
    currentTime = entry.endTime
  }
  
  return {
    offerId: montage.offerId,
    title: montage.title,
    totalDuration: currentTime,
    transitionStyle,
    transitionDuration,
    entries,
  }
}

// ─── FFmpeg Concat List ──────────────────────────────────────

/**
 * Generate ffmpeg concat demuxer format file content.
 * This can be written to a file and used with: ffmpeg -f concat -i list.txt
 */
export function generateFfmpegConcatList(sceneMetas: SceneMeta[]): string {
  const lines: string[] = []
  
  for (const scene of sceneMetas) {
    if (scene.videoFilename) {
      lines.push(`file '${scene.videoFilename}'`)
      lines.push(`duration ${scene.durationSeconds}`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate ffmpeg filter complex for crossfade transitions.
 */
export function generateFfmpegFilterComplex(
  sceneMetas: SceneMeta[],
  transitionDuration: number = 0.3,
): string {
  if (sceneMetas.length < 2) {
    return '[0:v][0:a]concat=n=1:v=1:a=0[outv]'
  }
  
  const filters: string[] = []
  const sceneCount = sceneMetas.length
  
  // Create crossfade between each pair of clips
  for (let i = 0; i < sceneCount - 1; i++) {
    const duration = sceneMetas[i].durationSeconds
    const offset = duration - transitionDuration
    
    if (i === 0) {
      filters.push(
        `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v01]`
      )
    } else if (i === sceneCount - 2) {
      const prevLabel = `v${String(i - 1).padStart(2, '0')}`
      filters.push(
        `[${prevLabel}][${i + 1}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[outv]`
      )
    } else {
      const prevLabel = `v${String(i - 1).padStart(2, '0')}`
      const nextLabel = `v${String(i).padStart(2, '0')}`
      filters.push(
        `[${prevLabel}][${i + 1}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[${nextLabel}]`
      )
    }
  }
  
  return filters.join(';')
}

// ─── Assembly Statistics ─────────────────────────────────────

/**
 * Calculate assembly statistics from scene metadata.
 */
export function calculateAssemblyStats(
  sceneMetas: SceneMeta[],
  assemblyTimeMs: number,
  outputSizeBytes: number,
): AssemblyStats {
  const successfulScenes = sceneMetas.filter(s => s.videoFilename !== null)
  const totalDuration = sceneMetas.reduce((sum, s) => sum + s.durationSeconds, 0)
  
  return {
    totalScenes: sceneMetas.length,
    successfulScenes: successfulScenes.length,
    failedScenes: sceneMetas.length - successfulScenes.length,
    totalDurationSeconds: totalDuration,
    assemblyTimeMs,
    outputSizeBytes,
  }
}

// ─── Meta Generation ─────────────────────────────────────────

/**
 * Create complete preview metadata with all computed fields.
 */
export function createMontageMetadata(
  montage: PreviewMontage,
  sceneMetas: SceneMeta[],
  options: AssemblyOptions,
  videoFilename: string | null,
): PreviewMeta {
  const totalDuration = sceneMetas.reduce((sum, s) => sum + s.durationSeconds, 0)
  
  return {
    offerId: montage.offerId,
    title: montage.title,
    description: montage.description,
    generatorVersion: GENERATOR_VERSION,
    generatedAt: new Date().toISOString(),
    totalDurationSeconds: totalDuration,
    viewport: montage.viewport,
    assemblyStrategy: options.strategy,
    videoFilename,
    posterFilename: 'poster.png',
    scenes: sceneMetas,
  }
}

// ─── Path Utilities ──────────────────────────────────────────

/**
 * Get output paths for assembly artifacts.
 */
export function getAssemblyPaths(baseDir: string, offerId: string, format: 'webm' | 'mp4') {
  return {
    outputDir: `${baseDir}/${offerId}`,
    videoFile: `${baseDir}/${offerId}/montage.${format}`,
    posterFile: `${baseDir}/${offerId}/poster.png`,
    metaFile: `${baseDir}/${offerId}/meta.json`,
    playlistFile: `${baseDir}/${offerId}/playlist.json`,
    concatListFile: `${baseDir}/${offerId}/concat.txt`,
    thumbsDir: `${baseDir}/${offerId}/thumbs`,
    scenesDir: `${baseDir}/${offerId}/scenes`,
  }
}

// ─── Validation ──────────────────────────────────────────────

/**
 * Validate assembly readiness.
 */
export function validateAssemblyInputs(
  montage: PreviewMontage,
  sceneMetas: SceneMeta[],
): string[] {
  const errors: string[] = []
  
  if (!montage.offerId) {
    errors.push('Montage offerId is required')
  }
  
  if (sceneMetas.length === 0) {
    errors.push('At least one recorded scene is required')
  }
  
  // Check for missing thumbnails
  const missingThumbs = sceneMetas.filter(s => !s.thumbnailFilename)
  if (missingThumbs.length > 0) {
    errors.push(`${missingThumbs.length} scene(s) missing thumbnails`)
  }
  
  // Check scene count matches montage definition
  if (sceneMetas.length !== montage.scenes.length) {
    errors.push(
      `Scene count mismatch: ${sceneMetas.length} recorded vs ${montage.scenes.length} defined`
    )
  }
  
  return errors
}

// ─── Strategy Selection ──────────────────────────────────────

/**
 * Determine optimal assembly strategy based on inputs.
 */
export function selectAssemblyStrategy(
  sceneMetas: SceneMeta[],
  preferredStrategy: AssemblyStrategy,
  hasFfmpeg: boolean,
): AssemblyStrategy {
  // If only one scene, single-run is equivalent
  if (sceneMetas.length === 1) {
    return 'single-run'
  }
  
  // If ffmpeg-concat preferred but ffmpeg unavailable, fall back
  if (preferredStrategy === 'ffmpeg-concat' && !hasFfmpeg) {
    console.warn('[assembler] ffmpeg not available, falling back to scene-playlist')
    return 'scene-playlist'
  }
  
  // If all scenes have videos and ffmpeg available, allow concat
  const allHaveVideos = sceneMetas.every(s => s.videoFilename)
  if (preferredStrategy === 'ffmpeg-concat' && !allHaveVideos) {
    console.warn('[assembler] Not all scenes have videos, falling back to scene-playlist')
    return 'scene-playlist'
  }
  
  return preferredStrategy
}

// ─── Poster Selection ────────────────────────────────────────

/**
 * Select the best scene for the poster image.
 * Prefers scenes with 'pan-hero' motion or the first scene.
 */
export function selectPosterScene(
  montage: PreviewMontage,
  sceneMetas: SceneMeta[],
): SceneMeta | null {
  if (sceneMetas.length === 0) {
    return null
  }
  
  // Find a scene with pan-hero camera motion
  const heroScene = montage.scenes.find(s => s.cameraMotion === 'pan-hero')
  if (heroScene) {
    const heroMeta = sceneMetas.find(m => m.sceneId === heroScene.sceneId)
    if (heroMeta) {
      return heroMeta
    }
  }
  
  // Default to first scene
  return sceneMetas[0]
}

// ─── Export Manifest ─────────────────────────────────────────

/**
 * Generate export manifest for all montages.
 * Used by CI to verify all previews were generated.
 */
export interface ExportManifest {
  generatedAt: string
  generatorVersion: string
  totalMontages: number
  totalScenes: number
  totalDurationSeconds: number
  montages: Array<{
    offerId: string
    title: string
    sceneCount: number
    durationSeconds: number
    status: 'complete' | 'partial' | 'failed'
  }>
}

export function createExportManifest(
  allMetas: PreviewMeta[],
): ExportManifest {
  const totalScenes = allMetas.reduce((sum, m) => sum + m.scenes.length, 0)
  const totalDuration = allMetas.reduce((sum, m) => sum + m.totalDurationSeconds, 0)
  
  return {
    generatedAt: new Date().toISOString(),
    generatorVersion: GENERATOR_VERSION,
    totalMontages: allMetas.length,
    totalScenes,
    totalDurationSeconds: totalDuration,
    montages: allMetas.map(m => ({
      offerId: m.offerId,
      title: m.title,
      sceneCount: m.scenes.length,
      durationSeconds: m.totalDurationSeconds,
      status: m.scenes.every(s => s.videoFilename) ? 'complete' : 
              m.scenes.some(s => s.videoFilename) ? 'partial' : 'failed',
    })),
  }
}
