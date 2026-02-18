# Admin Panel Upgrades — Post-B20

> Phase 3 of `feature/honorbar-security-admin-upgrade`

---

## Summary

This phase hardens the admin panel's security enforcement and governance
infrastructure without changing the existing RBAC model or audit systems.

---

## Changes

### 1. Feature Flag Enforcement (`src/lib/feature-flags.ts`)

**Problem:** `OWNER_ONLY_FLAGS` and `AUDITED_FLAGS` were declared but not
enforced in the `setFlag()` and `setFlags()` setter functions. Any caller
could modify security-critical flags regardless of role.

**Fix:**
- `setFlag()` now checks the caller's session role before modifying any flag
  in `OWNER_ONLY_FLAGS`. Non-owner callers are silently blocked (with dev
  warning).
- `setFlags()` strips owner-only keys from the update payload for non-owner
  callers.
- Both setters now emit audit events (via `auditConfig()` from the
  tamper-evident hash-chained ledger) when any flag in `AUDITED_FLAGS`
  changes value.
- Dynamic `import('./audit-ledger')` avoids circular dependencies.
- Audit failures are swallowed — flag changes are never blocked by I/O.

### 2. Dangerous Actions Warning Banner (`src/components/admin/AdminDashboard.tsx`)

**Problem:** No visual indicator when `dangerousActions` flag was enabled.
Operators could enable destructive operations without persistent on-screen
awareness.

**Fix:**
- Red alert banner appears at the top of the content area (below the sticky
  header) whenever `flags.dangerousActions` is `true`.
- Uses `role="alert"` for screen reader announcement.
- Displays clear message: "Dangerous Actions Enabled" with guidance to
  disable when not in active use.

### 3. Capabilities Registry (`governance/admin/capabilities_registry.json`)

**Problem:** All admin capabilities (roles, permissions, action guards,
feature flags, route permissions) were defined only in TypeScript. No
external, auditable reference existed.

**Fix:**
- Created a JSON registry that mirrors the TypeScript source of truth.
- Includes: roles (4), permissions (35), action guards (11), feature flags
  (14), route permissions by role, founder mode routes.
- Test suite validates that the registry stays in sync with the TypeScript
  definitions (role levels, flag defaults, owner-only flags, audited flags).

---

## Test Coverage

| Suite | Tests | Description |
|-------|-------|-------------|
| Default Flag Safety | 5 | All security flags default to off |
| OWNER_ONLY Enforcement | 8 | Role gating on setFlag + setFlags |
| AUDITED_FLAGS Config | 2 | Correct flag membership |
| Mode Helpers | 4 | Founder/Ops mode state logic |
| Reset Safety | 2 | Dangerous actions disabled on reset |
| Capabilities Registry | 5 | JSON ↔ TypeScript sync validation |
| Event Dispatch | 4 | CustomEvent emission + blocking |
| **Total** | **31** | |

---

## Architecture Decisions

1. **Inline role check** — `getCurrentUserRole()` reads directly from
   `localStorage` to avoid circular dependency with `auth.ts`. This is
   intentional and safe because the session format is stable.

2. **Dynamic audit import** — `import('./audit-ledger')` is loaded lazily
   to avoid initialization ordering issues. The audit ledger singleton
   must not be required at module scope of `feature-flags.ts`.

3. **Silent blocking** — Non-owner callers trying to modify owner-only
   flags receive no error throw. The setter simply returns without
   modification. Dev builds emit a console warning for debugging.

4. **Registry as JSON** — The capabilities registry is JSON (not
   TypeScript) to enable consumption by non-TS tools: CI pipelines,
   policy engines, documentation generators, audit systems.

---

## Related Files

| File | Role |
|------|------|
| `src/lib/feature-flags.ts` | Flag enforcement + audit emission |
| `src/components/admin/AdminDashboard.tsx` | Dangerous actions banner |
| `governance/admin/capabilities_registry.json` | External registry |
| `src/__tests__/admin-upgrades.test.ts` | 31 tests |
| `src/lib/permissions.ts` | Source of truth (unchanged) |
| `src/lib/audit-ledger.ts` | Hash-chained audit (unchanged, consumed) |
