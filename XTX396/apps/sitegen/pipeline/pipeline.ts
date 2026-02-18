/**
 * Site Generation Pipeline — Orchestrator
 *
 * Runs the full pipeline: validate → scaffold → render → watermark → hash → store
 *
 * Invariants:
 * - Pipeline halts on first failure (fail-closed).
 * - Every step is pure/deterministic (no randomness, no external calls).
 * - Output includes timing and full audit trail.
 */

import type { GenerationInput, PipelineResult } from './types'
import { validate } from './validate'
import { scaffold } from './scaffold'
import { render } from './render'
import { watermark, type WatermarkProfile } from './watermark'
import { hash } from './hash'
import { store, generateSiteId, type StorageAdapter, InMemoryStorageAdapter } from './store'

// ─── Blueprint Shape (combined for pipeline) ─────────────────

export interface BlueprintForPipeline {
  readonly id: string
  readonly version: string
  readonly required_pages: readonly {
    slug: string
    title: string
    template: string
    required_sections?: readonly string[]
  }[]
  readonly required_sections: readonly {
    id: string
    label: string
    component: string
    order?: number
    required?: boolean
  }[]
  readonly required_components: readonly string[]
  readonly content_requirements: {
    readonly min_pages: number
    readonly min_sections: number
    readonly min_words_per_page: number
    readonly require_contact_info: boolean
    readonly require_business_name: boolean
    readonly require_address?: boolean
    readonly require_hours?: boolean
  }
  readonly demo_watermark_profile: WatermarkProfile
}

// ─── Pipeline Orchestrator ───────────────────────────────────

/**
 * Runs the full site generation pipeline.
 *
 * @param input - Operator-provided generation input
 * @param blueprint - Blueprint to generate from
 * @param adapter - Storage adapter (defaults to in-memory)
 * @returns PipelineResult with full audit trail
 */
export async function runPipeline(
  input: GenerationInput,
  blueprint: BlueprintForPipeline,
  adapter?: StorageAdapter,
): Promise<PipelineResult> {
  const start = performance.now()
  const storageAdapter = adapter ?? new InMemoryStorageAdapter()
  const siteId = generateSiteId(
    blueprint.id,
    input.operatorId,
    input.requestedAt,
  )

  // Step 1: Validate (fail-closed)
  const validationResult = validate(input, blueprint)
  if (!validationResult.valid) {
    return {
      success: false,
      siteId,
      validation: validationResult,
      errors: validationResult.errors,
      duration: performance.now() - start,
    }
  }

  // Step 2: Scaffold
  const scaffoldResult = scaffold(input, blueprint)

  // Step 3: Render
  const renderResult = render(scaffoldResult)

  // Step 4: Watermark
  const watermarkResult = watermark(renderResult, blueprint.demo_watermark_profile)

  // Step 5: Hash
  const hashResult = await hash(watermarkResult)

  // Step 6: Store
  const storedSite = await store(
    siteId,
    scaffoldResult.metadata,
    hashResult,
    input.operatorId,
    storageAdapter,
  )

  return {
    success: true,
    siteId,
    validation: validationResult,
    scaffold: scaffoldResult,
    render: renderResult,
    watermark: watermarkResult,
    hash: hashResult,
    stored: storedSite,
    errors: [],
    duration: performance.now() - start,
  }
}
