/**
 * ops/publish/targets/ZipExportTarget.ts
 *
 * ZIP export publish target — always available.
 * Builds a hashed, deterministic ZIP package from the artifact bundle.
 * Demo exports include watermarks and disclaimers.
 */

import type { PublishTarget, PublishTargetRegistration, CanPublishResult } from './PublishTarget.js'
import type { PublishRequest } from '../models/PublishRequest.js'
import type { PublishResult } from '../models/PublishResult.js'
import type { ArtifactBundle } from './HostedPublishTarget.js'
import { buildZipPackage } from '../export/zipBuilder.js'
import type { ZipPackage, ZipEntry } from '../export/zipBuilder.js'

export class ZipExportTarget implements PublishTarget {
  readonly registration: PublishTargetRegistration = {
    id: 'zip-export',
    name: 'ZIP Export',
    kind: 'zip',
    enabled: true,
    safeModeAllowed: true,
    requiredCapabilities: ['publish_site'],
    blockedTenantTypes: ['suspended'],
    config: {},
  }

  private readonly _bundles: Map<string, ArtifactBundle>
  private readonly _exports: Map<string, ZipPackage> = new Map()

  constructor(bundles?: Map<string, ArtifactBundle>) {
    this._bundles = bundles ?? new Map()
  }

  /** Register a bundle for a site. */
  registerBundle(artifactRef: string, bundle: ArtifactBundle): void {
    this._bundles.set(artifactRef, bundle)
  }

  canPublish(_request: PublishRequest): CanPublishResult {
    return { allowed: true }
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    const bundle = this._bundles.get(request.artifactRef)
    if (!bundle) {
      return this._fail(request, `Artifact bundle not found: ${request.artifactRef}`)
    }

    // Enforce watermark in demo mode
    if (request.mode === 'demo' && !bundle.watermarked) {
      return this._fail(request, 'Demo mode requires watermarked artifacts')
    }

    const zipEntries: ZipEntry[] = bundle.artifacts.map(a => ({
      path: a.path,
      content: a.content,
      sha256: a.sha256,
      size: a.size,
    }))

    const result = buildZipPackage(
      request.siteId,
      request.blueprintId,
      bundle.generatedAt,
      request.correlationId,
      bundle.watermarked,
      request.mode === 'demo',
      zipEntries,
    )

    if ('error' in result) {
      return this._fail(request, result.error)
    }

    // Store the export for retrieval
    this._exports.set(request.correlationId, result)

    return {
      success: true,
      target: 'zip',
      siteId: request.siteId,
      correlationId: request.correlationId,
      manifestHash: result.manifest.manifestHash,
      publishedAt: new Date().toISOString(),
      version: result.manifest.manifestHash.slice(0, 12),
      downloadRef: result.filename,
      auditEvents: [],
    }
  }

  /** Retrieve a completed ZIP export. */
  getExport(correlationId: string): ZipPackage | undefined {
    return this._exports.get(correlationId)
  }

  private _fail(request: PublishRequest, error: string): PublishResult {
    return {
      success: false,
      target: 'zip',
      siteId: request.siteId,
      correlationId: request.correlationId,
      manifestHash: '',
      publishedAt: new Date().toISOString(),
      version: '',
      error,
      auditEvents: [],
    }
  }
}
