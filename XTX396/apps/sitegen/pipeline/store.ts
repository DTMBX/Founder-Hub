/**
 * Pipeline Step: Store
 *
 * Persists the generated site to storage.
 * Uses a pluggable StorageAdapter to avoid coupling to any specific backend.
 * Default adapter is an in-memory store (for testing and demo).
 */

import type { HashResult, ScaffoldMetadata, StoredSite } from './types'

// ─── Storage Adapter Interface ───────────────────────────────

export interface StorageAdapter {
  save(record: StoredSite): Promise<void>
  get(siteId: string): Promise<StoredSite | null>
  list(): Promise<readonly StoredSite[]>
}

// ─── In-Memory Adapter (Default) ─────────────────────────────

/**
 * In-memory storage adapter for testing and demo purposes.
 * Not suitable for production use.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly _store = new Map<string, StoredSite>()

  async save(record: StoredSite): Promise<void> {
    this._store.set(record.siteId, record)
  }

  async get(siteId: string): Promise<StoredSite | null> {
    return this._store.get(siteId) ?? null
  }

  async list(): Promise<readonly StoredSite[]> {
    return [...this._store.values()]
  }

  /** Test helper: clear the store. */
  clear(): void {
    this._store.clear()
  }

  /** Test helper: get count. */
  get size(): number {
    return this._store.size
  }
}

// ─── Store Step ──────────────────────────────────────────────

/**
 * Generates a unique site ID and persists the generated site record.
 */
export async function store(
  siteId: string,
  metadata: ScaffoldMetadata,
  hashResult: HashResult,
  operatorId: string,
  adapter: StorageAdapter,
): Promise<StoredSite> {
  const record: StoredSite = {
    siteId,
    blueprintId: metadata.blueprintId,
    operatorId,
    generatedAt: metadata.generatedAt,
    storedAt: new Date().toISOString(),
    manifest: hashResult,
    metadata,
    status: 'stored',
  }

  await adapter.save(record)
  return record
}

// ─── Site ID Generator ───────────────────────────────────────

/**
 * Generates a deterministic site ID from blueprint + operator + timestamp.
 * Format: site_{blueprint}_{timestamp}_{random4}
 */
export function generateSiteId(
  blueprintId: string,
  operatorId: string,
  timestamp: string,
): string {
  // Use a simple hash-like approach for determinism in testing
  const base = `${blueprintId}:${operatorId}:${timestamp}`
  let hash = 0
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  const suffix = Math.abs(hash).toString(36).slice(0, 6).padStart(6, '0')
  return `site_${blueprintId}_${suffix}`
}
