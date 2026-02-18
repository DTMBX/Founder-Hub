/**
 * B16 — Multi-Tenant Isolation + Production Hardening Tests
 *
 * Covers:
 *   P1: Tenant model, validation, registry, context middleware
 *   P2: Public demo mode hardening (DemoGuard)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTenant,
  hashTenant,
  TenantRegistry,
  createTenant,
  defaultRateLimits,
  PUBLIC_DEMO_TENANT,
  type Tenant,
} from '../../ops/tenancy/TenantModel';
import {
  TenantContextMiddleware,
} from '../../ops/tenancy/TenantContextMiddleware';

// ═════════════════════════════════════════════════════════════════
// P1 — Tenant Model + Isolation
// ═════════════════════════════════════════════════════════════════

// ── validateTenant ──────────────────────────────────────────────

describe('P1 — validateTenant', () => {
  const validTenant: Tenant = {
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Tenant',
    tier: 'pro',
    status: 'active',
    createdAt: new Date().toISOString(),
    allowedTools: [],
    featureFlags: {},
    rateLimitProfile: defaultRateLimits('pro'),
  };

  it('accepts a valid tenant', () => {
    expect(validateTenant(validTenant).valid).toBe(true);
  });

  it('accepts the public-demo reserved ID', () => {
    expect(validateTenant(PUBLIC_DEMO_TENANT).valid).toBe(true);
  });

  it('rejects missing tenantId', () => {
    const result = validateTenant({ ...validTenant, tenantId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tenantId is required');
  });

  it('rejects invalid UUID format', () => {
    const result = validateTenant({ ...validTenant, tenantId: 'not-a-uuid' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing name', () => {
    const result = validateTenant({ ...validTenant, name: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid tier', () => {
    const result = validateTenant({ ...validTenant, tier: 'gold' as any });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = validateTenant({ ...validTenant, status: 'deleted' as any });
    expect(result.valid).toBe(false);
  });

  it('rejects missing rateLimitProfile', () => {
    const { rateLimitProfile, ...rest } = validTenant;
    const result = validateTenant(rest);
    expect(result.valid).toBe(false);
  });
});

// ── hashTenant ──────────────────────────────────────────────────

describe('P1 — hashTenant', () => {
  it('produces a 64-char hex hash', () => {
    const tenant = createTenant('Test', 'pro');
    const hash = hashTenant(tenant);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for same input', () => {
    const tenant: Tenant = { ...PUBLIC_DEMO_TENANT };
    expect(hashTenant(tenant)).toBe(hashTenant(tenant));
  });

  it('differs for different tenants', () => {
    const a = createTenant('A', 'pro');
    const b = createTenant('B', 'pro');
    expect(hashTenant(a)).not.toBe(hashTenant(b));
  });
});

// ── TenantRegistry ──────────────────────────────────────────────

describe('P1 — TenantRegistry', () => {
  let registry: TenantRegistry;

  beforeEach(() => {
    registry = new TenantRegistry();
  });

  it('starts with public-demo tenant', () => {
    expect(registry.get('public-demo')).toBeDefined();
    expect(registry.count()).toBe(1);
  });

  it('registers a new tenant', () => {
    const tenant = createTenant('Acme', 'pro');
    registry.register(tenant);
    expect(registry.get(tenant.tenantId)).toBeDefined();
    expect(registry.count()).toBe(2);
  });

  it('rejects duplicate registration', () => {
    const tenant = createTenant('Acme', 'pro');
    registry.register(tenant);
    expect(() => registry.register(tenant)).toThrow('already registered');
  });

  it('rejects invalid tenant', () => {
    expect(() =>
      registry.register({
        tenantId: 'bad',
        name: '',
        tier: 'pro',
        status: 'active',
        createdAt: '',
        allowedTools: [],
        featureFlags: {},
        rateLimitProfile: defaultRateLimits('pro'),
      }),
    ).toThrow('Invalid tenant');
  });

  it('suspends a tenant', () => {
    const tenant = createTenant('Acme', 'pro');
    registry.register(tenant);
    registry.setStatus(tenant.tenantId, 'suspended');
    expect(registry.get(tenant.tenantId)!.status).toBe('suspended');
  });

  it('filters by tier', () => {
    const pub = createTenant('Pub', 'public');
    const pro = createTenant('Pro', 'pro');
    registry.register(pub);
    registry.register(pro);
    const publics = registry.list({ tier: 'public' });
    // public-demo + pub
    expect(publics.length).toBe(2);
  });

  it('filters by status', () => {
    const tenant = createTenant('Acme', 'pro');
    registry.register(tenant);
    registry.setStatus(tenant.tenantId, 'suspended');
    const suspended = registry.list({ status: 'suspended' });
    expect(suspended.length).toBe(1);
  });

  it('resets to default state', () => {
    registry.register(createTenant('X', 'pro'));
    registry._reset();
    expect(registry.count()).toBe(1);
    expect(registry.get('public-demo')).toBeDefined();
  });
});

// ── createTenant ────────────────────────────────────────────────

describe('P1 — createTenant', () => {
  it('creates a tenant with UUID', () => {
    const t = createTenant('Test', 'pro');
    expect(t.tenantId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('sets tier-appropriate rate limits', () => {
    const pub = createTenant('Pub', 'public');
    expect(pub.rateLimitProfile.requestsPerMinute).toBe(30);

    const pro = createTenant('Pro', 'pro');
    expect(pro.rateLimitProfile.requestsPerMinute).toBe(300);
  });

  it('starts as active', () => {
    expect(createTenant('T', 'internal').status).toBe('active');
  });
});

// ── TenantContextMiddleware ─────────────────────────────────────

describe('P1 — TenantContextMiddleware', () => {
  let registry: TenantRegistry;
  let mw: TenantContextMiddleware;

  beforeEach(() => {
    registry = new TenantRegistry();
    mw = new TenantContextMiddleware(registry);
  });

  it('resolves public-demo tenant', () => {
    const result = mw.resolve('public-demo');
    expect(result.allowed).toBe(true);
    expect(result.context?.tenantId).toBe('public-demo');
    expect(result.context?.tier).toBe('public');
  });

  it('denies empty tenant_id', () => {
    const result = mw.resolve('');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('required');
  });

  it('denies unknown tenant', () => {
    const result = mw.resolve('nonexistent');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not found');
  });

  it('denies suspended tenant', () => {
    const tenant = createTenant('Susp', 'pro');
    registry.register(tenant);
    registry.setStatus(tenant.tenantId, 'suspended');
    const result = mw.resolve(tenant.tenantId);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('suspended');
  });

  it('blocks cross-tenant access', () => {
    expect(() => mw.assertSameTenant('tenant-a', 'tenant-b')).toThrow(
      'Cross-tenant access denied',
    );
  });

  it('allows same-tenant access', () => {
    expect(() => mw.assertSameTenant('tenant-a', 'tenant-a')).not.toThrow();
  });

  it('checks feature flags', () => {
    const result = mw.resolve('public-demo');
    const ctx = result.context!;
    expect(mw.isFeatureEnabled(ctx, 'billing')).toBe(false);
    expect(mw.isFeatureEnabled(ctx, 'nonexistent')).toBe(false);
  });

  it('checks tool access (empty = all allowed)', () => {
    const result = mw.resolve('public-demo');
    expect(mw.isToolAllowed(result.context!, 'any-tool')).toBe(true);
  });

  it('restricts tool access when list is populated', () => {
    const tenant = createTenant('Restricted', 'pro', ['tool-a']);
    registry.register(tenant);
    const result = mw.resolve(tenant.tenantId);
    expect(mw.isToolAllowed(result.context!, 'tool-a')).toBe(true);
    expect(mw.isToolAllowed(result.context!, 'tool-b')).toBe(false);
  });

  it('logs audit events', () => {
    mw.resolve('public-demo');
    const log = mw.getAuditLog();
    expect(log.length).toBeGreaterThan(0);
    expect(log[0].tenantId).toBe('public-demo');
    expect(log[0].action).toBe('context_resolved');
  });

  it('logs cross-tenant denial in audit', () => {
    try { mw.assertSameTenant('a', 'b'); } catch { /* expected */ }
    const log = mw.getAuditLog();
    expect(log.some((e) => e.action === 'cross_tenant_blocked')).toBe(true);
  });

  it('enforces rate limits', () => {
    // public-demo has 30 req/min
    for (let i = 0; i < 30; i++) {
      expect(mw.resolve('public-demo').allowed).toBe(true);
    }
    // 31st should be denied
    const result = mw.resolve('public-demo');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit');
  });

  it('audit log includes tenant_id on all entries', () => {
    mw.resolve('public-demo');
    const log = mw.getAuditLog();
    for (const entry of log) {
      expect(entry.tenantId).toBeDefined();
      expect(entry.tenantId.length).toBeGreaterThan(0);
    }
  });
});

