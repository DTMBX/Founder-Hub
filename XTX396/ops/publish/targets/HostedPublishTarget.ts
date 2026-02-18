/**
 * ops/publish/targets/HostedPublishTarget.ts
 *
 * Hosted publish target — the default, simplest option.
 * Stores artifact bundle in hosted_sites/{tenant}/{site}/{version}/
 * Sets an active pointer. Immutable versions (no overwrite).
 * Enforces watermark in demo mode.
 */

import type { PublishTarget, PublishTargetRegistration, CanPublishResult } from './PublishTarget.js'
import type { PublishRequest } from '../models/PublishRequest.js'
import type { PublishResult, PublishAuditEvent } from '../models/PublishResult.js'
import { createAuditEvent } from '../models/PublishResult.js'
import type { HostedStorageAdapter } from '../storage/HostedStorage.js'
import { hostedKey, hostedUrl } from '../storage/HostedStorage.js'

/** Artifact bundle input — minimal interface matching B21 pipeline output. */
export interface ArtifactBundle {
  readonly siteId: string
  readonly blueprintId: string
  readonly artifacts: readonly ArtifactEntry[]
  readonly manifestHash: string
  readonly watermarked: boolean
  readonly generatedAt: string
}

export interface ArtifactEntry {
  readonly path: string
  readonly content: string
  readonly sha256: string
  readonly size: number
}

/** Generate a deterministic version string from the manifest hash. */
export function generateVersion(manifestHash: string, timestamp: string): string {
  // Use first 12 chars of manifest hash + compact timestamp for readability
  const hashPrefix = manifestHash.slice(0, 12)
  const ts = timestamp.replace(/[-:T]/g, '').slice(0, 14)
  return `v_${hashPrefix}_${ts}`
}

export class HostedPublishTarget implements PublishTarget {
  readonly registration: PublishTargetRegistration = {
    id: 'hosted-default',
    name: 'Hosted Publish',
    kind: 'hosted',
    enabled: true,
    safeModeAllowed: true,
    requiredCapabilities: ['publish_site'],
    blockedTenantTypes: ['suspended'],
    config: {},
  }

  private readonly _storage: HostedStorageAdapter
  private readonly _bundles: Map<string, ArtifactBundle>
  private readonly _auditLog: PublishAuditEvent[] = []
  private _auditCounter = 0

  constructor(storage: HostedStorageAdapter, bundles?: Map<string, ArtifactBundle>) {
    this._storage = storage
    this._bundles = bundles ?? new Map()
  }

  /** Register a bundle for a site (called after pipeline completes). */
  registerBundle(artifactRef: string, bundle: ArtifactBundle): void {
    this._bundles.set(artifactRef, bundle)
  }

  canPublish(request: PublishRequest): CanPublishResult {
    // Demo mode: watermark must be present in bundle
    // (checked at publish time, not just pre-flight, to be safe)
    return { allowed: true }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const events: PublishAuditEvent[] = []

    const bundle = this._bundles.get(request.artifactRef)
    if (!bundle) {
      return this._fail(request, events, `Artifact bundle not found: ${request.artifactRef}`)
    }

    // Enforce watermark in demo mode
    if (request.mode === 'demo' && !bundle.watermarked) {
      return this._fail(request, events, 'Demo mode requires watermarked artifacts')
    }

    const version = generateVersion(bundle.manifestHash, request.requestedAt)

    // Check for existing version (immutable — no overwrite)
    for (const artifact of bundle.artifacts) {
      const key = hostedKey(request.tenantId, request.siteId, version, artifact.path)
      const exists = await this._storage.exists(key)
      if (exists) {
        return this._fail(request, events, `Version already published: ${version}`)
      }
    }

    // Store all artifacts
    for (const artifact of bundle.artifacts) {
      const key = hostedKey(request.tenantId, request.siteId, version, artifact.path)
      await this._storage.put(key, {
        key,
        content: artifact.content,
        sha256: artifact.sha256,
        size: artifact.size,
        storedAt: new Date().toISOString(),
      })
    }

    // Set active pointer
    await this._storage.setActive({
      tenantId: request.tenantId,
      siteId: request.siteId,
      version,
      activatedAt: new Date().toISOString(),
      activatedBy: request.actorId,
    })

    const siteSlug = `${request.tenantId}-${request.siteId}`
    const url = hostedUrl(siteSlug)

    return {
      success: true,
      target: 'hosted',
      siteId: request.siteId,
      correlationId: request.correlationId,
      manifestHash: bundle.manifestHash,
      publishedAt: new Date().toISOString(),
      version,
      url,
      auditEvents: events,
    }
  }

  private _fail(request: PublishRequest, events: PublishAuditEvent[], error: string): PublishResult {
    return {
      success: false,
      target: 'hosted',
      siteId: request.siteId,
      correlationId: request.correlationId,
      manifestHash: '',
      publishedAt: new Date().toISOString(),
      version: '',
      error,
      auditEvents: events,
    }
  }
}
