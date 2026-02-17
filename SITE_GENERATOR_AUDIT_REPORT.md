# Site Generator + Admin Panel Audit Report

**Date:** February 17, 2026  
**Audit Scope:** XTX396 (Admin Panel + Site Generator) + Evident (Backend + Eleventy Site)  
**Status:** AUDIT COMPLETE — Ready for Implementation Planning

---

## Executive Summary

This audit examines the Site Generator and Admin Panel product across two repositories:
- **XTX396**: React/TypeScript admin panel with Vite, site generation scripts, client-side auth
- **Evident**: Flask/Python backend with Eleventy static site generator, npm workspaces monorepo

### Key Findings

| Category | Status | Risk Level |
|----------|--------|------------|
| **Create Site from Template** | ✅ Implemented | Low |
| **Edit Site Content/Config** | ✅ Implemented | Low |
| **Preview Site** | ⚠️ Partial | Medium |
| **Publish Site Safely** | ⚠️ Basic | High |
| **GitHub Integration** | ⚠️ PAT-based | Medium |
| **Audit Logging** | ✅ Implemented | Low |
| **Rollback** | ❌ Missing | High |
| **Multi-tenant Isolation** | ⚠️ Partial | Medium |
| **Subscription Management** | ❌ Missing | Medium |
| **Embedded Terminal** | ❌ Missing | High |
| **Savepoint/Checkpoint System** | ❌ Missing | High |

---

## A. Repository Discovery & Mapping

### A.1 XTX396 Repository Structure

```
XTX396/
├── src/
│   ├── components/
│   │   ├── admin/           # 39 admin panel managers
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── SitesManager.tsx      # Multi-site management
│   │   │   ├── TemplatesManager.tsx
│   │   │   ├── SecurityManager.tsx
│   │   │   ├── AuditLog.tsx
│   │   │   └── ... (36 more managers)
│   │   ├── offerings/       # Product cards, offering grid
│   │   ├── sections/        # Landing page sections
│   │   └── ui/              # Glassmorphism components
│   ├── lib/
│   │   ├── auth.ts          # PBKDF2 + AES-256-GCM auth with 2FA/keyfile
│   │   ├── site-registry.ts # Multi-tenant site management
│   │   ├── github-sync.ts   # GitHub API integration (PAT-based)
│   │   ├── static-export.ts # Static HTML export with SHA-256 hashing
│   │   ├── static-renderer.ts
│   │   ├── site-validation.ts
│   │   ├── crypto.ts        # Encryption utilities
│   │   ├── keyfile.ts       # USB keyfile + backup codes
│   │   └── types.ts         # 1237 lines of type definitions
│   └── config/
│       ├── site.config.ts   # Environment variable configuration
│       └── theme-provider.tsx
├── scripts/
│   ├── generate-site.mjs    # Site generator with 8 presets
│   ├── site-manager.mjs     # Site registry management CLI
│   ├── generate-static-sites.mjs
│   └── generate-previews.mjs
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages deployment
└── public/data/             # Static JSON data files
```

**Framework Stack:**
- Frontend: React 19 + TypeScript + Vite 7
- UI: Radix UI + Tailwind CSS + Framer Motion
- State: localStorage KV store (client-side persistence)
- Auth: PBKDF2 + AES-256-GCM, TOTP 2FA, USB keyfile support
- Payments: Stripe integration

### A.2 Evident Repository Structure

```
Evident/
├── app.py                   # Flask application entry
├── app_config.py            # Flask factory + blueprints
├── api/
│   ├── admin.py
│   ├── auth.py
│   ├── stripe_endpoints.py
│   └── ... (15+ route modules)
├── auth/
│   ├── models.py            # SQLAlchemy User, Role, Tier models
│   ├── routes.py            # Login/register/dashboard
│   ├── security.py          # Rate limiting, headers
│   └── admin_routes.py
├── services/
│   ├── evidence_store.py    # Evidence management service
│   ├── audit_stream.py      # Append-only audit logging
│   └── structured_logging.py
├── cli/
│   └── evident.py           # CLI for algorithms, audit, export
├── tools/
│   └── (40+ utility scripts including PowerShell)
├── apps/                    # npm workspaces satellite apps
│   ├── civics-hierarchy/    # Vite/React app
│   ├── epstein-library-evid/
│   ├── essential-goods-ledg/
│   └── geneva-bible-study-t/
├── migrations/              # Alembic database migrations
├── .github/workflows/
│   ├── pages.yml            # Eleventy + satellite apps deploy
│   └── (30+ workflow files)
└── _site/                   # Eleventy build output
```

