# B26-P3 — Auth Implementation

**Date:** 2026-02-18
**Branch:** feature/b26-mobile-auth

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/supabase.ts` | Supabase client singleton with PKCE flow | ~66 |
| `src/lib/auth-provider.ts` | Unified auth abstraction (Supabase + legacy) | ~464 |
| `src/lib/legacy-migration.ts` | Legacy localStorage detection and cleanup | ~184 |
| `src/lib/__tests__/b26-auth-provider.test.ts` | 60 tests covering all B26 auth concerns | ~700 |

---

## Architecture

```
┌──────────────────────────────────┐
│  useAuthProvider()               │  ← Unified hook
│  ┌─────────────┬────────────────┐│
│  │ Supabase    │ Legacy Bridge  ││
│  │ PKCE flow   │ useAuth() shim ││
│  └─────────────┴────────────────┘│
│         │             │          │
│         ▼             ▼          │
│  getSupabaseClient()  useAuth()  │
│  (supabase.ts)        (auth.ts)  │
└──────────────────────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ RBAC Enforcement │
  │ roles.ts         │
  │ permissions.ts   │
  │ route-guards.ts  │
  └──────────────────┘
```

## Auth Mode Selection

Auth mode is determined at hook initialization:

```
if VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY → 'supabase'
else → 'legacy'
```

This is fail-safe: if Supabase is not configured, the system falls back
to the existing localStorage auth with zero breakage.

## RBAC Integration

- Supabase: role read from `user_metadata.role`
- Legacy: role read from localStorage user record
- Default role: `support` (fail-closed, least privilege)
- Role hierarchy: owner > admin > editor > operator > reviewer > support
- Existing `hasCapability()`, `canAccessRoute()`, `hasPermission()` unchanged

## Session Security

- PKCE flow (no client secret required)
- Auto-refresh tokens via Supabase SDK
- 60-second session validation interval
- Fail-closed: expired/missing session → unauthenticated
- `shouldCreateUser: false` — no auto-registration via magic link

## Audit Events

All auth lifecycle events emit to the existing `logAudit()` system:

| Event | Emitted On |
|-------|-----------|
| `login` | Successful sign-in (password or magic link) |
| `login_failed` | Failed login attempt |
| `logout` | Manual sign-out or session end |
| `password_changed` | Password change or reset request |
| `login` (migration) | Legacy data cleared or migration skipped |

## Test Coverage

60 tests across 12 test groups:

1. Auth mode detection
2. `isAdminRole` checks
3. AuthUser type shape
4. Legacy auth detection
5. Migration banner logic
6. Legacy data clearing
7. Migration skip
8. Legacy data summary
9. RBAC enforcement (5 role scenarios)
10. Session security constants
11. Demo tenant blocking
12. Auth error formatting

---

## Gate 3 Status

| Check | Result |
|-------|--------|
| `npx vitest run` (B26 tests) | 60/60 passed |
| `npx tsc --noEmit` (B26 files) | 0 errors |
| Secret scan (B26 files) | No secrets found |
| RBAC tests | Pass (operator, reviewer, admin, owner, unknown) |
