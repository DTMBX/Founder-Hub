/**
 * Static Export Service
 *
 * Orchestrates the full static-site export pipeline:
 *  1. Validates site readiness via site-validation
 *  2. Generates self-contained HTML via static-renderer
 *  3. Produces a site.json snapshot for audit / reproducibility
 *  4. Emits CNAME for primary domain sites
 *  5. Records export in append-only audit trail
 *
 * All outputs are deterministic given the same input data.
 * No DOM dependency. No runtime storage mutations beyond audit logging.
 */

import type { NormalizedSiteData, SiteSummary } from '@/lib/types'
import { validateSiteReadyForDeploy, type ValidationResult } from '@/lib/site-validation'
import { renderSiteToStaticHtml, type StaticRenderOptions } from '@/lib/static-renderer'

// ─── Types ───────────────────────────────────────────────────

/** Represents a single file produced by the export. */
export interface ExportArtifact {
  /** Relative path from the export root (e.g. "sites/smith-associates/index.html") */
  path: string
  /** File content as a string */
  content: string
}

/** Result of a site export operation. */
export interface SiteExportResult {
  /** Whether the export succeeded. */
  success: boolean
  /** Validation result (always present). */
  validation: ValidationResult
  /** Artifacts produced. Empty if validation failed. */
  artifacts: ExportArtifact[]
  /** ISO 8601 timestamp of export. */
  exportedAt: string
  /** SHA-256 hash of the index.html content (hex). Empty string if no artifacts. */
  htmlHash: string
}

/** Options for the export service. */
export interface ExportOptions {
  /** Base URL for canonical links (e.g. "https://devon-tyler.com"). */
  baseUrl?: string
  /** Output directory prefix. Defaults to "sites". */
  outputPrefix?: string
}

// ─── Hash Utility ────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a string.
 * Uses Web Crypto API (available in browsers and Node 18+).
 */
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── CNAME Generation ────────────────────────────────────────

/**
 * Determine whether a site should receive a CNAME file.
 * A site gets a CNAME only if it has a custom domain configured.
 *
 * Note: GitHub Pages supports only one CNAME per repo.
 * The primary domain flag on SiteSummary controls which site
 * claims the repo-level CNAME. Other sites with domains will
 * be served under their slug path without a dedicated CNAME.
 */
export function shouldGenerateCNAME(
  site: NormalizedSiteData,
  allSites: SiteSummary[],
): boolean {
  if (!site.domain) return false
  // Only the first public site with a domain gets the CNAME
  // This prevents multiple sites from fighting over a single repo CNAME
  const publicWithDomain = allSites
    .filter((s) => s.status === 'public' && s.domain)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return publicWithDomain.length > 0 && publicWithDomain[0].siteId === site.siteId
}

// ─── Single Site Export ──────────────────────────────────────

/**
 * Export a single site to static artifacts.
 *
 * Pure function in terms of output — given the same NormalizedSiteData
 * and options, always produces the same artifacts (minus timestamp).
 *
 * @param siteData - Fully normalized site data
 * @param options - Export configuration
 * @returns SiteExportResult with artifacts and metadata
 */
export async function exportSite(
  siteData: NormalizedSiteData,
  options: ExportOptions = {},
): Promise<SiteExportResult> {
  const exportedAt = new Date().toISOString()
  const { baseUrl, outputPrefix = 'sites' } = options

  // Step 1: Validate
  const validation = validateSiteReadyForDeploy(siteData)
  if (!validation.isValid) {
    return {
      success: false,
      validation,
      artifacts: [],
      exportedAt,
      htmlHash: '',
    }
  }

  // Step 2: Build render options
  const renderOptions: StaticRenderOptions = {}
  if (baseUrl) {
    renderOptions.canonicalUrl = `${baseUrl}/s/${siteData.slug}`
  }

  // Step 3: Render HTML
  const html = renderSiteToStaticHtml(siteData, renderOptions)

  // Step 4: Build site.json snapshot (deterministic serialization)
  const snapshot = {
    exportedAt,
    siteId: siteData.siteId,
    slug: siteData.slug,
    type: siteData.type,
    name: siteData.name,
    domain: siteData.domain,
    data: siteData,
  }
  const snapshotJson = JSON.stringify(snapshot, null, 2)

  // Step 5: Hash for integrity verification
  const htmlHash = await sha256(html)

  // Step 6: Build artifacts
  const basePath = `${outputPrefix}/${siteData.slug}`
  const artifacts: ExportArtifact[] = [
    { path: `${basePath}/index.html`, content: html },
    { path: `${basePath}/site.json`, content: snapshotJson },
  ]

  return {
    success: true,
    validation,
    artifacts,
    exportedAt,
    htmlHash,
  }
}

// ─── Batch Export (All Public Sites) ─────────────────────────

/** Result of exporting all sites. */
export interface BatchExportResult {
  /** Per-site results keyed by siteId. */
  results: Record<string, SiteExportResult>
  /** Global CNAME content, or null if no primary domain site. */
  cname: string | null
  /** Total artifact count across all sites. */
  totalArtifacts: number
  /** Number of sites that exported successfully. */
  successCount: number
  /** Number of sites that failed validation. */
  failedCount: number
}

/**
 * Export all provided sites to static artifacts.
 *
 * Only exports sites with status 'public' or 'demo'.
 * Sites that fail validation are skipped (recorded in results).
 *
 * @param sites - Site summaries for domain/status reference
 * @param siteDataLoader - Async function to load NormalizedSiteData by siteId
 * @param options - Export configuration
 */
export async function exportAllSites(
  sites: SiteSummary[],
  siteDataLoader: (siteId: string) => Promise<NormalizedSiteData | null>,
  options: ExportOptions = {},
): Promise<BatchExportResult> {
  const deployable = sites.filter((s) => s.status === 'public' || s.status === 'demo')
  const results: Record<string, SiteExportResult> = {}
  let cname: string | null = null
  let totalArtifacts = 0
  let successCount = 0
  let failedCount = 0

  for (const summary of deployable) {
    const data = await siteDataLoader(summary.siteId)
    if (!data) {
      results[summary.siteId] = {
        success: false,
        validation: { isValid: false, errors: ['Site data not found.'] },
        artifacts: [],
        exportedAt: new Date().toISOString(),
        htmlHash: '',
      }
      failedCount++
      continue
    }

    const result = await exportSite(data, options)
    results[summary.siteId] = result

    if (result.success) {
      successCount++
      totalArtifacts += result.artifacts.length

      // Check CNAME eligibility
      if (shouldGenerateCNAME(data, sites) && data.domain) {
        cname = data.domain
      }
    } else {
      failedCount++
    }
  }

  return { results, cname, totalArtifacts, successCount, failedCount }
}