**Framework Stack:**
- Backend: Flask + SQLAlchemy + Flask-Login
- Static Site: Eleventy 3.x
- Satellite Apps: Vite/React (npm workspaces)
- Database: SQLite (dev) / PostgreSQL (prod-ready)
- CI/CD: GitHub Actions with parallel builds

### A.3 Entrypoints

| Purpose | XTX396 | Evident |
|---------|--------|---------|
| Dev Server | `npm run dev` (Vite) | `npm run dev` (Eleventy) |
| Build | `npm run build` | `npm run build` |
| Tests | `npm test` (Vitest) | `pytest` / `npm test` |
| Site Generate | `npm run site:generate` | N/A |
| Deploy | GitHub Actions → Pages | GitHub Actions → Pages |
| Backend | N/A (client-side only) | `python app.py` |

### A.4 Environment Variables Required

**XTX396 (.env):**
```
VITE_SITE_ID, VITE_SITE_NAME, VITE_SITE_DOMAIN
VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD
VITE_STRIPE_PUBLISHABLE_KEY
VITE_THEME_PRESET, VITE_COLOR_PRIMARY
```

**Evident (.env):**
```
FLASK_ENV, FLASK_SECRET_KEY, DATABASE_URL
OPENAI_API_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
JWT_SECRET_KEY
```

---

## B. Functional Audit Checklist

### B.1 Create Site from Template

| Aspect | Status | Evidence |
|--------|--------|----------|
| Template selection | ✅ | `generate-site.mjs` with 8 presets (law-firm, contractor, medical, nonprofit, basic, ecommerce, restaurant, real-estate) |
| Slug/domain configuration | ✅ | CLI flags: `--name`, `--domain`, `--preset` |
| Initial data generation | ✅ | Creates .env, package.json, CNAME |
| Registry tracking | ✅ | `site-manager.mjs` maintains `site-registry.json` |

**Gap:** No GUI wizard in admin panel — CLI-only generation.

### B.2 Edit Site Content/Config

| Aspect | Status | Evidence |
|--------|--------|----------|
| Content editing UI | ✅ | 39 admin manager components |
| Data persistence | ✅ | localStorage KV store |
| GitHub sync | ⚠️ | PAT-based, manual trigger |
| Multi-site switching | ✅ | `SitesManager.tsx`, `useSite()` context |

**Gap:** No draft/preview/staging state machine. Edits go directly to localStorage.

### B.3 Preview Site

| Aspect | Status | Evidence |
|--------|--------|----------|
| Local preview | ✅ | `npm run dev` |
| Preview build artifacts | ⚠️ | `static-export.ts` generates HTML with SHA-256 hash |
| Shareable preview URL | ❌ | No remote preview infrastructure |
| Preview versioning | ❌ | No preview snapshots stored |

**Gap:** No remote preview URLs. No preview versioning.

### B.4 Publish Site Safely

| Aspect | Status | Evidence |
|--------|--------|----------|
| Build process | ✅ | Vite build → dist/ |
| Deploy pipeline | ✅ | GitHub Actions → Pages |
| Commit SHA tracking | ⚠️ | GitHub tracks commits but no admin UI shows it |
| Approval gates | ❌ | No required reviewers or environment approvals |
| Staged publishing | ❌ | Direct to production only |

**Gap:** No staging environment. No approval gates. No PR-based publish flow.

### B.5 GitHub Connection

| Aspect | Status | Evidence |
|--------|--------|----------|
| Auth method | ⚠️ | Personal Access Token stored in localStorage |
| Repo operations | ✅ | `github-sync.ts` can push files via API |
| Multi-repo support | ⚠️ | Partial — ManagedSite supports different repos |
| Branch/PR creation | ❌ | Direct commits to main only |

**Gap:** Should use GitHub App (not PAT). No PR workflow. No branch protection awareness.

### B.6 Audit Logging

