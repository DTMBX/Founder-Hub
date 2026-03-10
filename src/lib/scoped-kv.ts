/**
 * scoped-kv.ts — Site-namespaced KV operations.
 *
 * Wraps the existing kv API from local-storage-kv.ts with
 * workspace-site namespace awareness. All content read/write
 * operations for a specific site should go through this module.
 *
 * The existing kv API is preserved unchanged — this is additive.
 *
 * For Founder-Hub (namespace = 'founder-hub'), the resolved keys
 * are identical to the existing system (e.g. 'founder-hub-sections'),
 * so zero data migration is needed.
 */

import { kv } from '@/lib/local-storage-kv'
import type { WorkspaceSite } from '@/lib/workspace-site'
import { resolveKey } from '@/lib/workspace-site'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScopedKV {
  /** Read a content key for this site */
  get<T>(suffix: string): Promise<T | null>
  /** Write a content key for this site */
  set<T>(suffix: string, value: T): Promise<void>
  /** Delete a content key for this site */
  delete(suffix: string): Promise<void>
  /** Get all content keys for this site that exist in storage */
  keys(): Promise<string[]>
  /** Get the full KV key for a suffix */
  resolve(suffix: string): string
  /** The site this KV is scoped to */
  site: WorkspaceSite
}

// ─── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a site-scoped KV wrapper.
 * All operations are delegated to the global kv with namespaced keys.
 */
export function createScopedKV(site: WorkspaceSite): ScopedKV {
  const ns = site.storageNamespace

  return {
    site,

    resolve(suffix: string): string {
      return resolveKey(ns, suffix)
    },

    async get<T>(suffix: string): Promise<T | null> {
      return kv.get<T>(resolveKey(ns, suffix))
    },

    async set<T>(suffix: string, value: T): Promise<void> {
      return kv.set(resolveKey(ns, suffix), value)
    },

    async delete(suffix: string): Promise<void> {
      return kv.delete(resolveKey(ns, suffix))
    },

    async keys(): Promise<string[]> {
      const allKeys = await kv.keys()
      const prefix = `${ns}-`
      return allKeys.filter(k => k.startsWith(prefix))
    },
  }
}

/**
 * Export all content data for a site as a flat record.
 * Returns { 'suffix': value } for each contentKey that has data.
 */
export async function exportSiteContent(site: WorkspaceSite): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {}
  for (const suffix of site.contentKeys) {
    const value = await kv.get(resolveKey(site.storageNamespace, suffix))
    if (value !== null) {
      data[suffix] = value
    }
  }
  return data
}
