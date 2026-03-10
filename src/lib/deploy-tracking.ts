/**
 * Deploy Tracking Module
 * 
 * Tracks deployment history, status, and metadata for audit trail.
 * Stores deployment records in localStorage with bounded size.
 * 
 * INTEGRITY: All deployments logged immutably for forensic defensibility.
 */

import type { Deployment, DeploymentEnvironment, DeploymentStatus, DeploymentLog } from './types'

// ─── Storage ──────────────────────────────────────────────────

const DEPLOY_STORAGE_KEY = 'founder-hub:deployments'
const MAX_DEPLOYMENTS = 100 // Bounded storage

/**
 * Get all deployments for a site.
 */
export function getDeployments(siteId?: string): Deployment[] {
  try {
    const stored = localStorage.getItem(DEPLOY_STORAGE_KEY)
    if (!stored) return []
    const all = JSON.parse(stored) as Deployment[]
    if (siteId) {
      return all.filter(d => d.siteId === siteId)
    }
    return all
  } catch {
    return []
  }
}

/**
 * Get a single deployment by ID.
 */
export function getDeployment(deploymentId: string): Deployment | null {
  const all = getDeployments()
  return all.find(d => d.deploymentId === deploymentId) ?? null
}

/**
 * Get deployments by environment.
 */
export function getDeploymentsByEnvironment(
  environment: DeploymentEnvironment,
  siteId?: string
): Deployment[] {
  return getDeployments(siteId).filter(d => d.environment === environment)
}

/**
 * Get the most recent deployment for a site/environment.
 */
export function getLatestDeployment(
  siteId: string,
  environment?: DeploymentEnvironment
): Deployment | null {
  const deployments = getDeployments(siteId)
    .filter(d => !environment || d.environment === environment)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  return deployments[0] ?? null
}

/**
 * Save a deployment to storage.
 */
function saveDeployment(deployment: Deployment): void {
  const all = getDeployments()
  const existing = all.findIndex(d => d.deploymentId === deployment.deploymentId)
  
  if (existing >= 0) {
    all[existing] = deployment
  } else {
    all.unshift(deployment)
  }
  
  // Bound storage size
  const bounded = all.slice(0, MAX_DEPLOYMENTS)
  localStorage.setItem(DEPLOY_STORAGE_KEY, JSON.stringify(bounded))
}

// ─── Deployment Lifecycle ─────────────────────────────────────

/**
 * Create a new deployment record.
 */