| Aspect | Status | Evidence |
|--------|--------|----------|
| Admin actions | ✅ | `AuditEvent` type with 40+ action types |
| Append-only storage | ✅ | `founder-hub-audit-log` localStorage key |
| Site-level audit | ✅ | `SiteAuditEvent` per-site tracking |
| Viewer UI | ✅ | `AuditLog.tsx` component |

**Status:** Well-implemented. Minor gap: no immutable backend storage (localStorage can be cleared).

### B.7 Rollback

| Aspect | Status | Evidence |
|--------|--------|----------|
| Version snapshots | ❌ | No SiteVersion entity |
| Restore mechanism | ❌ | No rollback API |
| Deployment history | ❌ | No deployment records stored |

**Status:** CRITICAL GAP. Rollback is not implemented.

### B.8 Multi-Tenant Safety

| Aspect | Status | Evidence |
|--------|--------|----------|
| Site isolation | ⚠️ | Sites have separate storage keys (`sites:{siteId}:*`) |
| Cross-tenant access | ⚠️ | Client-side enforcement only |
| Tenant-scoped auth | ❌ | Single admin for all sites |

**Gap:** Multi-site support exists but no robust tenant isolation or per-site admin roles.

### B.9 Subscription Management

| Aspect | Status | Evidence |
|--------|--------|----------|
| Plan tiers | ❌ | Not implemented |
| Subscription status | ❌ | Not implemented |
| Renewal tracking | ❌ | Not implemented |
| Stripe subscription hooks | ⚠️ | One-time payments implemented, recurring not |

**Status:** CRITICAL GAP. Only offering-based one-time purchases exist.

---

## C. Security Audit Checklist

### C.1 Authentication & Authorization

| Aspect | Status | Risk |
|--------|--------|------|
| Password hashing | ✅ PBKDF2 + salt | Low |
| Session management | ✅ 4-hour sessions with refresh | Low |
| 2FA support | ✅ TOTP + backup codes | Low |
| USB keyfile auth | ✅ AES-256-GCM | Low |
| Role-based access | ❌ Single admin role | Medium |
| Per-site permissions | ❌ Not implemented | High |

**Recommendation:** Implement Owner/Admin/Editor/Support roles.

### C.2 Terminal Security (PROPOSED)

Terminal does not exist yet. Requirements for implementation:

| Requirement | Implementation Needed |
|-------------|----------------------|
| Sandboxed execution | Command dispatcher with allowlist |
| Per-site scoped working directory | `site use <slug>` sets context |
| No arbitrary network access | Block curl/wget/Invoke-WebRequest |
| No secret printing | Regex-based output redaction |
| Rate limiting | Max 10 commands/minute |
| Timeouts | 60-second max execution |

### C.3 Secrets Management

| Aspect | Status | Risk |
|--------|--------|------|
| GitHub PAT storage | ⚠️ localStorage (cleartext) | High |
| Encryption at rest | ✅ `encryptField()` available | Low |
| Token rotation | ❌ No mechanism | Medium |
| Token revocation | ❌ No mechanism | Medium |

**Recommendation:** Encrypt PAT with user's auth key. Implement rotation prompts.

### C.4 Deployment Integrity

| Aspect | Status | Risk |
|--------|--------|------|
| Immutable artifacts | ⚠️ SHA-256 hash computed but not stored | Medium |
| Commit SHA tracking | ⚠️ Git tracks but admin UI doesn't show | Medium |
| Build ID references | ❌ Not implemented | High |
| Approval workflow | ❌ Not implemented | High |

**Recommendation:** Store deployment records with commit SHA, build hash, approver.

---

## D. UX Audit Checklist

### D.1 Create Site Wizard

| Aspect | Status | Friction |
|--------|--------|----------|
| Template selection UI | ❌ CLI only | High |
| Domain configuration | ❌ CLI only | High |
| Preview before create | ❌ Not available | Medium |
| Progress feedback | ❌ Not applicable | N/A |

**Recommendation:** Build 4-step wizard: Template → Config → Preview → Create

### D.2 Status Clarity

| Aspect | Status | Friction |
|--------|--------|----------|
| Draft/Preview/Staging/Live states | ❌ Not implemented | High |
| Visual status indicators | ⚠️ `SiteStatus` exists but limited states | Medium |
| Last deploy timestamp | ❌ Not displayed | Medium |

**Current states:** draft | demo | private | unlisted | public  
**Needed states:** DRAFT → PREVIEW → STAGING → LIVE

