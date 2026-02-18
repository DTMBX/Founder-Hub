/**
 * B16-P1 — Tenant Model + Isolation Layer
 *
 * Strict tenant scoping for all ops, tools, billing, and audit.
 * Every data path requires a tenant_id. Cross-tenant access is
 * denied by default.
 *
 * Default tenant: "public-demo" with restricted tier.
 */

import { createHash, randomUUID } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type TenantTier = 'public' | 'pro' | 'internal';
export type TenantStatus = 'active' | 'suspended';

export interface RateLimitProfile {
  /** Max requests per minute */
  requestsPerMinute: number;
  /** Max rows returned per query */
  maxRows: number;
  /** Max export file size in bytes */
  maxExportBytes: number;
  /** Max concurrent sessions */
  maxConcurrentSessions: number;
}

export interface Tenant {
  tenantId: string;
  name: string;
  tier: TenantTier;
  status: TenantStatus;
  createdAt: string;
  allowedTools: string[];
  featureFlags: Record<string, boolean>;
  rateLimitProfile: RateLimitProfile;
}

// ── Defaults ────────────────────────────────────────────────────

const PUBLIC_RATE_LIMITS: RateLimitProfile = {
  requestsPerMinute: 30,
  maxRows: 100,
  maxExportBytes: 5 * 1024 * 1024, // 5 MB
  maxConcurrentSessions: 3,
};

const PRO_RATE_LIMITS: RateLimitProfile = {
  requestsPerMinute: 300,
  maxRows: 10_000,
  maxExportBytes: 100 * 1024 * 1024, // 100 MB
  maxConcurrentSessions: 20,
};

const INTERNAL_RATE_LIMITS: RateLimitProfile = {
  requestsPerMinute: 1000,
  maxRows: 100_000,
  maxExportBytes: 500 * 1024 * 1024, // 500 MB
  maxConcurrentSessions: 100,
};

export function defaultRateLimits(tier: TenantTier): RateLimitProfile {
  switch (tier) {
    case 'public': return { ...PUBLIC_RATE_LIMITS };
    case 'pro': return { ...PRO_RATE_LIMITS };
    case 'internal': return { ...INTERNAL_RATE_LIMITS };
  }
}

export const PUBLIC_DEMO_TENANT: Tenant = {
  tenantId: 'public-demo',
  name: 'Public Demo',
  tier: 'public',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  allowedTools: [],
  featureFlags: {
    billing: false,
    messaging: false,
    fileUpload: false,
    externalApis: false,
  },
  rateLimitProfile: { ...PUBLIC_RATE_LIMITS },
};

// ── Validation ──────────────────────────────────────────────────

export interface TenantValidationResult {
  valid: boolean;
  errors: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TIERS: TenantTier[] = ['public', 'pro', 'internal'];
const VALID_STATUSES: TenantStatus[] = ['active', 'suspended'];
const RESERVED_IDS = ['public-demo'];

export function validateTenant(tenant: Partial<Tenant>): TenantValidationResult {
  const errors: string[] = [];

  if (!tenant.tenantId || tenant.tenantId.trim().length === 0) {
    errors.push('tenantId is required');
  } else if (
    !UUID_REGEX.test(tenant.tenantId) &&
    !RESERVED_IDS.includes(tenant.tenantId)
  ) {
    errors.push('tenantId must be a valid UUID or a reserved identifier');
  }

  if (!tenant.name || tenant.name.trim().length === 0) {
    errors.push('name is required');
  }

  if (!tenant.tier) {
    errors.push('tier is required');
  } else if (!VALID_TIERS.includes(tenant.tier)) {
    errors.push(`tier must be one of: ${VALID_TIERS.join(', ')}`);
  }

  if (!tenant.status) {
    errors.push('status is required');
  } else if (!VALID_STATUSES.includes(tenant.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (!tenant.rateLimitProfile) {
    errors.push('rateLimitProfile is required');
  }

  return { valid: errors.length === 0, errors };
}

// ── Hashing ─────────────────────────────────────────────────────

export function hashTenant(tenant: Tenant): string {
  const payload = JSON.stringify({
    tenantId: tenant.tenantId,
    name: tenant.name,
    tier: tenant.tier,
    status: tenant.status,
    createdAt: tenant.createdAt,
  });
  return createHash('sha256').update(payload).digest('hex');
}

// ── Tenant Registry ─────────────────────────────────────────────

export class TenantRegistry {
  private tenants: Map<string, Tenant> = new Map();

  constructor() {
    // Register the default public-demo tenant
    this.tenants.set(PUBLIC_DEMO_TENANT.tenantId, { ...PUBLIC_DEMO_TENANT });
  }

  /**
   * Register a new tenant. Validates before accepting.
   */
  register(tenant: Tenant): void {
    const result = validateTenant(tenant);
    if (!result.valid) {
      throw new Error(
        `Invalid tenant "${tenant.tenantId ?? 'unknown'}": ${result.errors.join('; ')}`,
      );
    }
    if (this.tenants.has(tenant.tenantId)) {
      throw new Error(`Tenant already registered: ${tenant.tenantId}`);
    }
    this.tenants.set(tenant.tenantId, { ...tenant });
  }

  /**
   * Retrieve a tenant by ID. Returns undefined if not found.
   */
  get(tenantId: string): Tenant | undefined {
    const t = this.tenants.get(tenantId);
    return t ? { ...t } : undefined;
  }

  /**
   * Update tenant status (active/suspended).
   */
  setStatus(tenantId: string, status: TenantStatus): void {
    const t = this.tenants.get(tenantId);
    if (!t) throw new Error(`Tenant not found: ${tenantId}`);
    t.status = status;
  }

  /**
   * List all tenants, optionally filtered.
   */
  list(filter?: { tier?: TenantTier; status?: TenantStatus }): Tenant[] {
    let results = Array.from(this.tenants.values());
    if (filter?.tier) results = results.filter((t) => t.tier === filter.tier);
    if (filter?.status) results = results.filter((t) => t.status === filter.status);
    return results.map((t) => ({ ...t }));
  }

  count(): number {
    return this.tenants.size;
  }

  _reset(): void {
    this.tenants.clear();
    this.tenants.set(PUBLIC_DEMO_TENANT.tenantId, { ...PUBLIC_DEMO_TENANT });
  }
}

// ── Create Helper ───────────────────────────────────────────────

export function createTenant(
  name: string,
  tier: TenantTier,
  allowedTools: string[] = [],
  featureFlags: Record<string, boolean> = {},
): Tenant {
  return {
    tenantId: randomUUID(),
    name,
    tier,
    status: 'active',
    createdAt: new Date().toISOString(),
    allowedTools,
    featureFlags,
    rateLimitProfile: defaultRateLimits(tier),
  };
}
