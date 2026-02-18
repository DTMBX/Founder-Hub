/**
 * Site Generation Pipeline — Types
 *
 * Defines the data structures flowing through the pipeline:
 * validate → scaffold → render → watermark → hash → store
 *
 * All types are read-only after construction to ensure determinism.
 */

// ─── Input ───────────────────────────────────────────────────

/** Operator-provided site generation input. */
export interface GenerationInput {
  /** Blueprint ID to generate from. */
  readonly blueprintId: string
  /** Business name (required by all blueprints). */
  readonly businessName: string
  /** Contact email or phone (required by all blueprints). */
  readonly contactInfo: string
  /** Physical address (required by some blueprints). */
  readonly address?: string
  /** Business hours (required by some blueprints). */
  readonly hours?: string
  /** Additional content keyed by page slug. */
  readonly pageContent?: Readonly<Record<string, PageContentInput>>
  /** Selected style preset ID. */
  readonly presetId?: string
  /** Feature flag overrides (merged with blueprint defaults). */
  readonly featureFlags?: Readonly<Record<string, boolean>>
  /** Operator who initiated generation. */
  readonly operatorId: string
  /** Timestamp of request (ISO 8601). */
  readonly requestedAt: string
}

/** Per-page custom content. */
export interface PageContentInput {
  readonly title?: string
  readonly body?: string
  readonly sections?: Readonly<Record<string, string>>
}

// ─── Validation ──────────────────────────────────────────────

/** Result of the validation step. */
export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

// ─── Scaffold ────────────────────────────────────────────────

/** A scaffolded page ready for rendering. */
export interface ScaffoldedPage {
  readonly slug: string
  readonly title: string
  readonly template: string
  readonly sections: readonly ScaffoldedSection[]
}

/** A scaffolded section within a page. */
export interface ScaffoldedSection {
  readonly id: string
  readonly component: string
  readonly order: number
  readonly content: string
  readonly required: boolean
}

/** The full scaffold output. */
export interface ScaffoldResult {
  readonly pages: readonly ScaffoldedPage[]
  readonly metadata: ScaffoldMetadata
}

export interface ScaffoldMetadata {
  readonly blueprintId: string
  readonly blueprintVersion: string
  readonly presetId: string
  readonly businessName: string
  readonly generatedAt: string
}

// ─── Render ──────────────────────────────────────────────────

/** A rendered page with HTML content. */
export interface RenderedPage {
  readonly slug: string
  readonly title: string
  readonly html: string
}

/** Full render output. */
export interface RenderResult {
  readonly pages: readonly RenderedPage[]
  readonly assets: readonly RenderedAsset[]
}

/** A generated asset (CSS, JS, image reference). */
export interface RenderedAsset {
  readonly path: string
  readonly content: string
  readonly type: 'css' | 'js' | 'json' | 'image'
}

// ─── Watermark ───────────────────────────────────────────────

/** Watermarked page (same shape, html mutated with watermark). */
export interface WatermarkedPage {
  readonly slug: string
  readonly title: string
  readonly html: string
  readonly watermarked: boolean
}

/** Watermark output. */
export interface WatermarkResult {
  readonly pages: readonly WatermarkedPage[]
  readonly assets: readonly RenderedAsset[]
  readonly watermarkApplied: boolean
}

// ─── Hash ────────────────────────────────────────────────────

/** A hashed artifact with SHA-256 integrity. */
export interface HashedArtifact {
  readonly path: string
  readonly sha256: string
  readonly size: number
}

/** Full hash result — deterministic manifest. */
export interface HashResult {
  readonly artifacts: readonly HashedArtifact[]
  /** SHA-256 of the sorted, concatenated artifact hashes. */
  readonly manifestHash: string
}

// ─── Store ───────────────────────────────────────────────────

/** Storage record for a generated site. */
export interface StoredSite {
  readonly siteId: string
  readonly blueprintId: string
  readonly operatorId: string
  readonly generatedAt: string
  readonly storedAt: string
  readonly manifest: HashResult
  readonly metadata: ScaffoldMetadata
  readonly status: 'stored' | 'failed'
}

// ─── Pipeline ────────────────────────────────────────────────

/** Complete pipeline output. */
export interface PipelineResult {
  readonly success: boolean
  readonly siteId: string
  readonly validation: ValidationResult
  readonly scaffold?: ScaffoldResult
  readonly render?: RenderResult
  readonly watermark?: WatermarkResult
  readonly hash?: HashResult
  readonly stored?: StoredSite
  readonly errors: readonly string[]
  readonly duration: number
}

/** Pipeline step name. */
export type PipelineStep =
  | 'validate'
  | 'scaffold'
  | 'render'
  | 'watermark'
  | 'hash'
  | 'store'
