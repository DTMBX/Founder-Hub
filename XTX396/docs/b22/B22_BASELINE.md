# B22 — Baseline Assessment

## Current State (Pre-B22)

### Site Generation Pipeline (B21)

The pipeline produces a `StoredSite` via:
`validate → scaffold → render → watermark → hash → store`

Output types:
- `StoredSite` — final stored record with `siteId`, `manifest` (HashResult), `metadata`
- `HashResult` — `artifacts[]` with per-file SHA-256 + `manifestHash`
- `PipelineResult` — full trace of every pipeline step

Storage: `StorageAdapter` interface with `InMemoryStorageAdapter` default.

### Preview System (B21)

- HMAC-SHA256 tokens (24h TTL)
- Rate-limited preview sessions
- Token → session → page views

### Audit Patterns

Four audit shapes exist; all use append-only arrays with ISO timestamps.
Correlation IDs: `cor_{uuid}` via `generateCorrelationId()`.

### RBAC

- `publish_site` capability: operator, admin, owner
- `manage_deployments` capability: admin, owner
- `dangerous_actions` capability: owner only
- `hasCapability(role, cap)` — fail-closed enforcement

### Gaps Identified

| Gap | Impact | B22 Resolution |
|-----|--------|----------------|
| No publish system | Sites generated but not deployable | P1-P4: three publish targets |
| No hosted serving | Operators cannot share sites | P2: Hosted publish |
| No export | Operators cannot download sites | P3: ZIP export |
| No GitHub integration | No automated PR publishing | P4: GitHub PR target |
| No publish audit trail | Publish actions untracked | P1: audit events |
| No domain binding | Custom domains not possible | P6: domain hooks |
| No publish rate limiting | Potential abuse | P7: rate limits + circuit breaker |
| No publish evidence bundle | Incomplete audit packages | P8: evidence bundle |
