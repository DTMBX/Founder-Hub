# Tenant Model — Technical Reference

> B16-P1 | Deployment Documentation

## Overview

The tenant model introduces strict multi-tenant isolation across
all platform services. Every operation requires a valid `tenant_id`
in context. Cross-tenant data access is denied by default.

## Tenant Fields

| Field | Type | Description |
|-------|------|-------------|
| `tenantId` | string (UUID) | Unique tenant identifier |
| `name` | string | Human-readable tenant name |
| `tier` | `public` \| `pro` \| `internal` | Service tier |
| `status` | `active` \| `suspended` | Tenant lifecycle status |
| `createdAt` | ISO-8601 | Creation timestamp |
| `allowedTools` | string[] | Tool IDs this tenant may access |
| `featureFlags` | Record<string, boolean> | Per-tenant feature toggles |
| `rateLimitProfile` | object | Rate limiting configuration |

## Rate Limit Profiles

| Parameter | Public | Pro | Internal |
|-----------|--------|-----|----------|
| Requests/min | 30 | 300 | 1000 |
| Max rows | 100 | 10,000 | 100,000 |
| Max export (MB) | 5 | 100 | 500 |
| Concurrent sessions | 3 | 20 | 100 |

## Default Tenant

The `public-demo` tenant is created automatically with:
- Tier: `public`
- Billing: disabled
- Messaging: disabled
- File uploads: disabled
- External APIs: disabled

## Context Middleware

The `TenantContextMiddleware` resolves tenant context for each
request and enforces:

1. **Existence check** — tenant must be registered
2. **Status check** — suspended tenants are denied
3. **Rate limiting** — per-minute request cap
4. **Cross-tenant guard** — `assertSameTenant()` blocks cross-access
5. **Feature flags** — `isFeatureEnabled()` checks tenant toggles
6. **Tool access** — `isToolAllowed()` checks tool permissions

## Usage

```ts
import { TenantRegistry, createTenant } from '../../ops/tenancy/TenantModel';
import { TenantContextMiddleware } from '../../ops/tenancy/TenantContextMiddleware';

const registry = new TenantRegistry();
const middleware = new TenantContextMiddleware(registry);

// Create and register a tenant
const tenant = createTenant('Acme Law', 'pro', ['search-legal-documents']);
registry.register(tenant);

// Resolve context for a request
const result = middleware.resolve(tenant.tenantId);
if (result.allowed) {
  const ctx = result.context!;
  // Use ctx.tenantId in all data queries
}
```

## Schema

See `ops/tenancy/tenant.schema.json` for the JSON Schema definition.

## Policy

See `governance/security/tenant_isolation_policy.md`.
