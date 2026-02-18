# B26 — Changelog

All notable changes in the B26 (Mobile Operator Authentication) work.

---

## [B26] — 2026-02-18

### Added

#### Authentication
- **Supabase Auth integration** — PKCE flow client for SPA auth (`src/lib/supabase.ts`)
- **Unified auth provider hook** — `useAuthProvider()` with Supabase + legacy bridge (`src/lib/auth-provider.ts`)
- **Magic link login** — Passwordless sign-in via email link
- **Password login** — Standard email + password via Supabase
- **Password reset flow** — Email-based password recovery
- **Session validation** — 60-second periodic session check with fail-closed behavior
- **Default role:** `support` — Fail-closed, least privilege for new/unknown users

#### Mobile UX
- **ProviderLogin component** — Mobile-first login UI optimized for 360–480px (`src/components/admin/ProviderLogin.tsx`)
- **Method toggle** — Magic Link / Password tab switcher with `role=tablist`
- **Magic link sent** confirmation screen
- **Password reset** confirmation screen
- **Accessible** — WCAG 2.1 AA: labeled inputs, role=alert, aria-selected

#### Legacy Migration
- **Detection** — `detectLegacyAuth()` scans localStorage for legacy data (`src/lib/legacy-migration.ts`)
- **Migration banner** — UI component shown when legacy data + Supabase detected (`src/components/admin/MigrationBanner.tsx`)
- **Explicit clear** — Confirmation dialog before removing legacy data
- **Audit preservation** — `founder-hub-audit-log` never deleted (append-only)
- **Skip option** — Operator can dismiss banner without clearing data

#### Audit Events
- **Auth audit module** — Structured emitters with correlation IDs (`src/lib/auth-audit.ts`)
- **15 new AuditAction types** — session_expired, session_refreshed, magic_link_sent/failed, password_reset_requested/completed, role_changed, mfa_challenge_issued/passed/failed, legacy_migration_started/completed/skipped, auth_mode_switched, provider_error
- **Correlation IDs** — `b26-{timestamp}-{counter}` format for linking related events
- **Sensitive data redaction** — Passwords, tokens, secrets, and keys redacted in audit output

#### Integration
- **App.tsx** — Auth-mode-aware routing (Supabase vs legacy login)
- **AdminDashboard.tsx** — MigrationBanner placement below danger-actions banner

#### Documentation
- `docs/b26/STACK_DISCOVERY_REPORT.md` — Full stack analysis
- `docs/b26/AUTH_ARCH_DECISION.md` — Architecture decision (PATH B: Supabase)
- `docs/b26/RBAC_MODEL.md` — RBAC integration plan
- `docs/b26/AUTH_IMPLEMENTATION.md` — Implementation details
- `docs/b26/SECURITY_CONTROLS.md` — 17-control security matrix
- `docs/b26/B26_FINAL_POSTURE.md` — Final posture report

### Changed
- `src/lib/types.ts` — Extended `AuditAction` union with 15 B26 types
- `package.json` — Added `@supabase/supabase-js` dependency

### Not Changed (Preserved)
- `src/lib/auth.ts` — Legacy localStorage auth fully preserved
- `ops/auth/roles.ts` — 6 roles, capabilities unchanged
- `src/lib/permissions.ts` — Permission matrix unchanged
- `src/lib/route-guards.ts` — Route authorization unchanged
- `ops/tenancy/TenantModel.ts` — Tenant isolation unchanged

### Tests
- `src/lib/__tests__/b26-auth-provider.test.ts` — 60 tests (auth, RBAC, session, tenant)
- `src/lib/__tests__/b26-p4-p5.test.ts` — 13 tests (migration, login, mobile, a11y)
- `src/lib/__tests__/b26-p6-audit.test.ts` — 11 tests (correlation, emitters, types, redaction)
- **Total: 84 tests, all passing**
