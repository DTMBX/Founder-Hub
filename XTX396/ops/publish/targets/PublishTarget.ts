/**
 * ops/publish/targets/PublishTarget.ts
 *
 * Core interface for all publish targets.
 * Each target receives a PublishRequest and returns a PublishResult.
 * Implementations must be deterministic: same inputs → same manifest hashes.
 */

import type { PublishRequest } from '../models/PublishRequest.js'
import type { PublishResult } from '../models/PublishResult.js'

/** Publish target kind discriminator. */
export type PublishTargetKind = 'hosted' | 'zip' | 'github_pr'

/**
 * Static registration metadata for a publish target.
 * Does not contain secrets — config is non-sensitive.
 */
export interface PublishTargetRegistration {
  readonly id: string
  readonly name: string
  readonly kind: PublishTargetKind
  readonly enabled: boolean
  readonly safeModeAllowed: boolean
  readonly requiredCapabilities: readonly string[]
  readonly blockedTenantTypes: readonly string[]
  readonly config: Readonly<Record<string, unknown>>
}

/**
 * Interface that all publish targets must implement.
 * - `canPublish()` — pre-flight check (RBAC, tenant, safe mode, config).
 * - `publish()` — execute the publish action.
 * Both must be deterministic and must never print or commit secrets.
 */
export interface PublishTarget {
  readonly registration: PublishTargetRegistration

  /**
   * Pre-flight check. Returns { allowed: true } or { allowed: false, reason }.
   * Must fail closed: if uncertain, return blocked.
   */
  canPublish(request: PublishRequest): CanPublishResult

  /**
   * Execute the publish.
   * Must emit audit events via the provided audit callback.
   * Must not throw — return PublishResult with success: false on error.
   */
  publish(request: PublishRequest): Promise<PublishResult>
}

export interface CanPublishResult {
  readonly allowed: boolean
  readonly reason?: string
}
