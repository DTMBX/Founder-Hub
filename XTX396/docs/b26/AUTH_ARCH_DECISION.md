# B26-P1 — Auth Architecture Decision

**Date:** 2026-02-18
**Branch:** feature/b26-mobile-auth
**Decision:** PATH B — Hosted Auth Provider (Supabase Auth)

---

## Decision Summary

The XTX396 admin panel is a **pure Vite/React SPA deployed to GitHub Pages**.
There is no backend server in production.

**PATH B (provider-based auth)** is selected because it:
- Works with static hosting (no server required)
- Provides server-side credential verification
- Enables mobile-friendly auth flows (magic link, OAuth)
- Eliminates the `VITE_ADMIN_PASSWORD` bundle exposure risk
- Requires zero additional infrastructure from the operator

---

## Evidence Cited

| Claim | Source |
|-------|--------|
| No backend server | `package.json` has no server start script; no Express/Fastify/Flask dependency |
| Static deploy | `.github/workflows/deploy.yml` builds Vite and deploys `dist/` to GitHub Pages |
| GitHub Pages hosting | `CNAME` file contains `xtx396.com` |
| Auth is client-only | `src/lib/auth.ts` stores users, sessions, and audit logs in `localStorage` |
| `VITE_*` env vars are client-exposed | Vite documentation: all `VITE_*` variables are embedded in the JS bundle at build time |

---

## Provider: Supabase Auth

### Why Supabase

1. **Free tier** — generous for single-operator use
2. **Email + magic link** — mobile-friendly, no password required
3. **OAuth** — Google/GitHub login optional
4. **Password auth** — available as fallback
5. **Session management** — provider-managed, HttpOnly cookies via SDK
6. **JWT claims** — custom metadata for RBAC roles
7. **JS SDK** — `@supabase/supabase-js` works in any SPA
8. **No vendor lock-in on data** — PostgreSQL underneath, exportable
9. **Rate limiting** — built-in at the provider level
10. **Self-hostable** — can migrate to self-hosted Supabase later

### Configuration Required

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

These are **public** values (anon key is designed to be client-exposed).
Row-Level Security (RLS) on Supabase enforces access control server-side.

---

## What Changes

### Deprecated (removed from production use)
- `VITE_ADMIN_PASSWORD` — no longer used for authentication
- `VITE_ADMIN_EMAIL` — replaced by Supabase user management
- `initializeDefaultAdmin()` — replaced by Supabase user creation
- localStorage user store (`xtx396:founder-hub-users`)
- localStorage session store (`xtx396:founder-hub-session`)

### Preserved
- `ops/auth/roles.ts` — RBAC definitions (operator, reviewer, admin)
- `src/lib/permissions.ts` — capability enforcement
- `src/lib/route-guards.ts` — auth guards (updated to check Supabase session)
- Audit logging — continues client-side, now includes provider auth events
- Safe Mode — unchanged
- Demo tenant isolation — unchanged

### New
- `src/lib/supabase.ts` — Supabase client initialization
- `src/lib/auth-provider.ts` — Auth provider abstraction layer
- `src/components/admin/AuthLogin.tsx` — New login screen (magic link + password)
- Provider-managed sessions with automatic refresh
- Role assignment via Supabase user metadata

---

## Migration Path

1. Install `@supabase/supabase-js`
2. Create Supabase project (free tier)
3. Create auth abstraction layer that wraps both legacy and provider auth
4. Legacy users see "Migrate account" prompt
5. After migration, legacy localStorage keys are cleared (with audit event)
6. `VITE_ADMIN_PASSWORD` and `VITE_ADMIN_EMAIL` become optional dev-only bootstrap

---

## Tradeoffs

| Factor | PATH A (Self-hosted) | PATH B (Provider) — Selected |
|--------|---------------------|------------------------------|
| Infrastructure | Requires new server | None (static hosting preserved) |
| Operational cost | Server hosting + monitoring | Free tier sufficient |
| Mobile login | Possible but requires server | Built-in magic link |
| Security | Full control | Provider-managed (proven) |
| Vendor dependency | None | Supabase (self-hostable fallback) |
| Implementation time | High | Moderate |

---

## Gate 1: PASS

Decision is evidence-based and cites repo findings.
Proceed to B26-P2 (RBAC + Capabilities).
