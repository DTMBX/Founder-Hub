# B22 — Demo Script

## Prerequisites

- Node.js 20+
- `npm install` completed
- All B22 test suites passing

## Quick Verification

Run all B22 tests:

```bash
npx vitest run ops/publish/__tests__/ 2>&1
```

Expected: 212 tests passing across 8 files.

## Walkthrough: Publish Lifecycle

### 1. Target Registration

```typescript
import { TargetRegistry } from 'ops/publish/targets/TargetRegistry'
import { HostedPublishTarget } from 'ops/publish/targets/HostedPublishTarget'
import { ZipExportTarget } from 'ops/publish/targets/ZipExportTarget'
import { hasCapability } from 'ops/auth/roles'

const registry = new TargetRegistry(hasCapability)

// Register targets
const hosted = new HostedPublishTarget(storage)
registry.register(hosted.registration)

const zip = new ZipExportTarget()
registry.register(zip.registration)
```

### 2. Preflight Check

```typescript
import { createPublishRequest } from 'ops/publish/models/PublishRequest'

const request = createPublishRequest({
  tenantId: 'tenant_1',
  actorId: 'admin_1',
  actorRole: 'owner',
  siteId: 'site_abc',
  blueprintId: 'bp_1',
  artifactRef: 'ref_123',
  publishTarget: 'hosted',
  // safeModeOn defaults to true
  // mode defaults to 'demo'
})

const preflight = registry.preflight(request)
// { allowed: true, reasons: [] }
```

### 3. Publish Execution

```typescript
const result = await registry.publish(request)
// result.success === true
// result.url === '/sites/site_abc/'
// result.auditEvents.length >= 3
```

### 4. Rate Limiting

```typescript
import { PublishRateLimiter } from 'ops/publish/safety/PublishRateLimiter'

const limiter = new PublishRateLimiter({ maxTokens: 5 })
const check = limiter.consume('tenant_1')
// check.allowed === true, check.remaining === 4
```

### 5. Circuit Breaker

```typescript
import { CircuitBreaker } from 'ops/publish/safety/CircuitBreaker'

const breaker = new CircuitBreaker({ failureThreshold: 3 })
breaker.recordFailure()
breaker.recordFailure()
breaker.recordFailure()
// breaker.state === 'open'
// breaker.isAllowed === false
```

### 6. Domain Binding

```typescript
import { InMemoryDomainBinder } from 'ops/publish/domains/DomainBinder'

const binder = new InMemoryDomainBinder()
const req = binder.requestDomain('t1', 's1', 'example.com', 'admin')
// req.status === 'pending'

binder.updateStatus(req.requestId, 'verified', 'admin')
// Now verified — terminal state
```

### 7. Audit Bundle Export

```typescript
import { buildAuditBundle, verifyBundleIntegrity } from 'ops/publish/audit/PublishAuditBundle'

const bundle = buildAuditBundle(
  'tenant_1',
  registry.getAuditLog(),
  binder.getAuditLog(),
  breaker.getEvents(),
)

verifyBundleIntegrity(bundle) // true
```

## Key Design Points to Demonstrate

1. **Fail-closed defaults** — safeModeOn=true, mode='demo', tenantType='standard'
2. **Append-only audit** — getAuditLog() returns copies
3. **Deterministic versions** — same hash + timestamp → same version string
4. **Watermark enforcement** — demo mode requires watermarked artifacts
5. **Redaction** — PR bodies scrubbed of secrets
6. **Terminal states** — verified/failed domains cannot transition
7. **No secrets in code** — GitHub config stores env var names only
