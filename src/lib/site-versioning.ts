/**
 * Site Versioning Service (CP1)
 *
 * Manages immutable site snapshots for audit trail, rollback, and deployment.
 *
 * Key behaviors:
 * - Snapshots are append-only (never overwritten)
 * - Data hash provides integrity verification
 * - Secrets are stripped from snapshots
 * - Restore writes snapshot back to active site state
 *
 * All mutations logged via SiteRegistry's appendAudit.
 */

import type {
  SiteVersion,
  SiteVersionSnapshot,
  SiteCoreBranding,
  SiteCoreSEO,
  NormalizedSiteData,
  SiteData,
} from '@/lib/types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'
import { KEYS, getSiteRegistry } from '@/lib/site-registry'

// ─── Snapshot Utilities ──────────────────────────────────────

/**
 * Compute SHA-256 hash of canonical JSON.
 * Keys are sorted to ensure deterministic output.
 */
async function computeHash(data: unknown): Promise<string> {
  const canonical = JSON.stringify(data, Object.keys(data as object).sort())
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonical))
  const hashArray = Array.from(new Uint8Array(buffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Canonicalize JSON for hashing.
 * Stable key ordering, no timestamps in payload.
 * Returns the canonical string for debugging if needed.
 */
export function canonicalizeSnapshot(snapshot: SiteVersionSnapshot): string {
  return JSON.stringify(snapshot, Object.keys(snapshot).sort())
}

/**
 * Extract a version-safe snapshot from NormalizedSiteData.
 * Strips secrets: GitHub tokens, Stripe secrets, admin passwords, etc.
 */
export function extractSnapshot(
  normalized: NormalizedSiteData,
): SiteVersionSnapshot {
  const snapshot: SiteVersionSnapshot = {
    type: normalized.type,
    name: normalized.name,
    slug: normalized.slug,
    domain: normalized.domain,
    branding: normalized.branding ? stripSecrets(normalized.branding) : undefined,
    seo: normalized.seo ? stripSecretsFromSEO(normalized.seo) : undefined,
    contentBlocks: extractContentBlocks(normalized),
    themeTokens: undefined, // Reserved for future theme overrides
  }
  return snapshot
}

/**
 * Strip secrets from branding (nothing sensitive expected, but future-proofs)
 */
function stripSecrets(branding: SiteCoreBranding): SiteCoreBranding {
  return {
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    logo: branding.logo,
    favicon: branding.favicon,
  }
}

function stripSecretsFromSEO(seo: SiteCoreSEO): SiteCoreSEO {
  return {
    title: seo.title,
    description: seo.description,
    ogImage: seo.ogImage,
  }
}

/**
 * Extract content blocks from normalized site data.
 * Different site types have different content structures.
 */
function extractContentBlocks(normalized: NormalizedSiteData): Record<string, unknown> {
  const blocks: Record<string, unknown> = {}

  // Type-specific content extraction
  if (normalized.type === 'law-firm') {
    const lf = normalized as unknown as Record<string, unknown>
    blocks.caseResults = lf.caseResults ?? []
    blocks.attorneys = lf.attorneys ?? []
    blocks.practiceAreas = lf.practiceAreas ?? []
    blocks.testimonials = lf.testimonials ?? []
    blocks.blogPosts = lf.blogPosts ?? []
    // Note: intakeSubmissions excluded (user data, not content)
  } else if (normalized.type === 'small-business') {
    const smb = normalized as unknown as Record<string, unknown>
    blocks.services = smb.services ?? []
    blocks.team = smb.team ?? []
    blocks.testimonials = smb.testimonials ?? []
    blocks.faqs = smb.faqs ?? []
    blocks.galleryImages = smb.galleryImages ?? []
    blocks.promotions = smb.promotions ?? []
    blocks.blogPosts = smb.blogPosts ?? []
    // Note: contactSubmissions excluded (user data)
  } else if (normalized.type === 'agency') {
    const ag = normalized as unknown as Record<string, unknown>
    blocks.projects = ag.projects ?? []
    // Note: invoices, proposals, timeEntries excluded (sensitive business data)
  }

  return blocks
}

// ─── SiteVersioningService ───────────────────────────────────

export class SiteVersioningService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Create a new version snapshot from current site state.
   * Appends to versions list; never overwrites existing versions.
   */
  async createVersion(
    siteId: string,
    actor: string,
    label?: string,
    notes?: string,
  ): Promise<SiteVersion> {
    const registry = getSiteRegistry(this.adapter)
    
    // Get normalized site data
    const normalized = await registry.getNormalizedSiteData(siteId)
    if (!normalized) {
      throw new Error(`Site not found or has no data: ${siteId}`)
    }

    // Extract snapshot (no secrets)
    const snapshotData = extractSnapshot(normalized)
    const dataHash = await computeHash(snapshotData)
    const now = new Date().toISOString()

    const version: SiteVersion = {
      versionId: crypto.randomUUID(),
      siteId,
      snapshotData,
      dataHash,
      createdAt: now,
      createdBy: actor,
      label,
      notes,
    }

    // Append to versions index
    const versionsKey = KEYS.versionsIndex(siteId)
    const versions = (await this.adapter.get<string[]>(versionsKey)) ?? []
    versions.unshift(version.versionId) // Newest first
    await this.adapter.set(versionsKey, versions)

    // Store version data
    await this.adapter.set(KEYS.version(siteId, version.versionId), version)

    // Update site summary with currentVersionId
    await this.updateSiteVersionRef(siteId, version.versionId, actor)

    // Audit log
    await registry.appendAudit(siteId, {
      actor,
      action: 'version.created',
      entityType: 'site-version',
      entityId: version.versionId,
      details: { label, dataHash: version.dataHash },
    })

    return version
  }

  /**
   * List all versions for a site (newest first).
   */
  async listVersions(siteId: string): Promise<SiteVersion[]> {
    const versionsKey = KEYS.versionsIndex(siteId)
    const versionIds = (await this.adapter.get<string[]>(versionsKey)) ?? []
    
    const versions: SiteVersion[] = []
    for (const versionId of versionIds) {
      const version = await this.getVersion(siteId, versionId)
      if (version) {
        versions.push(version)
      }
    }
    return versions
  }

  /**
   * Get a single version by ID.
   */
  async getVersion(siteId: string, versionId: string): Promise<SiteVersion | null> {
    return this.adapter.get<SiteVersion>(KEYS.version(siteId, versionId))
  }

  /**
   * Restore a version's snapshot to the active site state.
   * This updates the site data (config + content) from the snapshot.
   * Creates a new version afterwards to record the restore action.
   */
  async restoreVersion(
    siteId: string,
    versionId: string,
    actor: string,
  ): Promise<SiteVersion> {
    const registry = getSiteRegistry(this.adapter)
    const summary = await registry.get(siteId)
    if (!summary) {
      throw new Error(`Site not found: ${siteId}`)
    }

    const version = await this.getVersion(siteId, versionId)
    if (!version) {
      throw new Error(`Version not found: ${versionId}`)
    }

    // Get current site data to merge snapshot content back
    const currentData = await registry.getSiteData(siteId)
    if (!currentData) {
      throw new Error(`Site has no data: ${siteId}`)
    }

    // Apply snapshot to site data
    const updatedData = applySnapshotToData(currentData, version.snapshotData, summary.type)
    await registry.setSiteData(siteId, updatedData, actor)

    // Log the restore
    await registry.appendAudit(siteId, {
      actor,
      action: 'version.restored',
      entityType: 'site-version',
      entityId: versionId,
      details: { 
        restoredFromLabel: version.label,
        restoredFromHash: version.dataHash,
      },
    })

    // Create a new version to record the post-restore state
    const newVersion = await this.createVersion(
      siteId,
      actor,
      undefined,
      `Restored from ${version.label || versionId}`,
    )

    return newVersion
  }

  /**
   * Compare two versions and return a diff summary.
   */
  async compareVersions(
    siteId: string,
    versionId1: string,
    versionId2: string,
  ): Promise<VersionDiff | null> {
    const v1 = await this.getVersion(siteId, versionId1)
    const v2 = await this.getVersion(siteId, versionId2)
    if (!v1 || !v2) return null

    return {
      fromVersion: v1,
      toVersion: v2,
      hashChanged: v1.dataHash !== v2.dataHash,
      changedBlocks: findChangedBlocks(v1.snapshotData.contentBlocks, v2.snapshotData.contentBlocks),
    }
  }

  /**
   * Update the site summary with current version reference.
   */
  private async updateSiteVersionRef(
    siteId: string,
    versionId: string,
    actor: string,
  ): Promise<void> {
    const registry = getSiteRegistry(this.adapter)
    const sites = await registry.list()
    const idx = sites.findIndex((s) => s.siteId === siteId)
    if (idx === -1) return

    // Direct update to preserve backwards compat - only set optional fields
    const site = sites[idx]
    site.currentVersionId = versionId
    site.updatedAt = new Date().toISOString()
    await this.adapter.set(KEYS.SITES_INDEX, sites)
  }
}

// ─── Diff Types ──────────────────────────────────────────────

export interface VersionDiff {
  fromVersion: SiteVersion
  toVersion: SiteVersion
  hashChanged: boolean
  changedBlocks: string[]
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Find which content block keys changed between two snapshots.
 */
function findChangedBlocks(
  blocks1: Record<string, unknown>,
  blocks2: Record<string, unknown>,
): string[] {
  const allKeys = new Set([...Object.keys(blocks1), ...Object.keys(blocks2)])
  const changed: string[] = []
  for (const key of allKeys) {
    if (JSON.stringify(blocks1[key]) !== JSON.stringify(blocks2[key])) {
      changed.push(key)
    }
  }
  return changed
}

/**
 * Apply a snapshot's content blocks back to site data.
 * This merges the snapshot values into the existing data structure.
 */
function applySnapshotToData(
  currentData: SiteData,
  snapshot: SiteVersionSnapshot,
  siteType: string,
): SiteData {
  // Use unknown as intermediate to allow flexible property assignment
  const data = { ...currentData } as unknown as Record<string, unknown>

  // Apply content blocks based on site type
  if (siteType === 'law-firm') {
    data.caseResults = snapshot.contentBlocks.caseResults ?? data.caseResults
    data.attorneys = snapshot.contentBlocks.attorneys ?? data.attorneys
    data.practiceAreas = snapshot.contentBlocks.practiceAreas ?? data.practiceAreas
    data.testimonials = snapshot.contentBlocks.testimonials ?? data.testimonials
    data.blogPosts = snapshot.contentBlocks.blogPosts ?? data.blogPosts
  } else if (siteType === 'small-business') {
    data.services = snapshot.contentBlocks.services ?? data.services
    data.team = snapshot.contentBlocks.team ?? data.team
    data.testimonials = snapshot.contentBlocks.testimonials ?? data.testimonials
    data.faqs = snapshot.contentBlocks.faqs ?? data.faqs
    data.galleryImages = snapshot.contentBlocks.galleryImages ?? data.galleryImages
    data.promotions = snapshot.contentBlocks.promotions ?? data.promotions
    data.blogPosts = snapshot.contentBlocks.blogPosts ?? data.blogPosts
  } else if (siteType === 'agency') {
    data.projects = snapshot.contentBlocks.projects ?? data.projects
  }

  return data as unknown as SiteData
}

// ─── Singleton ───────────────────────────────────────────────

let _versioningInstance: SiteVersioningService | null = null

/**
 * Get the global SiteVersioningService instance.
 */
export function getSiteVersioningService(adapter?: StorageAdapter): SiteVersioningService {
  if (adapter) {
    _versioningInstance = new SiteVersioningService(adapter)
    return _versioningInstance
  }
  if (!_versioningInstance) {
    _versioningInstance = new SiteVersioningService(createStorageAdapter())
  }
  return _versioningInstance
}
