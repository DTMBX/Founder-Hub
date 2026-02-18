# B22-P8 — Audit Bundle

## Purpose

Aggregates all publish-related audit events — publish operations, domain
requests, and circuit breaker state transitions — into a single, deterministic,
integrity-verified bundle.

## Architecture

```
PublishAuditBundle.ts
├── buildAuditBundle()     — aggregate + sort + hash
├── verifyBundleIntegrity() — re-hash and compare
├── filterBySource()       — filter by event source
├── filterByTimeRange()    — filter by timestamp range
└── djb2Hash()             — deterministic structural hash
```

## Event Sources

| Source    | Type                | Tenant-filtered |
|-----------|---------------------|-----------------|
| publish   | PublishAuditEvent   | Yes             |
| domain    | DomainAuditEvent    | Yes             |
| circuit   | CircuitEvent        | No (global)     |

## Bundle Structure

```typescript
interface AuditBundle {
  bundleId: string       // aud_bundle_{tenantId}_{timestamp}
  generatedAt: string    // ISO 8601
  tenantId: string
  entries: AuditEntry[]  // sorted by timestamp
  entryCount: number
  integrityHash: string  // DJB2 of serialized entries
}
```

## Integrity Verification

Each bundle includes a DJB2 hash of the serialized entries array.
`verifyBundleIntegrity()` re-computes the hash and compares.

DJB2 is used as a structural fingerprint — not cryptographic. For
court-admissible integrity, pair with SHA-256 from the core hash service.

## Determinism

- Entries are sorted by timestamp
- Hash function is deterministic (DJB2)
- Bundle ID is derived from tenant + generation time
- No randomness in any path

## Filtering

- `filterBySource(bundle, 'publish')` — publish events only
- `filterByTimeRange(bundle, start, end)` — time-bounded slice

## Fail-Closed

- Events from other tenants are excluded
- Circuit events (global) are always included
- Empty sources produce an empty bundle, not an error
