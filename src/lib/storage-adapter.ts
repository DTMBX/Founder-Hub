/**
 * Storage Adapter Layer
 *
 * Provides a unified interface for data persistence across environments:
 * - KVAdapter: localStorage + static JSON fallback (demo / localhost)
 * - MemoryAdapter: in-memory store (tests, ephemeral sessions)
 * - SupabaseAdapter: Postgres via Supabase (production — Phase 6 wiring)
 *
 * All adapters operate on parsed JSON values (generic T).
 * Serialization is handled internally by each adapter.
 */

import { kv } from '@/lib/local-storage-kv'

// ─── Interface ───────────────────────────────────────────────

export interface StorageAdapter {
  /** Retrieve a value by key. Returns null if not found. */
  get<T = unknown>(key: string): Promise<T | null>

  /** Write a value by key. Creates or overwrites. */
  set<T = unknown>(key: string, value: T): Promise<void>

  /** Delete a value by key. No-op if key does not exist. */
  del(key: string): Promise<void>

  /** List all keys matching the given prefix. */
  list(prefix: string): Promise<string[]>
}

// ─── KVAdapter (Demo / Localhost) ────────────────────────────

/**
 * Wraps the existing hybrid KV system (localStorage + static JSON fallback).
 * Suitable for demo mode and local development.
 */
export class KVAdapter implements StorageAdapter {
  async get<T = unknown>(key: string): Promise<T | null> {
    return kv.get<T>(key)
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    await kv.set(key, value)
  }

  async del(key: string): Promise<void> {
    await kv.delete(key)
  }

  async list(prefix: string): Promise<string[]> {
    const allKeys = await kv.keys()
    return allKeys.filter((k) => k.startsWith(prefix))
  }
}

// ─── MemoryAdapter (Tests / Ephemeral) ───────────────────────

/**
 * In-memory storage adapter for unit tests and ephemeral sessions.
 * No external dependencies. Deterministic and fast.
 */
export class MemoryAdapter implements StorageAdapter {
  private store = new Map<string, string>()

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = this.store.get(key)
    if (raw === undefined) return null
    return JSON.parse(raw) as T
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async list(prefix: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter((k) => k.startsWith(prefix))
  }

  /** Reset all data. Useful between test cases. */
  clear(): void {
    this.store.clear()
  }

  /** Snapshot of all stored keys (debugging). */
  keys(): string[] {
    return Array.from(this.store.keys())
  }
}

// ─── SupabaseAdapter (Production Stub — Phase 6) ─────────────

/**
 * Compile-safe stub for Supabase-backed persistence.
 * All methods throw until Phase 6 wiring is complete.
 *
 * When wired:
 * - get/set/del map to a `kv_store` table (key TEXT PK, value JSONB)
 * - list uses a prefix query: WHERE key LIKE 'prefix%'
 * - RLS policies enforce tenant isolation via auth.uid()
 */
export class SupabaseAdapter implements StorageAdapter {
  async get<T = unknown>(_key: string): Promise<T | null> {
    throw new Error('[SupabaseAdapter] Not wired. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
  }

  async set<T = unknown>(_key: string, _value: T): Promise<void> {
    throw new Error('[SupabaseAdapter] Not wired. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
  }

  async del(_key: string): Promise<void> {
    throw new Error('[SupabaseAdapter] Not wired. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
  }

  async list(_prefix: string): Promise<string[]> {
    throw new Error('[SupabaseAdapter] Not wired. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
  }
}

// ─── Factory ─────────────────────────────────────────────────

/**
 * Create the appropriate storage adapter based on environment.
 * Currently always returns KVAdapter (demo mode).
 * Phase 6 will check for Supabase env vars.
 */
export function createStorageAdapter(): StorageAdapter {
  // Phase 6: check for SUPABASE_URL env var and return SupabaseAdapter
  // const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  // if (supabaseUrl) return new SupabaseAdapter()
  return new KVAdapter()
}
