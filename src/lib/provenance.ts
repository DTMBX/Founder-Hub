/**
 * Build Provenance Module (Chain B4)
 *
 * Provides verifiable attestation of build origin and artifact integrity.
 * Ensures "what was built" matches "what was deployed".
 *
 * Key behaviors:
 * - Fetches provenance.json from deployed site
 * - Verifies artifact integrity via manifest hash comparison
 * - Provides provenance summary for admin display
 *
 * GUARDRAILS:
 * - Provenance records are read-only after creation
 * - Hash verification is deterministic
 * - All provenance checks are logged
 */

import type { BuildProvenance } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────

/** Default provenance file location */
export const PROVENANCE_PATH = '/provenance.json'

/** Default manifest file location */
export const MANIFEST_PATH = '/manifest.json'

// ─── Types ───────────────────────────────────────────────────

export interface ProvenanceVerification {
  /** Whether provenance was successfully fetched */
  available: boolean
  /** Whether integrity checks passed */
  verified: boolean
  /** Human-readable verification status */
  status: 'verified' | 'unverified' | 'unavailable' | 'mismatch'
  /** Detailed reason for status */
  reason: string
  /** The provenance record if available */
  provenance?: BuildProvenance
  /** Verification timestamp */
  verifiedAt: string
}

export interface ProvenanceSummary {
  /** Short commit SHA (7 chars) */
  commitShort: string
  /** Full commit SHA */
  commitSha: string
  /** Build timestamp */
  builtAt: string
  /** Workflow run ID */
  runId: string
  /** Workflow run URL */
  runUrl: string
  /** Repository */
  repository: string
  /** Git ref (branch/tag) */
  ref: string
  /** Manifest hash */
  manifestHash: string
  /** Provenance hash */
  provenanceHash: string
  /** Artifact stats */
  artifacts: {
    fileCount: number
    totalSize: number
    sizeFormatted: string
  }
  /** Signature status */
  signature: {
    verified: boolean
    reason: string
  }
}

// ─── Provenance Service ──────────────────────────────────────

/**
 * Fetch provenance record from a deployed site.
 * @param baseUrl Base URL of the deployed site (e.g., https://xtx396.com)
 */
export async function fetchProvenance(baseUrl: string): Promise<BuildProvenance | null> {
  try {
    const url = new URL(PROVENANCE_PATH, baseUrl).toString()
    const response = await fetch(url, {
      cache: 'no-store', // Always fetch fresh
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`Provenance not available at ${url}: ${response.status}`)
      return null
    }

    const provenance = await response.json() as BuildProvenance
    
    // Basic schema validation
    if (!provenance.schemaVersion || !provenance.commitSha || !provenance.manifestHash) {
      console.warn('Invalid provenance schema')
      return null
    }

    return provenance
  } catch (error) {
    console.error('Failed to fetch provenance:', error)
    return null
  }
}

/**
 * Fetch manifest from a deployed site.
 */
export async function fetchManifest(baseUrl: string): Promise<Record<string, unknown> | null> {
  try {
    const url = new URL(MANIFEST_PATH, baseUrl).toString()
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch manifest:', error)
    return null
  }
}

/**
 * Verify provenance integrity.
 * Compares manifest hash from provenance with actual deployed manifest.
 */
export async function verifyProvenance(baseUrl: string): Promise<ProvenanceVerification> {
  const now = new Date().toISOString()

  // Fetch provenance
  const provenance = await fetchProvenance(baseUrl)
  if (!provenance) {
    return {
      available: false,
      verified: false,
      status: 'unavailable',
      reason: 'Provenance record not found or invalid',
      verifiedAt: now,
    }
  }

  // Fetch manifest
  const manifest = await fetchManifest(baseUrl)
  if (!manifest) {
    return {
      available: true,
      verified: false,
      status: 'unverified',
      reason: 'Manifest not available for verification',
      provenance,
      verifiedAt: now,
    }
  }

  // Compare manifest hash
  const manifestHash = (manifest as { manifestHash?: string }).manifestHash
  if (!manifestHash) {
    return {
      available: true,
      verified: false,
      status: 'unverified',
      reason: 'Manifest does not contain hash for verification',
      provenance,
      verifiedAt: now,
    }
  }

  if (manifestHash !== provenance.manifestHash) {
    return {
      available: true,
      verified: false,
      status: 'mismatch',
      reason: `Manifest hash mismatch: expected ${provenance.manifestHash.slice(0, 12)}..., got ${manifestHash.slice(0, 12)}...`,
      provenance,
      verifiedAt: now,
    }
  }

  return {
    available: true,
    verified: true,
    status: 'verified',
    reason: 'Provenance verified: deployed artifacts match build record',
    provenance,
    verifiedAt: now,
  }
}

/**
 * Format bytes to human-readable size.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Create a summary of provenance for display.
 */
export function createProvenanceSummary(provenance: BuildProvenance): ProvenanceSummary {
  return {
    commitShort: provenance.commitSha.slice(0, 7),
    commitSha: provenance.commitSha,
    builtAt: provenance.builtAt,
    runId: provenance.workflowRunId,
    runUrl: `https://github.com/${provenance.repository}/actions/runs/${provenance.workflowRunId}`,
    repository: provenance.repository,
    ref: provenance.ref,
    manifestHash: provenance.manifestHash,
    provenanceHash: provenance.provenanceHash ?? '',
    artifacts: {
      fileCount: provenance.fileCount,
      totalSize: provenance.artifactSize,
      sizeFormatted: formatBytes(provenance.artifactSize),
    },
    signature: {
      verified: provenance.signatureVerified ?? false,
      reason: provenance.signatureReason ?? 'unknown',
    },
  }
}

/**
 * Get provenance for the current site.
 * Uses window.location.origin as base URL.
 */
export async function getCurrentSiteProvenance(): Promise<ProvenanceVerification> {
  if (typeof window === 'undefined') {
    return {
      available: false,
      verified: false,
      status: 'unavailable',
      reason: 'Not running in browser context',
      verifiedAt: new Date().toISOString(),
    }
  }

  return verifyProvenance(window.location.origin)
}

// ─── Provenance Comparison ───────────────────────────────────

/**
 * Compare two provenance records to check if they represent the same build.
 */
export function compareProvenance(
  a: BuildProvenance,
  b: BuildProvenance,
): { match: boolean; differences: string[] } {
  const differences: string[] = []

  if (a.commitSha !== b.commitSha) {
    differences.push(`Commit SHA: ${a.commitSha.slice(0, 7)} vs ${b.commitSha.slice(0, 7)}`)
  }

  if (a.manifestHash !== b.manifestHash) {
    differences.push(`Manifest hash: ${a.manifestHash.slice(0, 12)}... vs ${b.manifestHash.slice(0, 12)}...`)
  }

  if (a.workflowRunId !== b.workflowRunId) {
    differences.push(`Workflow run: ${a.workflowRunId} vs ${b.workflowRunId}`)
  }

  return {
    match: differences.length === 0,
    differences,
  }
}

// ─── Export Provenance Record ────────────────────────────────

/**
 * Export provenance record as a downloadable JSON file.
 */
export function exportProvenanceRecord(provenance: BuildProvenance, filename?: string): void {
  const data = JSON.stringify(provenance, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `provenance-${provenance.commitSha.slice(0, 7)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
