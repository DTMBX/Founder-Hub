/**
 * Deployment Service (CP1)
 *
 * Manages deployment records for site versions.
 * Tracks deployment status, environment, logs, and artifacts.
 *
 * Key behaviors:
 * - Deployment records are append-only for audit trail
 * - Status updates are logged
 * - Log entries are bounded to prevent storage bloat
 *
 * All mutations logged via SiteRegistry's appendAudit.
 */

import type {
  Deployment,
  DeploymentLog,
  DeploymentEnvironment,
  DeploymentStatus,
} from '@/lib/types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'
import { KEYS, getSiteRegistry } from '@/lib/site-registry'

// ─── Constants ───────────────────────────────────────────────

/** Maximum log entries per deployment to prevent storage bloat */
export const MAX_LOG_ENTRIES = 200

// ─── DeploymentService ───────────────────────────────────────

export class DeploymentService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Create a new deployment record.
   * Initial status is 'pending'.
   */
  async createDeployment(
    siteId: string,
    versionId: string,
    environment: DeploymentEnvironment,
    actor: string,
  ): Promise<Deployment> {
    const registry = getSiteRegistry(this.adapter)
    const site = await registry.get(siteId)
    if (!site) {
      throw new Error(`Site not found: ${siteId}`)
    }

    const now = new Date().toISOString()
    const deployment: Deployment = {
      deploymentId: crypto.randomUUID(),
      siteId,
      versionId,
      environment,
      status: 'pending',
      startedAt: now,
      deployedBy: actor,
      logs: [],
    }

    // Add initial log entry
    deployment.logs.push({
      timestamp: now,
      level: 'info',
      message: `Deployment to ${environment} initiated by ${actor}`,
    })

    // Append to deployments index
    const deploymentsKey = KEYS.deploymentsIndex(siteId)
    const deploymentIds = (await this.adapter.get<string[]>(deploymentsKey)) ?? []
    deploymentIds.unshift(deployment.deploymentId) // Newest first
    await this.adapter.set(deploymentsKey, deploymentIds)

    // Store deployment data
    await this.adapter.set(
      KEYS.deployment(siteId, deployment.deploymentId),
      deployment,
    )

    // Update site summary with lastDeploymentId and increment count
    await this.updateSiteDeploymentRef(siteId, deployment.deploymentId)

    // Audit log
    await registry.appendAudit(siteId, {
      actor,
      action: 'deployment.created',
      entityType: 'deployment',
      entityId: deployment.deploymentId,
      details: { versionId, environment },
    })

    return deployment
  }

  /**
   * Append a log entry to a deployment.
   * Enforces MAX_LOG_ENTRIES limit by dropping oldest entries.
   */
  async appendDeploymentLog(
    siteId: string,
    deploymentId: string,
    level: DeploymentLog['level'],
    message: string,
  ): Promise<void> {
    const deployment = await this.getDeployment(siteId, deploymentId)
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`)
    }

    const entry: DeploymentLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    deployment.logs.push(entry)

    // Trim to max entries if exceeded
    if (deployment.logs.length > MAX_LOG_ENTRIES) {
      deployment.logs = deployment.logs.slice(-MAX_LOG_ENTRIES)
    }

    await this.adapter.set(
      KEYS.deployment(siteId, deploymentId),
      deployment,
    )
  }

  /**
   * Update deployment status and optional fields.
   */
  async setDeploymentStatus(
    siteId: string,
    deploymentId: string,
    status: DeploymentStatus,
    fields?: Partial<Pick<Deployment, 'commitSha' | 'buildHash' | 'previewUrl' | 'approvedBy' | 'errorMessage'>>,
  ): Promise<Deployment> {
    const registry = getSiteRegistry(this.adapter)
    const deployment = await this.getDeployment(siteId, deploymentId)
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`)
    }

    const previousStatus = deployment.status
    deployment.status = status

    // Apply optional fields
    if (fields) {
      if (fields.commitSha !== undefined) deployment.commitSha = fields.commitSha
      if (fields.buildHash !== undefined) deployment.buildHash = fields.buildHash
      if (fields.previewUrl !== undefined) deployment.previewUrl = fields.previewUrl
      if (fields.approvedBy !== undefined) deployment.approvedBy = fields.approvedBy
      if (fields.errorMessage !== undefined) deployment.errorMessage = fields.errorMessage
    }

    // Set completedAt for terminal states
    if (['success', 'failed', 'cancelled', 'rolled-back'].includes(status)) {
      deployment.completedAt = new Date().toISOString()
    }

    // Add status change log
    deployment.logs.push({
      timestamp: new Date().toISOString(),
      level: status === 'failed' ? 'error' : 'info',
      message: `Status changed: ${previousStatus} → ${status}`,
    })

    // Trim logs if needed
    if (deployment.logs.length > MAX_LOG_ENTRIES) {
      deployment.logs = deployment.logs.slice(-MAX_LOG_ENTRIES)
    }

    await this.adapter.set(
      KEYS.deployment(siteId, deploymentId),
      deployment,
    )

    // If deployment succeeded to production, update site's liveVersionId
    if (status === 'success' && deployment.environment === 'production') {
      await this.updateSiteLiveVersion(siteId, deployment.versionId)
    }

    // Audit log
    await registry.appendAudit(siteId, {
      actor: 'system',
      action: 'deployment.status_changed',
      entityType: 'deployment',
      entityId: deploymentId,
      details: { previousStatus, newStatus: status },
    })

    return deployment
  }

  /**
   * List deployments for a site (newest first).
   * Optionally limit results.
   */
  async listDeployments(siteId: string, limit?: number): Promise<Deployment[]> {
    const deploymentsKey = KEYS.deploymentsIndex(siteId)
    let deploymentIds = (await this.adapter.get<string[]>(deploymentsKey)) ?? []

    if (limit && limit > 0) {
      deploymentIds = deploymentIds.slice(0, limit)
    }

    const deployments: Deployment[] = []
    for (const deploymentId of deploymentIds) {
      const deployment = await this.getDeployment(siteId, deploymentId)
      if (deployment) {
        deployments.push(deployment)
      }
    }
    return deployments
  }

  /**
   * Get a single deployment by ID.
   */
  async getDeployment(siteId: string, deploymentId: string): Promise<Deployment | null> {
    return this.adapter.get<Deployment>(KEYS.deployment(siteId, deploymentId))
  }

  /**
   * Get the most recent deployment for a given environment.
   */
  async getLatestDeployment(
    siteId: string,
    environment: DeploymentEnvironment,
  ): Promise<Deployment | null> {
    const deployments = await this.listDeployments(siteId)
    return deployments.find((d) => d.environment === environment) ?? null
  }

  /**
   * Create a rollback deployment.
   * Creates a new deployment record pointing to a previous version.
   */
  async rollback(
    siteId: string,
    toVersionId: string,
    actor: string,
    environment: DeploymentEnvironment = 'production',
  ): Promise<Deployment> {
    const registry = getSiteRegistry(this.adapter)

    // Create new deployment with rolled-back as initial intent
    const deployment = await this.createDeployment(
      siteId,
      toVersionId,
      environment,
      actor,
    )

    // Update status to indicate rollback
    await this.appendDeploymentLog(
      siteId,
      deployment.deploymentId,
      'info',
      `Rollback initiated to version ${toVersionId}`,
    )

    // Audit
    await registry.appendAudit(siteId, {
      actor,
      action: 'deployment.rollback_initiated',
      entityType: 'deployment',
      entityId: deployment.deploymentId,
      details: { toVersionId, environment },
    })

    return deployment
  }

  /**
   * Update site summary with last deployment reference.
   */
  private async updateSiteDeploymentRef(
    siteId: string,
    deploymentId: string,
  ): Promise<void> {
    const sites = await this.adapter.get<Array<{
      siteId: string
      lastDeploymentId?: string
      deploymentCount?: number
      [key: string]: unknown
    }>>(KEYS.SITES_INDEX) ?? []
    
    const idx = sites.findIndex((s) => s.siteId === siteId)
    if (idx === -1) return

    const site = sites[idx]
    site.lastDeploymentId = deploymentId
    site.deploymentCount = (site.deploymentCount ?? 0) + 1
    await this.adapter.set(KEYS.SITES_INDEX, sites)
  }

  /**
   * Update site's liveVersionId after successful production deployment.
   */
  private async updateSiteLiveVersion(
    siteId: string,
    versionId: string,
  ): Promise<void> {
    const sites = await this.adapter.get<Array<{
      siteId: string
      liveVersionId?: string
      [key: string]: unknown
    }>>(KEYS.SITES_INDEX) ?? []
    
    const idx = sites.findIndex((s) => s.siteId === siteId)
    if (idx === -1) return

    sites[idx].liveVersionId = versionId
    await this.adapter.set(KEYS.SITES_INDEX, sites)
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _deploymentInstance: DeploymentService | null = null

/**
 * Get the global DeploymentService instance.
 */
export function getDeploymentService(adapter?: StorageAdapter): DeploymentService {
  if (adapter) {
    _deploymentInstance = new DeploymentService(adapter)
    return _deploymentInstance
  }
  if (!_deploymentInstance) {
    _deploymentInstance = new DeploymentService(createStorageAdapter())
  }
  return _deploymentInstance
}
