/**
 * B15-P2 — ToolHub Host App
 *
 * Central registry and launcher for all registered tools.
 * Provides:
 *   - Tool discovery (search, filter by category/brand/tag)
 *   - Launch tracking (who launched what, when)
 *   - Health monitoring (optional health endpoints)
 *   - Access control hooks (capability checks)
 *
 * This is the backend service layer; the UI shell is planned
 * separately (B15-P6).
 */

import { createHash } from 'crypto';
import {
  ManifestRegistry,
  type ToolManifest,
  type ToolCategory,
  type ToolStatus,
} from '../tooling/ToolManifest';

// ── Types ───────────────────────────────────────────────────────

export interface LaunchRecord {
  launchId: string;
  toolId: string;
  userId: string;
  launchedAt: string;
  sessionHash: string;
}

export interface ToolHealthStatus {
  toolId: string;
  healthy: boolean;
  checkedAt: string;
  detail?: string;
}

export interface SearchResult {
  tools: ToolManifest[];
  totalCount: number;
  query: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// ── ToolHub Service ─────────────────────────────────────────────

export class ToolHub {
  private registry: ManifestRegistry;
  private launches: LaunchRecord[] = [];
  private healthCache: Map<string, ToolHealthStatus> = new Map();

  constructor(registry?: ManifestRegistry) {
    this.registry = registry ?? new ManifestRegistry();
  }

  /**
   * Get the underlying registry for direct registration.
   */
  getRegistry(): ManifestRegistry {
    return this.registry;
  }

  /**
   * Search tools by text query across name, description, and tags.
   */
  search(query: string): SearchResult {
    const q = query.toLowerCase().trim();
    if (!q) {
      const all = this.registry.list();
      return { tools: all, totalCount: all.length, query };
    }

    const all = this.registry.list();
    const matches = all.filter((m) => {
      const haystack = [
        m.name,
        m.description,
        m.id,
        ...(m.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return { tools: matches, totalCount: matches.length, query };
  }

  /**
   * Discover tools by structured filters.
   */
  discover(filter?: {
    category?: ToolCategory;
    brand?: string;
    status?: ToolStatus;
    tag?: string;
  }): ToolManifest[] {
    return this.registry.list(filter);
  }

  /**
   * Launch a tool — records an audit trail entry.
   */
  launch(toolId: string, userId: string): LaunchRecord {
    const manifest = this.registry.get(toolId);
    if (!manifest) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    if (manifest.status === 'archived') {
      throw new Error(`Cannot launch archived tool: ${toolId}`);
    }

    const launchId = generateId('LCH');
    const now = new Date().toISOString();
    const sessionHash = sha256(
      JSON.stringify({ launchId, toolId, userId, launchedAt: now }),
    );

    const record: LaunchRecord = {
      launchId,
      toolId,
      userId,
      launchedAt: now,
      sessionHash,
    };

    this.launches.push(record);
    return record;
  }

  /**
   * Check if a user has the required capabilities for a tool.
   */
  checkAccess(toolId: string, userCapabilities: string[]): {
    allowed: boolean;
    missing: string[];
  } {
    const manifest = this.registry.get(toolId);
    if (!manifest) {
      return { allowed: false, missing: ['tool_not_found'] };
    }

    const required = manifest.capabilities ?? [];
    const missing = required.filter((c) => !userCapabilities.includes(c));
    return { allowed: missing.length === 0, missing };
  }

  /**
   * Record a health check result for a tool.
   */
  recordHealth(toolId: string, healthy: boolean, detail?: string): void {
    this.healthCache.set(toolId, {
      toolId,
      healthy,
      checkedAt: new Date().toISOString(),
      detail,
    });
  }

  /**
   * Get the latest health status for a tool.
   */
  getHealth(toolId: string): ToolHealthStatus | undefined {
    return this.healthCache.get(toolId);
  }

  /**
   * Get launch history, optionally filtered.
   */
  getLaunches(filter?: { toolId?: string; userId?: string }): LaunchRecord[] {
    let results = [...this.launches];
    if (filter?.toolId) results = results.filter((r) => r.toolId === filter.toolId);
    if (filter?.userId) results = results.filter((r) => r.userId === filter.userId);
    return results;
  }

  _reset(): void {
    this.registry._reset();
    this.launches = [];
    this.healthCache.clear();
  }
}