// ═════════════════════════════════════════════════════════════════
// P2 — Public Demo Mode Hardening
// ═════════════════════════════════════════════════════════════════

import {
  DemoGuard,
  PUBLIC_DEMO_CONFIG,
} from '../../ops/demo/DemoGuard';

describe('P2 — DemoGuard row limits', () => {
  let guard: DemoGuard;

  beforeEach(() => {
    guard = new DemoGuard();
  });

  it('allows rows within limit', () => {
    expect(guard.checkRowLimit(50, 'public-demo').allowed).toBe(true);
  });

  it('rejects rows exceeding limit', () => {
    const result = guard.checkRowLimit(200, 'public-demo');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Row limit');
  });

  it('allows exact limit', () => {
    expect(guard.checkRowLimit(100, 'public-demo').allowed).toBe(true);
  });
});

describe('P2 — DemoGuard export limits', () => {
  let guard: DemoGuard;

  beforeEach(() => {
    guard = new DemoGuard();
  });

  it('allows exports within limit', () => {
    expect(guard.checkExportSize(1024, 'public-demo').allowed).toBe(true);
  });

  it('rejects large exports', () => {
    const result = guard.checkExportSize(10 * 1024 * 1024, 'public-demo');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Export size');
  });
});

describe('P2 — DemoGuard feature blocks', () => {
  let guard: DemoGuard;

  beforeEach(() => {
    guard = new DemoGuard();
  });

  it('blocks file upload', () => {
    expect(guard.checkFileUpload('public-demo').allowed).toBe(false);
  });

  it('blocks external APIs', () => {
    expect(guard.checkExternalApi('public-demo').allowed).toBe(false);
  });

  it('blocks billing', () => {
    expect(guard.checkBilling('public-demo').allowed).toBe(false);
  });

  it('blocks messaging', () => {
    expect(guard.checkMessaging('public-demo').allowed).toBe(false);
  });
});

