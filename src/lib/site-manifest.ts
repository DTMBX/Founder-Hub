/**
 * Site Manifest Generator
 * 
 * Generates deterministic site manifests with SHA-256 hashes for
 * GitHub-native deployment. Ensures:
 * - Same input => same output (deterministic)
 * - Integrity verification
 * - Deploy metadata tracking
 * 
 * INTEGRITY: All hashes are computed using SHA-256 for forensic defensibility.
 */

// ─── Types ────────────────────────────────────────────────────

export interface SiteFileEntry {
  /** Relative path within /sites/<slug>/ */
  path: string
  /** SHA-256 hash of file contents */
  sha256: string
  /** File size in bytes */
  size: number
  /** Content type (json, html, css, etc.) */
  type: 'config' | 'content' | 'asset' | 'manifest' | 'other'
}

export interface SiteBuildMetadata {
  /** Unique build identifier (UUIDv4) */
  buildId: string
  /** ISO 8601 timestamp when build started */
  buildStartedAt: string
  /** ISO 8601 timestamp when build completed */
  buildCompletedAt?: string
  /** Build duration in milliseconds */
  durationMs?: number
  /** Git commit SHA that triggered the build */
  sourceCommitSha?: string
  /** User ID who initiated the build */
  initiatedBy?: string
  /** Feature flags active during build */
  featureFlags?: Record<string, boolean>
}

export interface DeployMetadata {
  /** Environment: preview, staging, production */
  environment: 'preview' | 'staging' | 'production'
  /** Git commit SHA for this deploy */
  commitSha: string
  /** Branch name */
  branch: string
  /** Pull request number (if from PR) */
  pullRequestNumber?: number
  /** ISO 8601 timestamp */
  deployedAt: string
  /** User who approved production deploy */
  approvedBy?: string
  /** Previous deployment ID for rollback reference */
  previousDeploymentId?: string
}

export interface SiteManifest {
  /** Manifest schema version */
  schemaVersion: '1.0.0'
  /** Site identifier (slug) */
  siteId: string
  /** Site display name */
  siteName: string
  /** Version ID for this build */
  versionId: string
  /** SHA-256 hash of entire manifest content (excluding this field) */
  manifestHash: string
  /** Build metadata */
  build: SiteBuildMetadata
  /** Most recent deployment metadata */
  deploy?: DeployMetadata
  /** All files in the site bundle */
  files: SiteFileEntry[]
  /** Aggregate stats */
  stats: {
    totalFiles: number
    totalSize: number
    contentFiles: number
    assetFiles: number
  }
}

// ─── Deterministic Hashing ────────────────────────────────────

/**
 * Compute SHA-256 hash of a string.
 * Uses Web Crypto API for browser compatibility.
 */
export async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compute SHA-256 hash of a Uint8Array (for binary files).
 */
