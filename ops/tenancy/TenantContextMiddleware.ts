/**
 * B16-P1 — Tenant Context Middleware
 *
 * Provides tenant-scoped request context. All operations must
 * flow through this middleware to guarantee tenant isolation.
 *
 * Design: fail-closed. If no tenant context is set, all
 * operations are denied.
 */

import type { Tenant, TenantTier } from './TenantModel';
import { TenantRegistry } from './TenantModel';

// ── Types ───────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  tier: TenantTier;
  featureFlags: Record<string, boolean>;
  allowedTools: string[];
  requestsRemaining: number;
}

export interface TenantContextResult {
  allowed: boolean;
  context?: TenantContext;
  reason?: string;
}

export interface AuditableTenantEvent {
  tenantId: string;
  action: string;
  timestamp: string;
  detail: string;
}

// ── Middleware ───────────────────────────────────────────────────

export class TenantContextMiddleware {
  private registry: TenantRegistry;
  private requestCounts: Map<string, { count: number; windowStart: number }> = new Map();
  private auditLog: AuditableTenantEvent[] = [];

  constructor(registry: TenantRegistry) {
    this.registry = registry;
  }

  /**
   * Resolve tenant context for a request. Fail-closed: if the
   * tenant is not found or suspended, access is denied.
   */
  resolve(tenantId: string): TenantContextResult {
    if (!tenantId || tenantId.trim().length === 0) {
      return { allowed: false, reason: 'tenant_id is required' };
    }

    const tenant = this.registry.get(tenantId);
    if (!tenant) {
      return { allowed: false, reason: `Tenant not found: ${tenantId}` };
    }

    if (tenant.status === 'suspended') {
      this.logEvent(tenantId, 'access_denied', 'Tenant is suspended');
      return { allowed: false, reason: 'Tenant is suspended' };
    }

    // Rate limiting check
    const rateResult = this.checkRateLimit(tenant);
    if (!rateResult.allowed) {
      this.logEvent(tenantId, 'rate_limited', 'Rate limit exceeded');
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    this.logEvent(tenantId, 'context_resolved', 'Tenant context resolved');

    return {
      allowed: true,
      context: {
        tenantId: tenant.tenantId,
        tier: tenant.tier,
        featureFlags: { ...tenant.featureFlags },
        allowedTools: [...tenant.allowedTools],
        requestsRemaining: rateResult.remaining,
      },
    };
  }

  /**
   * Check whether a tenant-scoped operation targets the correct tenant.
   * Prevents cross-tenant data access.
   */
  assertSameTenant(contextTenantId: string, dataTenantId: string): void {
    if (contextTenantId !== dataTenantId) {
      this.logEvent(
        contextTenantId,
        'cross_tenant_blocked',
        `Attempted access to tenant ${dataTenantId}`,
      );
      throw new Error(
        `Cross-tenant access denied: context=${contextTenantId}, target=${dataTenantId}`,
      );
    }
  }

  /**
   * Check if a feature flag is enabled for the resolved context.
   */
  isFeatureEnabled(context: TenantContext, flag: string): boolean {
    return context.featureFlags[flag] === true;
  }

  /**
   * Check if a tool is allowed for the tenant. If allowedTools is
   * empty, all tools are permitted (for backwards compatibility).
   */
  isToolAllowed(context: TenantContext, toolId: string): boolean {
    if (context.allowedTools.length === 0) return true;
    return context.allowedTools.includes(toolId);
  }

  /**
   * Get the tenant audit log (append-only).
   */
  getAuditLog(): AuditableTenantEvent[] {
    return [...this.auditLog];
  }

  // ── Internal ────────────────────────────────────────────────

  private checkRateLimit(tenant: Tenant): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute window
    const key = tenant.tenantId;

    let entry = this.requestCounts.get(key);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now };
      this.requestCounts.set(key, entry);
    }

    entry.count++;
    const limit = tenant.rateLimitProfile.requestsPerMinute;

    if (entry.count > limit) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - entry.count };
  }

  private logEvent(tenantId: string, action: string, detail: string): void {
    this.auditLog.push({
      tenantId,
      action,
      timestamp: new Date().toISOString(),
      detail,
    });
  }

  _reset(): void {
    this.requestCounts.clear();
    this.auditLog = [];
  }
}