describe('P2 — DemoGuard IP rate limiting', () => {
  it('allows requests within IP limit', () => {
    const guard = new DemoGuard();
    expect(guard.checkIpRate('1.2.3.4', 5, 'public-demo').allowed).toBe(true);
  });

  it('blocks IP after exceeding limit', () => {
    const guard = new DemoGuard();
    for (let i = 0; i < 5; i++) {
      guard.checkIpRate('1.2.3.4', 5, 'public-demo');
    }
    const result = guard.checkIpRate('1.2.3.4', 5, 'public-demo');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('rate limit');
  });
});

describe('P2 — DemoGuard preview truncation', () => {
  it('returns short text unchanged', () => {
    const guard = new DemoGuard();
    expect(guard.truncatePreview('short')).toBe('short');
  });

  it('truncates long text with marker', () => {
    const guard = new DemoGuard();
    const long = 'x'.repeat(20_000);
    const result = guard.truncatePreview(long);
    expect(result.length).toBeLessThan(long.length);
    expect(result).toContain('[truncated]');
  });
});

describe('P2 — DemoGuard disabled mode', () => {
  it('allows everything when disabled', () => {
    const guard = new DemoGuard(PUBLIC_DEMO_CONFIG, false);
    expect(guard.checkRowLimit(999999, 'x').allowed).toBe(true);
    expect(guard.checkFileUpload('x').allowed).toBe(true);
    expect(guard.checkBilling('x').allowed).toBe(true);
    expect(guard.checkMessaging('x').allowed).toBe(true);
  });
});

describe('P2 — DemoGuard audit', () => {
  it('logs rejection events', () => {
    const guard = new DemoGuard();
    guard.checkRowLimit(999, 'public-demo');
    const log = guard.getAuditLog();
    expect(log.length).toBe(1);
    expect(log[0].action).toBe('row_limit_exceeded');
    expect(log[0].tenantId).toBe('public-demo');
  });
});

// ═════════════════════════════════════════════════════════════════
// P3 — Tenant-Scoped API Keys + RBAC Hardening
// ═════════════════════════════════════════════════════════════════

import { ApiKeyManager } from '../../ops/auth/ApiKeyManager';

