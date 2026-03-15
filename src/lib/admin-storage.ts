/**
 * Admin Storage Abstraction Layer
 *
 * Wraps admin data persistence behind a pluggable interface.
 * - Default: localStorage (works offline, zero-config)
 * - Optional: Supabase backend (multi-device sync, server-side backup)
 *
 * The public-facing site NEVER depends on admin storage.
 * It always reads from the static PROJECT_REGISTRY and build-time JSON.
 * Admin storage is only used by the /#admin dashboard for runtime settings.
 *
 * To enable Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * in the environment. Without them, localStorage is used automatically.
 */

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface AdminStorageBackend {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  list(): Promise<string[]>
}

// ---------------------------------------------------------------------------
// LocalStorage backend (default)
// ---------------------------------------------------------------------------

const LS_PREFIX = 'founder-hub-admin:'

class LocalStorageBackend implements AdminStorageBackend {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
    } catch {
      // localStorage full — silently skip
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(LS_PREFIX + key)
  }

  async list(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(LS_PREFIX)) {
        keys.push(k.slice(LS_PREFIX.length))
      }
    }
    return keys
  }
}

// ---------------------------------------------------------------------------
// Supabase backend (optional — requires env vars)
// ---------------------------------------------------------------------------

class SupabaseBackend implements AdminStorageBackend {
  private url: string
  private key: string
  private table = 'admin_kv'

  constructor(url: string, key: string) {
    this.url = url
    this.key = key
  }

  private headers(): HeadersInit {
    return {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await fetch(
        `${this.url}/rest/v1/${this.table}?key=eq.${encodeURIComponent(key)}&select=value`,
        { headers: this.headers() },
      )
      if (!res.ok) return null
      const rows = await res.json()
      return rows.length > 0 ? JSON.parse(rows[0].value) : null
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: { ...this.headers(), Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }),
      })
    } catch {
      // Network failure — fallback silently
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await fetch(
        `${this.url}/rest/v1/${this.table}?key=eq.${encodeURIComponent(key)}`,
        { method: 'DELETE', headers: this.headers() },
      )
    } catch {
      // noop
    }
  }

  async list(): Promise<string[]> {
    try {
      const res = await fetch(
        `${this.url}/rest/v1/${this.table}?select=key`,
        { headers: this.headers() },
      )
      if (!res.ok) return []
      const rows = await res.json()
      return rows.map((r: { key: string }) => r.key)
    } catch {
      return []
    }
  }
}

// ---------------------------------------------------------------------------
// Factory — auto-detect Supabase or fall back to localStorage
// ---------------------------------------------------------------------------

function createBackend(): AdminStorageBackend {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (url && key) {
    return new SupabaseBackend(url, key)
  }

  return new LocalStorageBackend()
}

/** Singleton admin storage instance. */
export const adminStorage: AdminStorageBackend = createBackend()

/**
 * Check whether the Supabase backend is configured and reachable.
 * Returns false if using localStorage fallback.
 */
export async function isRemoteStorageAvailable(): Promise<boolean> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return false

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: key },
    })
    return res.ok
  } catch {
    return false
  }
}
