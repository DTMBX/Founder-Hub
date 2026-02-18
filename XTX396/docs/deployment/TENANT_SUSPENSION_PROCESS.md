# Tenant Suspension Process

> B16-P6 | Deployment Operations | Classification: Operational

## When to Suspend

A tenant MUST be suspended when:

1. **Security incident** — credential compromise, data breach attempt
2. **Abuse** — repeated rate limit violations, scraping, enumeration
3. **Payment failure** — invoice overdue beyond grace period
4. **Policy violation** — terms of service breach
5. **Legal requirement** — court order, regulatory directive

## Suspension Procedure

### Step 1: Authorization

- P1/P2 incidents: on-call engineer may suspend immediately
- Payment/policy: requires administrator approval
- Legal: requires legal counsel confirmation

### Step 2: Execute Suspension

```ts
import { TenantRegistry } from '../../ops/tenancy/TenantModel';

const registry = new TenantRegistry();
registry.setStatus(tenantId, 'suspended');
```

### Step 3: Verify

```ts
import { TenantContextMiddleware } from '../../ops/tenancy/TenantContextMiddleware';

const mw = new TenantContextMiddleware(registry);
const result = mw.resolve(tenantId);
// result.allowed === false
// result.reason === 'Tenant is suspended'
```

### Step 4: Notification

- Send suspension notice to tenant contact email.
- Include reason category (not internal details).
- Include appeal/restoration process.

### Step 5: Documentation

Record in audit trail:
- Tenant ID
- Suspension timestamp
- Reason category
- Authorizing party
- Expected review date

## Restoration Procedure

### Prerequisites

1. Root cause resolved
2. Administrator approval
3. Any required remediation completed

### Execute

```ts
registry.setStatus(tenantId, 'active');
```

### Verify

```ts
const result = mw.resolve(tenantId);
// result.allowed === true
```

### Post-Restoration

- Notify tenant of restoration
- Monitor for 48 hours for recurrence
- Update incident record

## Data Handling During Suspension

- Tenant data is **retained** (not deleted)
- No queries or exports are permitted
- Audit logs continue to accumulate
- API keys remain but all requests are denied at the context layer

Tenant deletion is not supported. Permanent deactivation
is achieved through indefinite suspension.

---

*Effective with B16-P6 implementation.*
