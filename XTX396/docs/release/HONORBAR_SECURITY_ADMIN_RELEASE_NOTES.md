# Release Notes — HonorBar + Security + Admin Upgrade

> Branch: `feature/honorbar-security-admin-upgrade`  
> Base: `main` at `32c9930` (B20 merge)  
> Commits: 5 (Step 0 + Phase 1 + Phase 2 + Phase 3 + Phase 4)

---

## Overview

This branch delivers three independent but coordinated improvements:

1. **HonorFlagBar Never-Clip Fix** — The honor flag bar is now rendered once
   at the application layout root, eliminating per-page duplication and
   ensuring it is never clipped by overflow or z-index conflicts.

2. **Secret Exposure Verification** — Two new scan scripts confirm no
   secrets exist in the working tree or git history. The `.gitignore` has
   been hardened with additional security-sensitive file patterns.

3. **Admin Panel Security Upgrades** — Feature flag setters now enforce
   owner-only role requirements and emit tamper-evident audit events.
   A dangerous actions banner provides persistent visual awareness.

---

## Phase 1 — HonorBar Never-Clip Fix

### Problem
The HonorFlagBar was rendered per-page (PublicSite.tsx, CaseJacket.tsx) and
missing entirely from AdminDashboard, SiteRouter, CheckoutResult, and
OfferingPage. CaseJacket had hardcoded sticky offsets that did not match the
bar's actual height.

### Solution
- Moved HonorFlagBar to `App.tsx` layout root — all views are wrapped
- Created `useHonorBarSettings` hook for centralized KV prop resolution
- Set `--honor-bar-height` CSS custom property on `:root` via JS
- Updated AdminDashboard sidebar/header to use `var(--honor-bar-height)`
- Updated CaseJacket sticky header to use CSS variable
- Added dev-only layout guard (`honor-bar-guard.ts`) for overflow + z-index
- Added iOS safe-area-inset-top support
- Created `docs/ui/HONOR_BAR_RULES.md` — 8 invariants + z-index stack policy

### Test Coverage
18 tests: height constants, overflow detection, z-index verification, CSS
custom property contract.

---

## Phase 2 — Secret Exposure Verification

### Problem
After prior `git-filter-repo` remediation, no ongoing scan infrastructure
existed for the working tree or git history.

### Solution
- Created `scripts/security/scan-working-tree.ps1` — filename + content scan
- Created `scripts/security/scan-git-history.ps1` — full commit history scan
- Both scripts print PATHS ONLY, never matched content
- Updated `.gitignore`: added `.env.*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`,
  `*.sqlite`, `*.db`, `/secrets/`, `.venv/`
- Created `docs/security/SECRET_EXPOSURE_RESPONSE.md` — rotation protocol
- Created `docs/security/GIT_HISTORY_REMEDIATION.md` — filter-repo guide

### Scan Results
- Working tree: **CLEAN** (1 expected filename: `.env`, already gitignored)
- Git history: **CLEAN** (16 false positives: test mocks, pattern defs, PEM
  headers in proxy code)

---

## Phase 3 — Admin Panel Security Upgrades

### Problem
`OWNER_ONLY_FLAGS` and `AUDITED_FLAGS` were declared but not enforced in
the `setFlag()` / `setFlags()` functions. No visual indicator existed when
dangerous actions were enabled.

### Solution
- Enforced `OWNER_ONLY_FLAGS` in both setters — non-owner callers blocked
- Emit audit events (`auditConfig()`) on `AUDITED_FLAGS` changes via
  dynamic import of `audit-ledger.ts`
- Added dangerous actions warning banner in AdminDashboard (`role="alert"`)
- Created `governance/admin/capabilities_registry.json` — JSON export of
  all roles, permissions, action guards, feature flags, route permissions
- Created `docs/admin/ADMIN_PANEL_UPGRADES.md`

### Test Coverage
31 tests: default safety, owner-only enforcement, audited flags config,
mode helpers, reset safety, capabilities registry integrity, event dispatch.

---

## Cumulative Test Count

| Suite | Tests |
|-------|-------|
| B13 (Backup & Recovery) | 82 |
| B14 (Onboarding) | 107 |
| B15 (ToolHub) | 101 |
| B16 (Multi-Tenant) | 111 |
| HonorBar Layout | 18 |
| Admin Upgrades | 31 |
| **Total** | **450** |

---

## Files Changed (by Phase)

### Step 0 (2 files)
- `docs/ui/HONOR_BAR_BASELINE.md` — NEW
- `docs/security/SECRET_EXPOSURE_TRIAGE.md` — NEW

### Phase 1 (10 files)
- `src/App.tsx` — MODIFIED
- `src/components/HonorFlagBar.tsx` — MODIFIED
- `src/components/PublicSite.tsx` — MODIFIED
- `src/components/CaseJacket.tsx` — MODIFIED
- `src/components/admin/AdminDashboard.tsx` — MODIFIED
- `src/index.css` — MODIFIED
- `src/hooks/use-honor-bar-settings.ts` — NEW
- `src/lib/honor-bar-guard.ts` — NEW
- `src/__tests__/honor-bar-layout.test.ts` — NEW
- `docs/ui/HONOR_BAR_RULES.md` — NEW

### Phase 2 (5 files)
- `.gitignore` — MODIFIED
- `scripts/security/scan-working-tree.ps1` — NEW
- `scripts/security/scan-git-history.ps1` — NEW
- `docs/security/SECRET_EXPOSURE_RESPONSE.md` — NEW
- `docs/security/GIT_HISTORY_REMEDIATION.md` — NEW

### Phase 3 (6 files)
- `src/lib/feature-flags.ts` — MODIFIED
- `src/components/admin/AdminDashboard.tsx` — MODIFIED
- `src/__tests__/admin-upgrades.test.ts` — NEW
- `governance/admin/capabilities_registry.json` — NEW
- `docs/admin/ADMIN_PANEL_UPGRADES.md` — NEW
- `.gitignore` — MODIFIED

### Phase 4 (2 files)
- `docs/release/HONORBAR_SECURITY_ADMIN_RELEASE_NOTES.md` — NEW
- `governance/CHANGELOG_HONORBAR_SECURITY_ADMIN.md` — NEW

---

## Non-Negotiable Verification

| Requirement | Status |
|-------------|--------|
| No secrets committed | PASS — scans clean |
| No printing sensitive values | PASS — scripts print paths only |
| UI fix is layout-root | PASS — App.tsx single render |
| All existing tests pass | PASS — 401 B13-B16 green |
| New tests pass | PASS — 49 new tests green |
| TypeCheck passes | PASS — no new errors |
