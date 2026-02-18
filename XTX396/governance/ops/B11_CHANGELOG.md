# B11.1 — Gap-Fill Hardening Changelog

**Branch:** `feature/b11-1-gapfill-hardening`  
**Parent:** `feature/b11-ops-growth-mobile-admin` @ `bac416d`  
**Author:** Ops Security Engineering  
**Date:** 2025-07-16

---

## Summary

Seven hardening deliverables addressing gaps identified in the B11 ops layer
security review. All changes are scoped to `/ops` and introduce no new external
dependencies.

---

## Deliverables

### D1 — Network Egress Hardening

**File:** `ops/security/egress/DomainAllowlist.ts`

- Centralized SSRF-safe egress validation with a domain allowlist
- Scheme enforcement (HTTPS only), port restriction (443), credential rejection
- Redirect-bypass detection via `safeFetch()` wrapper
- Private/loopback IP blocking (127.x, 10.x, 172.16–31.x, 192.168.x, `::1`)
- Wired into: `CrmAdapter`, `MessageAdapter`, `ContentOps`

### D2 — Safe Mode Guard (SSOT)

**File:** `ops/core/SafeMode.ts`

- Single-source-of-truth `SafeModeController` singleton replaces per-adapter
  `safeMode: boolean` fields
- `enable()`, `disable()`, `panic()`, `isExternalAllowed()` API
- Subscriber pattern for reactive UI updates
- `panic()` freezes the controller — no further disabling possible
- Wired into: all four adapters, `OpsContext`, `SettingsPage`

### D3 — Audit Atomic Append with Locking

**Files:**
- `ops/automation/audit/AtomicJsonlSink.ts`
- `ops/automation/audit/replay.ts`

- Crash-safe JSONL append using `write` + `fdatasync` (not `appendFileSync`)
- Cooperative file locking via lockfile
- Truncation detection (`detectTruncation`) for incomplete trailing lines
- Replay CLI tool for audit log verification and re-processing
- Module created; integration into `OpsAuditLogger` deferred pending review

### D4 — Automation Idempotency and Dead-Letter Queue

**File:** `ops/automation/engine/IdempotentExecutor.ts`

- SHA-256-based idempotency key from `(ruleId, subjectId, timeWindow)`
- In-memory record store with TTL-based expiry
- Exponential backoff retry with configurable limits
- Permanent failures (TypeError, RangeError, SyntaxError) routed to DLQ
  immediately
- Wired into: `AutomationEngine.executeRule()`

### D5 — PII Minimization

**File:** `ops/security/pii/redact.ts`

- `redactPii(data)` recursively walks objects and redacts sensitive fields
- Field detection: email, phone, SSN, DOB, address, password, secret, token,
  API key
- Pattern-based string scanning for embedded emails and SSN patterns
- Email → `***@domain`, Phone → `***XXXX`, SSN → `***-**-XXXX`
- `redactForAudit(data)` convenience wrapper (deep clone + redact)
- Wired into: `CrmAdapter` (webhook body + audit), `MessageAdapter` (audit)

### D6 — UX Safety Upgrades

**Files:**
- `ops/console/app/components/ConfirmActionSheet.tsx`
- `ops/console/pages/settings/SettingsPage.tsx` (modified)

- Typed confirmation dialog requiring exact phrase entry
- Case-insensitive match, disabled submit until phrase confirmed
- ARIA `alertdialog` role, keyboard accessible
- Panic button on Settings page — triggers `SafeMode.panic()` with audit log
- ConfirmActionSheet required to disable Safe Mode (phrase: "DISABLE SAFE MODE")

### D7 — Observability (Correlation IDs)

**File:** `ops/core/correlation.ts`

- `generateCorrelationId()` → `cor_<uuid>` format
- LIFO correlation stack: `pushCorrelation()`, `popCorrelation()`,
  `currentCorrelationId()`
- `withCorrelation(id, fn)` for scoped execution with automatic cleanup
- Wired into: `CrmAdapter` (audit payloads), `AutomationEngine` (audit payloads)

---

## Adapter Modifications

| Adapter | Changes |
|---|---|
| `CrmAdapter.ts` | SafeMode SSOT, egress validation, `safeFetch`, PII redaction, correlation IDs; removed local `DOMAIN_ALLOWLIST`, `safeMode` boolean, domain management functions |
| `MessageAdapter.ts` | SafeMode SSOT for all 3 adapters, egress validation for webhook adapter, `safeFetch`, PII redaction |
| `ContentOps.ts` | SafeMode SSOT for both dispatchers, `safeFetch` for dispatch + health check |
| `AutomationEngine.ts` | SafeMode SSOT, `IdempotentExecutor` integration, correlation IDs; removed `safeMode` param from `getAutomationEngine()` factory |
| `OpsContext.tsx` | `useEffect` subscription to SafeMode singleton, `panic()` callback |
| `SettingsPage.tsx` | Panic button, ConfirmActionSheet for Safe Mode disable |

---

## Test Coverage

**File:** `ops/__tests__/b11-hardening.test.ts`  
**Tests:** 39 passing

| Suite | Count |
|---|---|
| D1 — DomainAllowlist | 11 |
| D2 — SafeMode SSOT | 7 |
| D3 — Truncation Detection | 3 |
| D4 — IdempotentExecutor | 5 |
| D5 — PII Redaction | 9 |
| D7 — Correlation IDs | 4 |

---

## Pre-Existing Failures (Not Introduced by This Change)

4 tests in `src/tests/policy-engine.test.ts` fail independently of this branch.
These are B8-era regressions in command evaluation and rate-limiting logic.

---

## Configuration Changes

- `vitest.config.ts`: Added `ops/**/*.test.ts` to the `include` array

---

## What This Change Does NOT Do

- Does not modify any code outside `/ops`
- Does not introduce new external dependencies
- Does not weaken fail-closed behavior
- Does not alter original evidence or audit records
- Does not remove or hide any existing audit entries
