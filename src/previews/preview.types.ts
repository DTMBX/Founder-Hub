/**
 * Preview System Types
 *
 * Types for the automated demo-preview video generation system.
 * Used to define montages, scenes, and generated artifact metadata.
 */

import type { SiteType } from '@/lib/types'
import type { MediaCategory } from '@/core/media'

// ─── Scene Definition ────────────────────────────────────────

/**
 * A single scene in a preview montage.
 * Each scene showcases one site configuration.
 */
export interface PreviewScene {
  /** Unique identifier for this scene within the montage */
  sceneId: string
  /** Human-readable label for thumbnail/caption */
  label: string
  /** Site type for this scene */
  siteType: SiteType
  /** Vertical pack ID to use */
  verticalId: string
  /** Preset ID to apply */
  presetId: string
  /** Optional seed override for deterministic content/media */
  seedOverride?: string
  /** Duration of this scene in seconds (default: montage default) */
  durationSeconds?: number
  /** Camera motion style for this scene */
  cameraMotion?: CameraMotion
  /** Starting scroll position (0-1, percentage of page height) */
  scrollStart?: number
  /** Ending scroll position (0-1, percentage of page height) */
  scrollEnd?: number
}

/**
 * Camera motion style during scene recording.
 */
export type CameraMotion = 
  | 'static'       // No movement, fixed view
  | 'scroll-down'  // Smooth scroll from top to bottom
  | 'scroll-up'    // Smooth scroll from bottom to top
  | 'pan-hero'     // Focus on hero section with subtle motion
  | 'zoom-out'     // Start zoomed, pull back

// ─── Montage Definition ──────────────────────────────────────

/**
 * viewport configuration for montage recording.
 */
export interface ViewportConfig {
  width: number
  height: number
  deviceScaleFactor?: number
  isMobile?: boolean
}

/**
 * Complete montage definition for an offer.
 * Defines all scenes and recording parameters.
 */
export interface PreviewMontage {
  /** Unique identifier matching the offer ID */
  offerId: string
  /** Title for the montage (used in meta.json) */
  title: string
  /** Description of what this montage showcases */
  description: string
  /** List of scenes in playback order */
  scenes: PreviewScene[]
  /** Default duration per scene in seconds */
  defaultDurationSeconds: number
  /** Viewport configuration for recording */
  viewport: ViewportConfig
  /** Default camera motion for scenes without override */
  defaultCameraMotion: CameraMotion
  /** Transition style between scenes */
  transitionStyle?: TransitionStyle
  /** Output format preference */
  outputFormat?: OutputFormat
}

/**
 * Transition between scenes.
 */
export type TransitionStyle = 
  | 'cut'      // Hard cut, no transition
  | 'fade'     // Fade to black between scenes
  | 'crossfade' // Blend scenes together

/**
 * Output video format.
 */
export type OutputFormat = 'webm' | 'mp4'

// ─── Generated Artifact Metadata ─────────────────────────────

/**
 * Metadata for a generated scene artifact.
 */
export interface SceneMeta {
  sceneId: string
  label: string
  presetId: string
  verticalId: string
  siteType: SiteType
  /** Generated siteId used for this scene */
  generatedSiteId: string
  /** Timestamp when scene was recorded */
  recordedAt: string
  /** Duration in seconds */
  durationSeconds: number
  /** Thumbnail filename */
  thumbnailFilename: string
  /** Scene video filename (if using scene playlist strategy) */
  videoFilename?: string
}

/**
 * Complete metadata for a generated preview montage.
 * Written to meta.json alongside video artifacts.
 */
export interface PreviewMeta {
  /** Offer ID this preview belongs to */
  offerId: string
  /** Montage title */
  title: string
  /** Montage description */
  description: string
  /** Generator version for cache invalidation */
  generatorVersion: string
  /** When the montage was generated */
  generatedAt: string
  /** Total duration in seconds */
  totalDurationSeconds: number
  /** Viewport used for recording */
  viewport: ViewportConfig
  /** Strategy used for montage assembly */
  assemblyStrategy: AssemblyStrategy
  /** Main video filename */
  videoFilename: string
  /** Poster image filename */
  posterFilename: string
  /** List of scene metadata */
  scenes: SceneMeta[]
}

/**
 * Strategy used to assemble the montage.
 */
export type AssemblyStrategy = 
  | 'single-run'     // Playwright recorded single continuous run
  | 'ffmpeg-concat'  // Scenes concatenated via ffmpeg
  | 'scene-playlist' // UI handles scene switching (multiple video files)

// ─── Generation Options ──────────────────────────────────────

/**
 * Options for the preview generator script.
 */
export interface PreviewGeneratorOptions {
  /** Root output directory (default: public/previews) */
  outputDir?: string
  /** Base URL for dev server (default: http://localhost:5173) */
  baseUrl?: string
  /** Specific offer IDs to generate (default: all) */
  offerIds?: string[]
  /** Force regeneration even if artifacts exist */
  force?: boolean
  /** Enable debug logging */
  debug?: boolean
  /** Headless mode (default: true in CI) */
  headless?: boolean
}

// ─── Demo Site Generation ────────────────────────────────────

/**
 * Input for creating a demo site from scene definition.
 */
export interface DemoSiteInput {
  /** Scene definition */
  scene: PreviewScene
  /** Seed for deterministic generation */
  seed: string
  /** Optional profile overrides */
  profileOverrides?: {
    name?: string
    tagline?: string
    phone?: string
    email?: string
    location?: string
  }
}

/**
 * Result of demo site creation.
 */
export interface DemoSiteResult {
  /** Generated site ID */
  siteId: string
  /** Preview URL path (e.g., #preview/law-firm-demo-001) */
  previewPath: string
  /** Seed used for generation */
  seed: string
  /** Site type */
  siteType: SiteType
  /** Applied preset */
  presetId: string
  /** Applied vertical */
  verticalId: string
}