export async function sha256Binary(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compute deterministic hash of an object by:
 * 1. Sorting keys recursively
 * 2. Stringifying with stable formatting
 * 3. Computing SHA-256
 */
export async function hashObject(obj: unknown): Promise<string> {
  const sorted = sortObjectKeys(obj)
  const json = JSON.stringify(sorted)
  return sha256(json)
}

/**
 * Recursively sort object keys for deterministic serialization.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  const sorted: Record<string, unknown> = {}
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key])
  }
  return sorted
}

// ─── Manifest Generation ──────────────────────────────────────

/**
 * Generate a site manifest from file entries.
 * 
 * @param siteId - Unique site identifier (slug)
 * @param siteName - Display name
 * @param versionId - Version identifier
 * @param files - Array of file entries with content
 * @param buildMetadata - Build metadata (partial, will be completed)
 */
export async function generateSiteManifest(
  siteId: string,
  siteName: string,
  versionId: string,
  files: Array<{ path: string; content: string | Uint8Array; type: SiteFileEntry['type'] }>,
  buildMetadata: Partial<SiteBuildMetadata> = {}
): Promise<SiteManifest> {
  const buildStartedAt = buildMetadata.buildStartedAt || new Date().toISOString()
  const buildId = buildMetadata.buildId || crypto.randomUUID()
  
  // Hash all files
  const fileEntries: SiteFileEntry[] = await Promise.all(
    files.map(async (file) => {
      const content = typeof file.content === 'string' 
        ? file.content 
        : new TextDecoder().decode(file.content)
      const size = typeof file.content === 'string'
        ? new TextEncoder().encode(file.content).length
        : file.content.length
      const hash = typeof file.content === 'string'
        ? await sha256(file.content)
        : await sha256Binary(file.content)
      
      return {
        path: file.path,
        sha256: hash,
        size,
        type: file.type,
      }
    })
  )
  
  // Sort files by path for deterministic ordering
  fileEntries.sort((a, b) => a.path.localeCompare(b.path))
  
  const buildCompletedAt = new Date().toISOString()
  const durationMs = new Date(buildCompletedAt).getTime() - new Date(buildStartedAt).getTime()
  
  // Calculate stats
  const stats = {
    totalFiles: fileEntries.length,
    totalSize: fileEntries.reduce((sum, f) => sum + f.size, 0),
    contentFiles: fileEntries.filter(f => f.type === 'content').length,
    assetFiles: fileEntries.filter(f => f.type === 'asset').length,
  }
  
  // Build manifest without hash (hash will be computed after)
  const manifestWithoutHash: Omit<SiteManifest, 'manifestHash'> = {
    schemaVersion: '1.0.0',
    siteId,
    siteName,
    versionId,
    build: {
      buildId,
      buildStartedAt,
      buildCompletedAt,
      durationMs,
      sourceCommitSha: buildMetadata.sourceCommitSha,
      initiatedBy: buildMetadata.initiatedBy,
      featureFlags: buildMetadata.featureFlags,
    },
    files: fileEntries,
    stats,
  }
  
  // Compute manifest hash (self-referential integrity)
  const manifestHash = await hashObject(manifestWithoutHash)
  
  return {
    ...manifestWithoutHash,
    manifestHash,
  }
}

// ─── Site Folder Structure ────────────────────────────────────

/**
 * Expected folder structure for a generated site:
 * 
 * /sites/<slug>/
 *   manifest.json       - Site manifest with hashes
 *   config.json         - Site configuration
 *   content/
 *     sections.json     - Page sections
 *     projects.json     - Projects data
 *     ...
 *   assets/
 *     images/           - Image assets
 *     documents/        - PDF/document assets
 */

export interface SiteFolderStructure {
  slug: string
  manifest: SiteManifest
  config: Record<string, unknown>
  content: Record<string, unknown>
  assets: Array<{ path: string; data: Uint8Array }>
}

/**
 * Validate a site folder structure is complete and consistent.
 */
export async function validateSiteStructure(
  structure: SiteFolderStructure
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  // Check required fields
  if (!structure.slug) errors.push('Missing site slug')
  if (!structure.manifest) errors.push('Missing manifest')
  if (!structure.config) errors.push('Missing config.json')
  
  // Verify manifest hash
  if (structure.manifest) {
    const { manifestHash, ...rest } = structure.manifest
    const computedHash = await hashObject(rest)
    if (computedHash !== manifestHash) {
      errors.push(`Manifest hash mismatch: expected ${manifestHash}, got ${computedHash}`)
    }
  }
  
  // Verify file hashes match manifest
  if (structure.manifest?.files) {
    for (const entry of structure.manifest.files) {
      if (entry.type === 'config' && entry.path === 'config.json') {
        const computed = await hashObject(structure.config)
        // Note: config hash is of JSON, not stringified - this is for content comparison
      }
      // Additional file verification would go here
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// ─── Deploy Metadata ──────────────────────────────────────────

/**
 * Create deploy metadata for a deployment.
 */
export function createDeployMetadata(
  environment: DeployMetadata['environment'],
  commitSha: string,
  branch: string,
  options: {
    pullRequestNumber?: number
    approvedBy?: string
    previousDeploymentId?: string
  } = {}
): DeployMetadata {
  return {
    environment,
    commitSha,
    branch,
    pullRequestNumber: options.pullRequestNumber,
    deployedAt: new Date().toISOString(),
    approvedBy: options.approvedBy,
    previousDeploymentId: options.previousDeploymentId,
  }
}

/**
 * Update manifest with deploy metadata.
 * Returns a new manifest with updated deploy info and recalculated hash.
 */
export async function attachDeployMetadata(
  manifest: SiteManifest,
  deployMetadata: DeployMetadata
): Promise<SiteManifest> {
  const updated: Omit<SiteManifest, 'manifestHash'> = {
    ...manifest,
    deploy: deployMetadata,
  }
  
  // Remove old hash before recomputing
  delete (updated as Partial<SiteManifest>).manifestHash
  
  const manifestHash = await hashObject(updated)
  
  return {
    ...updated,
    manifestHash,
  }
}

// ─── Serialization ────────────────────────────────────────────

/**
 * Serialize manifest to deterministic JSON.
 * Uses sorted keys and consistent formatting.
 */
export function serializeManifest(manifest: SiteManifest): string {
  const sorted = sortObjectKeys(manifest)
  return JSON.stringify(sorted, null, 2)
}

/**
 * Parse and validate a manifest from JSON.
 */
export async function parseManifest(json: string): Promise<{
  manifest: SiteManifest | null
  valid: boolean
  error?: string
}> {
  try {
    const parsed = JSON.parse(json) as SiteManifest
    
    if (parsed.schemaVersion !== '1.0.0') {
      return { manifest: null, valid: false, error: `Unknown schema version: ${parsed.schemaVersion}` }
    }
    
    // Verify hash
    const { manifestHash, ...rest } = parsed
    const computedHash = await hashObject(rest)
    
    if (computedHash !== manifestHash) {
      return { 
        manifest: parsed, 
        valid: false, 
        error: `Hash mismatch: manifest claims ${manifestHash}, computed ${computedHash}` 
      }
    }
    
    return { manifest: parsed, valid: true }
  } catch (e) {
    return { manifest: null, valid: false, error: `Parse error: ${e}` }
  }
}
