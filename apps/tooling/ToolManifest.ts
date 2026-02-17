/**
 * B15-P1 — ToolManifest Schema & Validation
 *
 * Defines the ToolManifest schema that every registerable tool/app must
 * provide. Includes a deterministic validator and a manifest loader.
 *
 * Manifests are self-describing, hashable, and brand-aware.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type ToolCategory =
  | 'app'
  | 'algorithm'
  | 'service'
  | 'chat-tool'
  | 'dev-tool'
  | 'template'
  | 'api-client';

export type ToolStatus = 'active' | 'deprecated' | 'experimental' | 'archived';

export interface ToolManifest {
  /** Unique tool identifier (e.g., "civics-hierarchy") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description (max 200 chars) */
  description: string;
  /** Semantic version */
  version: string;
  /** Tool category */
  category: ToolCategory;
  /** Current status */
  status: ToolStatus;
  /** Brand this tool belongs to */
  brand: string;
  /** Entry point (relative path or URL) */
  entryPoint: string;
  /** Required capabilities / permissions */
  capabilities?: string[];
  /** Tags for discovery */
  tags?: string[];
  /** Author or team */
  author?: string;
  /** License identifier */
  license?: string;
  /** Minimum platform version required */
  minPlatformVersion?: string;
}

// ── Validation ──────────────────────────────────────────────────

const VALID_CATEGORIES: ToolCategory[] = [
  'app',
  'algorithm',
  'service',
  'chat-tool',
  'dev-tool',
  'template',
  'api-client',
];

const VALID_STATUSES: ToolStatus[] = ['active', 'deprecated', 'experimental', 'archived'];

const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateManifest(manifest: Partial<ToolManifest>): ValidationResult {
  const errors: string[] = [];

  if (!manifest.id || manifest.id.trim().length === 0) {
    errors.push('id is required');
  } else if (!/^[a-z0-9-]+$/.test(manifest.id)) {
    errors.push('id must be lowercase alphanumeric with hyphens only');
  }

  if (!manifest.name || manifest.name.trim().length === 0) {
    errors.push('name is required');
  }

  if (!manifest.description || manifest.description.trim().length === 0) {
    errors.push('description is required');
  } else if (manifest.description.length > 200) {
    errors.push('description must be 200 characters or fewer');
  }

  if (!manifest.version) {
    errors.push('version is required');
  } else if (!SEMVER_REGEX.test(manifest.version)) {
    errors.push('version must be valid semver (e.g., 1.0.0)');
  }

  if (!manifest.category) {
    errors.push('category is required');
  } else if (!VALID_CATEGORIES.includes(manifest.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!manifest.status) {
    errors.push('status is required');
  } else if (!VALID_STATUSES.includes(manifest.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (!manifest.brand || manifest.brand.trim().length === 0) {
    errors.push('brand is required');
  }

  if (!manifest.entryPoint || manifest.entryPoint.trim().length === 0) {
    errors.push('entryPoint is required');
  }

  return { valid: errors.length === 0, errors };
}

// ── Hashing ─────────────────────────────────────────────────────

export function hashManifest(manifest: ToolManifest): string {
  const payload = JSON.stringify({
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    category: manifest.category,
    brand: manifest.brand,
    entryPoint: manifest.entryPoint,
  });
  return createHash('sha256').update(payload).digest('hex');
}

// ── Manifest Registry ───────────────────────────────────────────

export class ManifestRegistry {
  private manifests: Map<string, ToolManifest> = new Map();

  /**
   * Register a tool manifest. Validates before accepting.
   */
  register(manifest: ToolManifest): void {
    const result = validateManifest(manifest);
    if (!result.valid) {
      throw new Error(`Invalid manifest for "${manifest.id ?? 'unknown'}": ${result.errors.join('; ')}`);
    }
    if (this.manifests.has(manifest.id)) {
      throw new Error(`Manifest already registered: ${manifest.id}`);
    }
    this.manifests.set(manifest.id, { ...manifest });
  }

  /**
   * Get a registered manifest by ID.
   */
  get(id: string): ToolManifest | undefined {
    const m = this.manifests.get(id);
    return m ? { ...m } : undefined;
  }

  /**
   * List manifests with optional filters.
   */
  list(filter?: {
    category?: ToolCategory;
    brand?: string;
    status?: ToolStatus;
    tag?: string;
  }): ToolManifest[] {
    let results = Array.from(this.manifests.values());
    if (filter?.category) results = results.filter((m) => m.category === filter.category);
    if (filter?.brand) results = results.filter((m) => m.brand === filter.brand);
    if (filter?.status) results = results.filter((m) => m.status === filter.status);
    if (filter?.tag) results = results.filter((m) => m.tags?.includes(filter.tag!) ?? false);
    return results.map((m) => ({ ...m }));
  }

  /**
   * Unregister a tool (for test teardown).
   */
  unregister(id: string): boolean {
    return this.manifests.delete(id);
  }

  /**
   * Get count of registered manifests.
   */
  count(): number {
    return this.manifests.size;
  }

  _reset(): void {
    this.manifests.clear();
  }
}