### D.3 Error Handling

| Aspect | Status | Quality |
|--------|--------|---------|
| Form validation | ✅ react-hook-form + zod | Good |
| Toasts for actions | ✅ Sonner toasts | Good |
| Error boundaries | ✅ ErrorFallback.tsx | Good |
| Recovery flows | ⚠️ Backup codes exist | Adequate |

### D.4 Observability

| Aspect | Status | Quality |
|--------|--------|---------|
| Audit log viewer | ✅ AuditLog.tsx | Good |
| Deployment history | ❌ Not implemented | Poor |
| Per-site logs | ⚠️ Site audit events exist | Adequate |

---

## E. Architecture Decision

### Recommendation: MONOREPO WITH PER-SITE FOLDERS

**Chosen:** Option 2 — Monorepo with per-site folders

```
XTX396/
├── sites/
│   ├── site-a/
│   │   ├── data/
│   │   ├── assets/
│   │   └── config.json
│   ├── site-b/
│   │   └── ...
│   └── site-c/
│       └── ...
├── src/                  # Shared admin panel
├── templates/            # Site templates
└── .github/workflows/
    └── deploy.yml        # Unified deploy with matrix strategy
```

**Justification:**
1. **Centralized governance:** Single CI/CD system, unified dependency management
2. **Subscription management:** Easier to manage plan tiers across all sites
3. **Atomic deploys:** Deploy all sites together or selectively
4. **Reduced operational complexity:** One repo to monitor
5. **Template updates:** Propagate changes to all sites from one location

**Trade-offs accepted:**
- Larger repo size (mitigated by sparse checkout)
- Need careful GitHub Actions matrix for per-site deploys
- Branch protection applies to entire repo (acceptable)

---

## F. Gaps Summary & Risk Matrix

| Gap | Severity | Effort | Priority |
|-----|----------|--------|----------|
| No SiteVersion/snapshots | 🔴 High | Medium | P0 |
| No rollback mechanism | 🔴 High | Medium | P0 |
| No deployment records | 🔴 High | Low | P0 |
| No approval gates | 🔴 High | Medium | P0 |
| No embedded terminal | 🔴 High | High | P1 |
| No subscription management | 🟡 Medium | Medium | P1 |
| No GUI create wizard | 🟡 Medium | Medium | P1 |
| PAT stored cleartext | 🟡 Medium | Low | P1 |
| GitHub App integration | 🟡 Medium | High | P2 |
| No remote preview URLs | 🟡 Medium | High | P2 |
| No per-site admin roles | 🟡 Medium | Medium | P2 |

---

## G. Recommended Implementation Order

### Phase 1: Data Model Foundation (P0)
1. Add SiteVersion entity with immutable snapshots
2. Add Deployment entity with commit SHA, status, logs
3. Migrate SiteStatus to state machine (DRAFT→PREVIEW→STAGING→LIVE)

### Phase 2: Savepoint/Publish Flow (P0)
1. Implement save-draft (stores SiteVersion)
2. Implement create-preview (builds + stores artifact hash)
3. Implement publish-staging (optional gate)
4. Implement publish-live with confirmation
5. Implement rollback-to-version

### Phase 3: Terminal Module (P1)
1. Build command dispatcher backend
2. Create PowerShell scripts in `/tools/admin-cli/`
3. Build xterm.js terminal UI
4. Implement per-site root switching

### Phase 4: Subscription Hooks (P1)
1. Add plan_tier and subscription_status to ManagedSite
2. Add renewal_date, last_payment fields
3. Build "Managed Sites" view with status filters

### Phase 5: Create Wizard (P1)
1. Build multi-step wizard component
2. Integrate template selection
3. Add live preview panel
4. Connect to site-generate flow

### Phase 6: GitHub App Migration (P2)
1. Create GitHub App in org
2. Replace PAT auth with installation tokens
3. Implement PR-based publish flow
4. Add environment-based approvals

---

## H. Next Steps

**AUDIT PHASE COMPLETE.**

Proceed to produce:
1. **Implementation Plan** (detailed checkpoints with acceptance criteria)
2. **Data Model Changes** (TypeScript interfaces + migrations)
3. **PR-ready code** (incremental, testable)

---

*Report generated by AI audit agent. Review with engineering lead before proceeding.*
