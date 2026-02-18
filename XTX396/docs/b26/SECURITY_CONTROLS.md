# B26 — Security Controls

**Date:** 2026-02-18
**Branch:** feature/b26-mobile-auth

---

## Control Matrix

| # | Control | Implementation | Status |
|---|---------|---------------|--------|
| S1 | No secrets in client code | Supabase anon key (designed for client), URL is public | ✅ |
| S2 | PKCE flow for SPA | `flowType: 'pkce'` in supabase.ts | ✅ |
| S3 | Fail-closed auth | Missing session → unauthenticated; unknown role → `support` | ✅ |
| S4 | No auto-registration | `shouldCreateUser: false` on OTP/magic link | ✅ |
| S5 | Session validation | 60s interval re-check of session; expired → logout | ✅ |
| S6 | Audit events | All login/logout/fail/reset emit to `logAudit()` | ✅ |
| S7 | Error sanitization | `formatAuthError()` strips internal details | ✅ |
| S8 | Least privilege default | New users get `support` role (view audit only) | ✅ |
| S9 | Password minimum | 12 characters enforced on `changePassword()` | ✅ |
| S10 | Append-only audit | Legacy `clearLegacyAuthData()` never deletes audit log | ✅ |
| S11 | Explicit migration | Legacy data removed only with user confirmation | ✅ |
| S12 | Demo tenant blocking | Public-demo tenant cannot access admin publish routes | ✅ |
| S13 | MFA detection | `mfaEnabled` derived from Supabase verified factors | ✅ |
| S14 | Token refresh | `autoRefreshToken: true` in Supabase client config | ✅ |
| S15 | Session storage key | `xtx396-supabase-auth` (namespaced to avoid collision) | ✅ |

---

## Risk Mitigations (from STACK_DISCOVERY_REPORT)

| Risk | Description | Mitigation |
|------|------------|------------|
| R1 | `VITE_ADMIN_PASSWORD` in JS bundle | Eliminated: auth moves to Supabase, no password in env |
| R2 | localStorage session forgery | Mitigated: Supabase JWT verified server-side |
| R3 | No rate limiting on login | Mitigated: Supabase has built-in rate limiting |
| R4 | PBKDF2 with 100K iterations | Retained for legacy mode only; Supabase uses bcrypt |
| R5 | Client-side audit log tampering | Improved: Supabase events can be server-logged |
| R6 | No session expiry enforcement | Fixed: 60s validation interval |
| R7 | 2FA bypass via localStorage | Fixed: MFA managed by Supabase, not client |

---

## Threat Model

### In Scope
- Credential theft (mitigated by provider auth)
- Session hijacking (mitigated by PKCE + JWT rotation)
- Privilege escalation (mitigated by server-side role storage)
- Brute force (mitigated by provider rate limiting)
- Legacy data leakage (mitigated by explicit migration)

### Out of Scope (GitHub Pages constraints)
- Server-side log tamper-proofing (no backend)
- HttpOnly cookies (not available in SPA-only)
- CSP nonce injection (requires server headers)

These are documented trade-offs of the static-only architecture.
Supabase's server-side session management partially compensates.

---

## Compliance Notes

- All auth changes are auditable via `logAudit()`
- Migration actions require explicit user confirmation
- No silent data deletion
- Audit logs are append-only and preserved during migration
- Role assignments are documented and deterministic
