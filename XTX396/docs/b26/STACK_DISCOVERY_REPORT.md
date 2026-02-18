# B26 — Stack Discovery Report

**Date:** 2026-02-18
**Branch:** feature/b26-mobile-auth
**Author:** B26 Phase Runner (automated scan)

---

## 1. Runtime Architecture: STATIC-ONLY (No Backend in Production)

### Evidence

| Signal | Finding |
|--------|---------|
| `package.json` scripts | `dev: vite`, `build: tsc -b --noCheck && vite build`, `preview: vite preview` — no server start script |
| `vite.config.ts` | Standard Vite SPA config with React SWC plugin; no SSR, no middleware |
| Deployment workflow | `.github/workflows/deploy.yml` deploys `dist/` to **GitHub Pages** — static hosting only |
| `CNAME` | `xtx396.com` — GitHub Pages custom domain |
| Backend frameworks | **None found.** No Express, Fastify, Nest, Flask, FastAPI, Django, or Uvicorn dependency |
| `fetch("/api/...")` calls | Only in: `ProductCard.tsx` (Stripe checkout — requires external endpoint), `site.config.ts` (contact form endpoint — configurable), `github-app/auth.ts` (GitHub token proxy URL) |
| Worker | `workers/github-token-proxy.ts` — Cloudflare Worker for GitHub App tokens; separate deployment, not part of the main app |
| Server-side env vars | None. All env vars use `VITE_*` prefix (client-exposed) |
| Database | **None.** No DB driver, ORM, migration, or connection config |

**Verdict:** This is a **pure Vite/React SPA** deployed to GitHub Pages. There is no backend server in production.

---

## 2. Current Auth Architecture

### Where Auth Runs

**Entirely in the browser.** All auth logic is in `src/lib/auth.ts` (871 lines).

| Component | Location |
|-----------|----------|
| User store | `localStorage` key `xtx396:founder-hub-users` (JSON array of User objects) |
| Session store | `localStorage` key `xtx396:founder-hub-session` |
| Login attempts | `localStorage` key `xtx396:founder-hub-login-attempts` |
| Audit log | `localStorage` key `xtx396:founder-hub-audit-log` (encrypted entries) |
| Password hashing | PBKDF2 via WebCrypto (with legacy SHA-256 migration path) |
| 2FA | TOTP with encrypted secret storage; backup codes in user record |
| Keyfile auth | USB keyfile verification (AdminKeyfile), backup codes, recovery phrase |
| Login UI | `src/components/admin/AdminLogin.tsx` |
| RBAC | `src/lib/permissions.ts` + `ops/auth/roles.ts` (operator, reviewer, admin) |
| Route guards | `src/lib/route-guards.ts`, `src/lib/route-guards.tsx` |

### Initial Admin Bootstrap

`initializeDefaultAdmin()` in `auth.ts` runs on app load:
1. Checks if `xtx396:founder-hub-users` exists in localStorage
2. If empty: reads `VITE_ADMIN_EMAIL` + `VITE_ADMIN_PASSWORD` from Vite env
3. Hashes the password (PBKDF2 + random salt)
4. Writes the admin user record to localStorage
5. If no env password set: generates random password, logs it to console in dev mode

### Session Configuration

| Property | Value |
|----------|-------|
| Duration | 4 hours (`SESSION_DURATION`) |
| Refresh | Auto-refresh if < 30 min remaining |
| Storage | `localStorage` (not HttpOnly cookie) |
| CSRF | Not applicable (no server) |
| Lockout | 3 failed attempts → 30 min lockout |

---

## 3. Risks Identified

### CRITICAL

| # | Risk | Detail |
|---|------|--------|
| R1 | **All auth is client-side only** | Anyone with DevTools can read, modify, or delete localStorage keys including user records, sessions, and audit logs. Auth provides UX gating, not security enforcement. |
| R2 | **VITE_ADMIN_PASSWORD in .env** | This is a Vite `VITE_*` variable — it is **embedded in the built JS bundle** at build time. If the app is built with this value, the plaintext password ships to every browser that loads the site. |
| R3 | **No session cookies** | Session is in localStorage, not an HttpOnly secure cookie. Vulnerable to XSS-based session theft. |
| R4 | **Mobile admin requires DevTools for recovery** | If localStorage gets cleared (browser wipe, private mode), the only recovery path is re-clearing localStorage and re-initializing — impossible from a phone without DevTools. |

### MODERATE

| # | Risk | Detail |
|---|------|--------|
| R5 | Audit log in localStorage | Append-only guarantee relies on client cooperation. A malicious actor can clear or alter the log. |
| R6 | Password hash stored client-side | PBKDF2 hashes are in localStorage. An attacker with physical device access can extract them. |
| R7 | No server-side rate limiting | Rate limits are enforced in localStorage — easily bypassed by clearing the key. |

---

## 4. Architecture Decision: PATH B (Hosted Auth Provider)

### Rationale

There is **no backend server** in production. Building one solely for auth would:
- Require new infrastructure (server hosting, CI/CD, monitoring)
- Violate the current "deploy to GitHub Pages" model
- Add operational complexity incompatible with the current single-operator workflow

**PATH B** (provider-based auth) is the correct choice because:
1. It works with static hosting (GitHub Pages)
2. It provides real server-side session management
3. It eliminates the `VITE_ADMIN_PASSWORD` risk
4. It enables mobile-friendly login (magic link / OAuth)
5. It requires zero backend infrastructure from us

### Recommended Provider Candidates

| Provider | Pros | Cons |
|----------|------|------|
| **Supabase Auth** | Free tier, email + OAuth, session cookies, JS SDK, RBAC via JWT claims | External dependency |
| **Clerk** | React components, RBAC, session management, free tier | More opinionated UI |
| **Firebase Auth** | Google ecosystem, free tier, well-documented | Google lock-in |

**Recommended: Supabase Auth** — best balance of control, free tier, and static-site compatibility.

### What Changes

| Current | After B26 |
|---------|-----------|
| `VITE_ADMIN_PASSWORD` in env → embedded in bundle | Removed. Auth via provider. |
| localStorage user store | Provider-managed users |
| localStorage session | Provider session (HttpOnly cookie via SDK) |
| Console password on first boot | Magic link or OAuth |
| Phone login impossible without DevTools | Magic link from phone |
| Client-side rate limiting | Provider-enforced rate limiting |

### What Is Preserved

- RBAC model (`ops/auth/roles.ts`) — maps to provider claims/metadata
- Audit logging — continues append-only to localStorage + optionally to provider
- Route guards — continue to check auth state from provider SDK
- Safe Mode / demo tenant isolation — unchanged
- All B13–B23 governance controls — unchanged

---

## 5. Implementation Scope

### In Scope (B26)
1. Auth provider integration (Supabase Auth)
2. Login screen (magic link + password, mobile-first)
3. RBAC via provider metadata
4. Session management via provider SDK
5. Legacy localStorage auth migration path
6. Mobile admin UX improvements
7. Audit events for auth lifecycle

### Out of Scope (B26)
- Backend server deployment
- Server-side rendering
- Database for application data (beyond auth)
- Moving localStorage KV data to server

---

## Gate 0: PASS

This report is complete. No implementation has been performed.
Proceed to B26-P1 (Architecture Decision document).
