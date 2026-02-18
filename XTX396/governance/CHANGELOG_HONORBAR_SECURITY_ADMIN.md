# Changelog — HonorBar + Security + Admin Upgrade

Branch: `feature/honorbar-security-admin-upgrade`

---

## [Step 0] — Baseline Triage (`9f5d2e3`)

### Added
- `docs/ui/HONOR_BAR_BASELINE.md` — HonorFlagBar component analysis, render
  points, z-index map, overflow analysis, recommended fix path
- `docs/security/SECRET_EXPOSURE_TRIAGE.md` — Prior remediation status,
  .gitignore gap analysis, scan target patterns, action items

---

## [Phase 1] — HonorBar Never-Clip Fix (`277381f`)

### Changed
- `src/App.tsx` — HonorFlagBar rendered once at layout root via renderView()
- `src/components/HonorFlagBar.tsx` — Exported props interface, added
  --honor-bar-height CSS property, added dev layout guard, added safe area
- `src/components/PublicSite.tsx` — Removed per-page HonorFlagBar render
- `src/components/CaseJacket.tsx` — Replaced hardcoded offsets with CSS var
- `src/components/admin/AdminDashboard.tsx` — Added var-based offsets
- `src/index.css` — Added --honor-bar-height fallback

### Added
- `src/hooks/use-honor-bar-settings.ts` — Centralized KV settings hook
- `src/lib/honor-bar-guard.ts` — Overflow + z-index dev guard
- `src/__tests__/honor-bar-layout.test.ts` — 18 tests
- `docs/ui/HONOR_BAR_RULES.md` — 8 invariants, z-index stack policy

---

## [Phase 2] — Secret Exposure Scan (`057ad89`)

### Added
- `scripts/security/scan-working-tree.ps1` — Working tree secret scanner
- `scripts/security/scan-git-history.ps1` — Git history secret scanner
- `docs/security/SECRET_EXPOSURE_RESPONSE.md` — Rotation protocol
- `docs/security/GIT_HISTORY_REMEDIATION.md` — History rewrite guide

### Changed
- `.gitignore` — Added: .env.*, *.pem, *.key, *.pfx, *.p12, *.sqlite,
  *.db, /secrets/

### Verified
- Working tree: CLEAN
- Git history: CLEAN (16 false positives — test mocks + pattern defs)

---

## [Phase 3] — Admin Panel Upgrades (`347de3d`)

### Changed
- `src/lib/feature-flags.ts` — Enforce OWNER_ONLY_FLAGS in setters, emit
  audit events for AUDITED_FLAGS, add inline role check + dynamic audit
  import
- `src/components/admin/AdminDashboard.tsx` — Add dangerous actions warning
  banner (role="alert", red)
- `.gitignore` — Added .venv/

### Added
- `governance/admin/capabilities_registry.json` — JSON registry of all
  admin capabilities (roles, perms, guards, flags, routes)
- `src/__tests__/admin-upgrades.test.ts` — 31 tests
- `docs/admin/ADMIN_PANEL_UPGRADES.md` — Upgrade documentation

---

## [Phase 4] — Final Validation

### Added
- `docs/release/HONORBAR_SECURITY_ADMIN_RELEASE_NOTES.md` — Release notes
- `governance/CHANGELOG_HONORBAR_SECURITY_ADMIN.md` — This file

### Verified
- 450 tests passing (401 existing + 49 new)
- TypeCheck: no new errors
- Secret scans: CLEAN
- HonorBar: rendered at layout root, never clipped
