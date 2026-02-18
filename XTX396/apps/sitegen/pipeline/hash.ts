/**
 * Pipeline Step: Hash
 *
 * Computes SHA-256 hashes for every rendered artifact.
 * Produces a deterministic manifest — same input always yields same hashes.
 *
 * Uses the Web Crypto API (available in Node 18+ and all modern browsers).
 */

import type { WatermarkResult, HashResult, HashedArtifact } from './types'

// ─── SHA-256 ─────────────────────────────────────────────────

/**
 * Computes SHA-256 hex digest of a UTF-8 string.
 * Deterministic — same input always produces same output.
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Hash Step ───────────────────────────────────────────────

/**
 * Hashes all pages and assets from the watermark step.
 *
 * Returns a HashResult with per-artifact hashes and a manifest hash
 * computed by sorting artifact paths and hashing the concatenated hashes.
 * This ensures the manifest itself is deterministic.
 */
export async function hash(watermarkResult: WatermarkResult): Promise<HashResult> {
  const artifacts: HashedArtifact[] = []

  // Hash pages
  for (const page of watermarkResult.pages) {
    const pageHash = await sha256(page.html)
    artifacts.push({
      path: `/${page.slug}.html`,
      sha256: pageHash,
      size: new TextEncoder().encode(page.html).length,
    })
  }

  // Hash assets
  for (const asset of watermarkResult.assets) {
    const assetHash = await sha256(asset.content)
    artifacts.push({
      path: asset.path,
      sha256: assetHash,
      size: new TextEncoder().encode(asset.content).length,
    })
  }

  // Sort by path for deterministic ordering
  artifacts.sort((a, b) => a.path.localeCompare(b.path))

  // Compute manifest hash = SHA-256 of sorted, concatenated artifact hashes
  const combinedHashes = artifacts.map((a) => a.sha256).join(':')
  const manifestHash = await sha256(combinedHashes)

  return { artifacts, manifestHash }
}
