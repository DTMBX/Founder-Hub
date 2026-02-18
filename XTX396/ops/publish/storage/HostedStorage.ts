/**
 * ops/publish/storage/HostedStorage.ts
 *
 * Key-value storage adapter for hosted sites.
 * Namespace: hosted_sites/{tenantId}/{siteId}/{version}/...
 * Active pointer: hosted_sites/{tenantId}/{siteId}/active -> version
 *
 * Immutable versions — no overwriting once stored.
 */

/** A stored artifact in hosted storage. */
export interface HostedArtifact {
  readonly key: string
  readonly content: string
  readonly sha256: string
  readonly size: number
  readonly storedAt: string
}

/** Active pointer record. */
export interface ActivePointer {
  readonly tenantId: string
  readonly siteId: string
  readonly version: string
  readonly activatedAt: string
  readonly activatedBy: string
}

/** Hosted storage interface (pluggable for production adapters). */
export interface HostedStorageAdapter {
  /** Store an artifact. Throws if key already exists (immutable). */
  put(key: string, artifact: HostedArtifact): Promise<void>

  /** Retrieve an artifact by key. */
  get(key: string): Promise<HostedArtifact | null>

  /** Check if a key exists. */
  exists(key: string): Promise<boolean>

  /** List keys under a prefix. */
  list(prefix: string): Promise<readonly string[]>

  /** Set the active pointer for a site. */
  setActive(pointer: ActivePointer): Promise<void>

  /** Get the active pointer for a site. */
  getActive(tenantId: string, siteId: string): Promise<ActivePointer | null>
}

/** In-memory storage for testing and demo mode. */
export class InMemoryHostedStorage implements HostedStorageAdapter {
  private readonly _store: Map<string, HostedArtifact> = new Map()
  private readonly _pointers: Map<string, ActivePointer> = new Map()

  async put(key: string, artifact: HostedArtifact): Promise<void> {
    if (this._store.has(key)) {
      throw new Error(`Immutable storage: key '${key}' already exists`)
    }
    this._store.set(key, artifact)
  }

  async get(key: string): Promise<HostedArtifact | null> {
    return this._store.get(key) ?? null
  }

  async exists(key: string): Promise<boolean> {
    return this._store.has(key)
  }

  async list(prefix: string): Promise<readonly string[]> {
    const keys: string[] = []
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key)
      }
    }
    return keys.sort()
  }

  async setActive(pointer: ActivePointer): Promise<void> {
    const pkey = `${pointer.tenantId}/${pointer.siteId}`
    this._pointers.set(pkey, pointer)
  }

  async getActive(tenantId: string, siteId: string): Promise<ActivePointer | null> {
    return this._pointers.get(`${tenantId}/${siteId}`) ?? null
  }

  /** Test helper: total stored artifacts. */
  get size(): number {
    return this._store.size
  }
}

/** Generate the storage key for an artifact in a versioned site. */
export function hostedKey(tenantId: string, siteId: string, version: string, path: string): string {
  return `hosted_sites/${tenantId}/${siteId}/${version}/${path}`
}

/** Generate a hosted URL for a published site. */
export function hostedUrl(siteSlug: string): string {
  return `/sites/${siteSlug}/`
}
