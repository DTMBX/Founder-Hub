/**
 * Site Migration
 *
 * Migrates legacy single-instance KV keys to the multi-tenant site registry.
 *
 * Legacy keys:
 *   law-firm-showcase   → SiteType 'law-firm'
 *   smb-template         → SiteType 'small-business'
 *   agency-framework     → SiteType 'agency'
 *
 * Migration is idempotent: checks `sites:migrated` flag before running.
 * After migration, old keys are preserved (read-only fallback) and new
 * keys are written under `sites:{siteId}:data`.
 */

import type { SiteType, SiteData } from '@/lib/types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { KEYS, SiteRegistry } from '@/lib/site-registry'

// ─── Legacy Key Map ──────────────────────────────────────────

interface LegacyMapping {
  key: string
  type: SiteType
  defaultName: string
  slug: string
}

const LEGACY_KEYS: LegacyMapping[] = [
  {
    key: 'law-firm-showcase',
    type: 'law-firm',
    defaultName: 'Law Firm Showcase',
    slug: 'law-firm-showcase',
  },
  {
    key: 'smb-template',
    type: 'small-business',
    defaultName: 'SMB Template',
    slug: 'smb-template',
  },
  {
    key: 'agency-framework',
    type: 'agency',
    defaultName: 'Agency Framework',
    slug: 'agency-framework',
  },
]

// ─── Migration ───────────────────────────────────────────────

export interface MigrationResult {
  migrated: boolean
  sitesCreated: number
  siteIds: string[]
  skipped: boolean
  errors: string[]
}

/**
 * Run the migration from legacy single-instance keys to multi-tenant registry.
 *
 * Behavior:
 * 1. Check `sites:migrated`. If already migrated, return early.
 * 2. For each legacy key that has data:
 *    a. Create a SiteSummary with the legacy slug
 *    b. Copy the data to `sites:{siteId}:data`
 *    c. Set status = 'demo'
 * 3. Set `sites:migrated = true`.
 *
 * Legacy keys are NOT deleted — they remain as read-only fallback.
 */
export async function migrateToMultiInstance(adapter: StorageAdapter): Promise<MigrationResult> {
  const result: MigrationResult = {
    migrated: false,
    sitesCreated: 0,
    siteIds: [],
    skipped: false,
    errors: [],
  }

  // Check if already migrated
  const flag = await adapter.get<string>(KEYS.SITES_MIGRATED)
  if (flag === 'true') {
    result.skipped = true
    return result
  }

  const registry = new SiteRegistry(adapter)

  for (const { key, type, defaultName, slug } of LEGACY_KEYS) {
    try {
      const data = await adapter.get<SiteData>(key)
      if (!data) continue

      // Derive a name from the data if possible
      let name = defaultName
      if ('config' in data) {
        const cfg = data.config as unknown as Record<string, unknown>
        if (typeof cfg.firmName === 'string' && cfg.firmName) name = cfg.firmName
        else if (typeof cfg.businessName === 'string' && cfg.businessName) name = cfg.businessName
        else if (typeof cfg.agencyName === 'string' && cfg.agencyName) name = cfg.agencyName
      }

      // Create site via registry (generates siteId, writes empty data)
      const summary = await registry.create(type, name, slug, 'migration')

      // Overwrite the empty data with the migrated data
      await adapter.set(KEYS.siteData(summary.siteId), data)

      // Set status to 'demo' (migrated sites start in demo mode)
      await registry.update(summary.siteId, { status: 'demo' }, 'migration')

      result.siteIds.push(summary.siteId)
      result.sitesCreated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Failed to migrate ${key}: ${msg}`)
    }
  }

  // Mark migration as complete
  await adapter.set(KEYS.SITES_MIGRATED, 'true')
  result.migrated = true

  return result
}

/**
 * Check if migration has been completed.
 */
export async function isMigrated(adapter: StorageAdapter): Promise<boolean> {
  const flag = await adapter.get<string>(KEYS.SITES_MIGRATED)
  return flag === 'true'
}

/**
 * Reset migration flag (for testing / re-migration).
 * Does NOT delete migrated site data.
 */
export async function resetMigration(adapter: StorageAdapter): Promise<void> {
  await adapter.del(KEYS.SITES_MIGRATED)
}
