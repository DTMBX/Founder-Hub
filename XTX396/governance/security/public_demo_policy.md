# Public Demo Mode Policy

> B16-P2 | Governance | Classification: Mandatory

## Purpose

This policy defines the restrictions enforced when the platform
operates in PUBLIC_DEMO_MODE. Demo mode is the default for
unauthenticated or `public-demo` tenant access.

## Restrictions

### Output Bounding

| Limit | Value | Behavior on Exceed |
|-------|-------|--------------------|
| Max rows per query | 100 | Request rejected |
| Max export file size | 5 MB | Request rejected |
| Max preview length | 10,000 chars | Truncated with marker |

### Disabled Features

| Feature | Status | Reason |
|---------|--------|--------|
| File uploads | Disabled | Prevents abuse and storage exhaustion |
| External API adapters | Disabled | No uncontrolled network egress |
| Billing operations | Disabled | Prevents transaction in demo context |
| Messaging adapters | Disabled | Prevents spam and notification abuse |

### Rate Limiting

- **Per-tenant:** 30 requests/minute (from TenantModel)
- **Per-IP:** Configurable, enforced by DemoGuard
- Both limits are fail-closed

### Audit

All demo mode rejections are logged with:
- `tenantId`
- `action` (e.g., `row_limit_exceeded`, `file_upload_blocked`)
- `timestamp`
- `detail`

## Enforcement

Demo mode is enforced by the `DemoGuard` service class.
All public-facing endpoints MUST pass through DemoGuard checks
before processing.

## Override

Demo mode restrictions can only be relaxed by:
1. Authenticating with a non-demo tenant
2. Upgrading the tenant tier to `pro` or `internal`

Manual overrides are not supported in production.

---

*Effective with B16-P2 implementation.*