describe('P3 — ApiKeyManager create + validate', () => {
  let mgr: ApiKeyManager;

  beforeEach(() => {
    mgr = new ApiKeyManager();
  });

  it('creates a key with evk_ prefix', () => {
    const result = mgr.create('tenant-1', 'read_only');
    expect(result.plainKey).toMatch(/^evk_[a-f0-9]{64}$/);
    expect(result.keyId).toMatch(/^key-/);
    expect(result.scope).toBe('read_only');
  });

  it('validates a created key', () => {
    const { plainKey } = mgr.create('tenant-1', 'export');
    const result = mgr.validate(plainKey);
    expect(result.valid).toBe(true);
    expect(result.tenantId).toBe('tenant-1');
    expect(result.scope).toBe('export');
  });

  it('rejects unknown key', () => {
    const result = mgr.validate('evk_unknown');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown');
  });

  it('rejects empty key', () => {
    expect(mgr.validate('').valid).toBe(false);
  });

  it('throws on invalid scope', () => {
    expect(() => mgr.create('t', 'superadmin' as any)).toThrow('Invalid scope');
  });

  it('throws on empty tenantId', () => {
    expect(() => mgr.create('', 'read_only')).toThrow('tenantId');
  });
});

describe('P3 — ApiKeyManager revocation', () => {
  let mgr: ApiKeyManager;

  beforeEach(() => {
    mgr = new ApiKeyManager();
  });

  it('revokes a key', () => {
    const { keyId, plainKey } = mgr.create('t', 'read_only');
    mgr.revoke(keyId);
    const result = mgr.validate(plainKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('revoked');
  });

  it('throws revoking unknown key', () => {
    expect(() => mgr.revoke('nonexistent')).toThrow('not found');
  });

  it('throws revoking already-revoked key', () => {
    const { keyId } = mgr.create('t', 'admin');
    mgr.revoke(keyId);
    expect(() => mgr.revoke(keyId)).toThrow('already revoked');
  });
});

describe('P3 — ApiKeyManager scope checks', () => {
  let mgr: ApiKeyManager;

  beforeEach(() => {
    mgr = new ApiKeyManager();
  });

  it('admin includes all scopes', () => {
    expect(mgr.checkScope('admin', 'read_only')).toBe(true);
    expect(mgr.checkScope('admin', 'export')).toBe(true);
    expect(mgr.checkScope('admin', 'admin')).toBe(true);
  });

  it('read_only cannot export', () => {
    expect(mgr.checkScope('read_only', 'export')).toBe(false);
  });

  it('export cannot admin', () => {
    expect(mgr.checkScope('export', 'admin')).toBe(false);
  });
});

describe('P3 — ApiKeyManager tenant isolation', () => {
  it('key is bound to its tenant', () => {
    const mgr = new ApiKeyManager();
    const { plainKey } = mgr.create('tenant-a', 'read_only');
    const result = mgr.validate(plainKey);
    expect(result.tenantId).toBe('tenant-a');
    // Not tenant-b
    expect(result.tenantId).not.toBe('tenant-b');
  });

  it('lists keys only for the specified tenant', () => {
    const mgr = new ApiKeyManager();
    mgr.create('tenant-a', 'read_only');
    mgr.create('tenant-b', 'export');
    mgr.create('tenant-a', 'admin');
    const aKeys = mgr.listForTenant('tenant-a');
    expect(aKeys.length).toBe(2);
    for (const k of aKeys) {
      expect(k.tenantId).toBe('tenant-a');
    }
  });
});

describe('P3 — ApiKeyManager audit', () => {
  it('logs key creation', () => {
    const mgr = new ApiKeyManager();
    mgr.create('t', 'read_only');
    const log = mgr.getAuditLog();
    expect(log.some((e) => e.action === 'key_created')).toBe(true);
  });

  it('logs key revocation', () => {
    const mgr = new ApiKeyManager();
    const { keyId } = mgr.create('t', 'admin');
    mgr.revoke(keyId);
    const log = mgr.getAuditLog();
    expect(log.some((e) => e.action === 'key_revoked')).toBe(true);
  });

  it('logs revoked key usage attempt', () => {
    const mgr = new ApiKeyManager();
    const { keyId, plainKey } = mgr.create('t', 'admin');
    mgr.revoke(keyId);
    mgr.validate(plainKey);
    const log = mgr.getAuditLog();
    expect(log.some((e) => e.action === 'revoked_key_attempt')).toBe(true);
  });
});
