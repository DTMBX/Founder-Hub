/**
 * ops/publish/export/exportManifest.ts
 *
 * Generates a deterministic export manifest for ZIP packages.
 * Includes per-file SHA-256 hashes and a top-level manifest hash.
 */

export interface ExportManifestEntry {
  readonly path: string
  readonly sha256: string
  readonly size: number
}

export interface ExportManifest {
  readonly version: string
  readonly siteId: string
  readonly blueprintId: string
  readonly generatedAt: string
  readonly exportedAt: string
  readonly correlationId: string
  readonly manifestHash: string
  readonly watermarked: boolean
  readonly demoMode: boolean
  readonly entries: readonly ExportManifestEntry[]
}

/**
 * Build a deterministic export manifest.
 * Entries are sorted by path for determinism.
 * manifestHash = sha256-like hash of sorted entry hashes joined by ':'.
 */
export function buildExportManifest(
  siteId: string,
  blueprintId: string,
  generatedAt: string,
  correlationId: string,
  watermarked: boolean,
  demoMode: boolean,
  entries: readonly ExportManifestEntry[],
  hashFn: (input: string) => string,
): ExportManifest {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path))
  const hashInput = sorted.map(e => e.sha256).join(':')
  const manifestHash = hashFn(hashInput)

  return {
    version: '1.0.0',
    siteId,
    blueprintId,
    generatedAt,
    exportedAt: new Date().toISOString(),
    correlationId,
    manifestHash,
    watermarked,
    demoMode,
    entries: sorted,
  }
}