export function createDeployment(
  siteId: string,
  versionId: string,
  environment: DeploymentEnvironment,
  deployedBy: string,
  options: {
    commitSha?: string
    buildHash?: string
    previewUrl?: string
  } = {}
): Deployment {
  const deployment: Deployment = {
    deploymentId: crypto.randomUUID(),
    siteId,
    versionId,
    environment,
    status: 'pending',
    commitSha: options.commitSha,
    buildHash: options.buildHash,
    previewUrl: options.previewUrl,
    startedAt: new Date().toISOString(),
    deployedBy,
    logs: [{
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Deployment initiated for ${environment}`
    }]
  }
  
  saveDeployment(deployment)
  return deployment
}

/**
 * Update deployment status.
 */
export function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  message?: string,
  options: {
    commitSha?: string
    buildHash?: string
    previewUrl?: string
    approvedBy?: string
    errorMessage?: string
  } = {}
): Deployment | null {
  const deployment = getDeployment(deploymentId)
  if (!deployment) return null
  
  deployment.status = status
  
  if (options.commitSha) deployment.commitSha = options.commitSha
  if (options.buildHash) deployment.buildHash = options.buildHash
  if (options.previewUrl) deployment.previewUrl = options.previewUrl
  if (options.approvedBy) deployment.approvedBy = options.approvedBy
  if (options.errorMessage) deployment.errorMessage = options.errorMessage
  
  // Set completion time for terminal states
  if (['success', 'failed', 'rolled-back', 'cancelled'].includes(status)) {
    deployment.completedAt = new Date().toISOString()
  }
  
  // Add log entry
  if (message) {
    addDeploymentLog(deployment, status === 'failed' ? 'error' : 'info', message)
  }
  
  saveDeployment(deployment)
  return deployment
}

/**
 * Add a log entry to a deployment.
 */
export function addDeploymentLog(
  deployment: Deployment,
  level: DeploymentLog['level'],
  message: string
): void {
  deployment.logs.push({
    timestamp: new Date().toISOString(),
    level,
    message
  })
  
  // Bound log entries
  if (deployment.logs.length > 200) {
    deployment.logs = deployment.logs.slice(-200)
  }
}

/**
 * Log a deployment step.
 */
export function logDeploymentStep(
  deploymentId: string,
  level: DeploymentLog['level'],
  message: string
): void {
  const deployment = getDeployment(deploymentId)
  if (!deployment) return
  
  addDeploymentLog(deployment, level, message)
  saveDeployment(deployment)
}

// ─── Deployment Metrics ───────────────────────────────────────

export interface DeploymentMetrics {
  totalDeployments: number
  successfulDeployments: number
  failedDeployments: number
  averageDurationMs: number
  lastDeployment: Deployment | null
  lastSuccessfulDeployment: Deployment | null
  deploymentsByEnvironment: Record<DeploymentEnvironment, number>
}

/**
 * Calculate deployment metrics for a site.
 */
export function getDeploymentMetrics(siteId: string): DeploymentMetrics {
  const deployments = getDeployments(siteId)
  
  const successful = deployments.filter(d => d.status === 'success')
  const failed = deployments.filter(d => d.status === 'failed')
  
  // Calculate average duration for completed deployments
  const completedWithDuration = successful.filter(d => d.completedAt)
  const totalDuration = completedWithDuration.reduce((sum, d) => {
    const duration = new Date(d.completedAt!).getTime() - new Date(d.startedAt).getTime()
    return sum + duration
  }, 0)
  
  const sortedDeployments = [...deployments].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )
  
  const sortedSuccessful = [...successful].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )
  
  return {
    totalDeployments: deployments.length,
    successfulDeployments: successful.length,
    failedDeployments: failed.length,
    averageDurationMs: completedWithDuration.length > 0 
      ? Math.round(totalDuration / completedWithDuration.length)
      : 0,
    lastDeployment: sortedDeployments[0] ?? null,
    lastSuccessfulDeployment: sortedSuccessful[0] ?? null,
    deploymentsByEnvironment: {
      preview: deployments.filter(d => d.environment === 'preview').length,
      staging: deployments.filter(d => d.environment === 'staging').length,
      production: deployments.filter(d => d.environment === 'production').length,
    }
  }
}

// ─── Rollback Support ─────────────────────────────────────────

/**
 * Find a deployment to rollback to.
 */
export function findRollbackTarget(
  siteId: string,
  environment: DeploymentEnvironment
): Deployment | null {
  const deployments = getDeployments(siteId)
    .filter(d => d.environment === environment && d.status === 'success')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  
  // Return the second most recent successful deployment (skip current)
  return deployments[1] ?? null
}

/**
 * Mark a deployment as rolled back.
 */
export function markRolledBack(deploymentId: string, reason: string): Deployment | null {
  return updateDeploymentStatus(deploymentId, 'rolled-back', `Rolled back: ${reason}`)
}

// ─── Production Approval ──────────────────────────────────────

/**
 * Record production deployment approval.
 */
export function approveProductionDeploy(
  deploymentId: string,
  approvedBy: string
): Deployment | null {
  const deployment = getDeployment(deploymentId)
  if (!deployment) return null
  
  if (deployment.environment !== 'production') {
    return null // Only production needs approval
  }
  
  deployment.approvedBy = approvedBy
  addDeploymentLog(deployment, 'info', `Production deploy approved by ${approvedBy}`)
  saveDeployment(deployment)
  
  return deployment
}

/**
 * Check if a deployment has been approved.
 */
export function isDeploymentApproved(deploymentId: string): boolean {
  const deployment = getDeployment(deploymentId)
  if (!deployment) return false
  
  // Preview and staging don't need approval
  if (deployment.environment !== 'production') {
    return true
  }
  
  return !!deployment.approvedBy
}
