# Tenant Isolation Policy

> B16-P1 | Governance | Classification: Mandatory

## Scope

This policy applies to all services, tools, APIs, and data stores
within the Evident / Founder-Hub platform.

## Requirements

### 1. Tenant Identification

- Every tenant is assigned a unique `tenant_id` (UUID or reserved identifier).
- The default tenant `public-demo` exists at system start with restricted capabilities.

### 2. Data Isolation

- All data queries MUST include `tenant_id` as a required parameter.
- No query, API call, or export may access data belonging to another tenant.
- Cross-tenant data access attempts MUST be logged and denied.

### 3. Fail-Closed Access

- If no tenant context is present, the request MUST be denied.
- If the tenant is suspended, the request MUST be denied.
- Rate limits are enforced per tenant, per the configured `rateLimitProfile`.

### 4. Audit Trail

- All tenant context resolutions MUST be logged.
- All access denials MUST be logged with reason.
- All cross-tenant access attempts MUST be logged and flagged.
- Audit logs include `tenant_id` on every event.
- Audit logs are append-only.

### 5. Tenant Lifecycle

- Tenants may be created with `active` status.
- Tenants may be suspended by an administrator.
- Suspended tenants retain their data but cannot access any services.
- Tenant deletion is not supported. Tenants are archived via suspension.

### 6. Feature Flags

- Feature flags are tenant-scoped.
- The `public-demo` tenant has restricted flags:
  - `billing`: false
  - `messaging`: false
  - `fileUpload`: false
  - `externalApis`: false

### 7. Tool Access

- Tool access is controlled via `allowedTools[]`.
- If the list is empty, all non-archived tools are accessible.
- If the list is populated, only listed tools are accessible.

## Enforcement

Violation of this policy constitutes a security incident.
Cross-tenant data exposure must be reported immediately.

---

*Effective with B16-P1 implementation.*
