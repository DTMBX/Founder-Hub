# B26-P2 — RBAC Model

**Date:** 2026-02-18
**Branch:** feature/b26-mobile-auth

---

## Existing RBAC (Preserved)

The RBAC system is already mature. B26 does not change role definitions or capabilities.

### Roles (from `ops/auth/roles.ts`)

| Role | Level | Operator Mode | Capabilities |
|------|-------|---------------|-------------|
| owner | 100 | No | All capabilities including `dangerous_actions`, `full_admin_access` |
| admin | 75 | No | All capabilities except `dangerous_actions` |
| editor | 50 | No | `create_site_wizard`, `preview_site`, `view_audit` |
| operator | 40 | Yes (locked) | `create_site_wizard`, `preview_site`, `publish_site`, `view_audit`, `manage_leads` |
| reviewer | 35 | No | `case_jacket_review`, `case_jacket_notes`, `case_jacket_export`, `view_audit` |
| support | 25 | No | `view_audit` only |

### Capabilities

- **operator**: `create_site_wizard`, `preview_site`, `publish_site`, `view_audit`, `manage_leads`
- **reviewer**: `case_jacket_review`, `case_jacket_notes`, `case_jacket_export`, `view_audit`
- **admin**: All operator + reviewer capabilities + `manage_settings`, `manage_security`, `manage_users`, `manage_deployments`, `manage_templates`, `manage_components`, `manage_blueprints`, `dangerous_actions`, `full_admin_access`

### Enforcement Layers

1. **`ops/auth/roles.ts`** — `hasCapability()`, `canAccessRoute()`, `isOperatorModeLocked()`
2. **`src/lib/permissions.ts`** — `hasPermission()`, `enforceAction()`, `usePermissions()`
3. **`src/lib/route-guards.ts`** — `useRouteGuard()`, `RequireAuth`, `RequireRole`
4. **Publish targets** — `blockedTenantTypes` array per target

### Tenant Isolation

- `public-demo` tenant is blocked from `github_pr` publishing
- `public-demo` and `trial` tenants blocked from GitHub App actions
- `suspended` tenants blocked from all publishing
- Tenant model: `ops/tenancy/TenantModel.ts`

---

## B26 Integration: Provider Auth → RBAC

### Role Source Migration

| Before B26 | After B26 |
|------------|-----------|
| Role stored in `localStorage` user record (`user.role`) | Role stored in Supabase user metadata (`user_metadata.role`) |
| `useAuth().currentUser.role` reads from localStorage | Auth provider abstraction reads from Supabase session |
| Role changes written to localStorage | Role changes written via Supabase admin API |

### RBAC Enforcement (Unchanged)

The existing enforcement functions (`hasCapability`, `canAccessRoute`, `hasPermission`, `enforceAction`) accept a role string. They do not care where the role comes from.

B26 changes only the **source** of the role value, not the enforcement logic.

### Demo Tenant Guard (Unchanged)

Rule: `public-demo` tenant **cannot access admin routes**. This is enforced by:
1. `canAccessRoute('support', route)` — demo visitors get `support` role
2. `blockedTenantTypes: ['public-demo']` on publish targets
3. Operator mode lock for operator-level users

B26 does not weaken these controls.

---

## Tests Required

1. Unauthorized role cannot access admin-only actions → blocked
2. Operator role can only access allowed routes → enforced
3. Demo tenant cannot access admin → enforced
4. Role change emits audit event
5. Missing/invalid role defaults to most restrictive → fail-closed

---

## Gate 2: PASS

RBAC model documented. Existing enforcement preserved.
Proceed to B26-P3 (Auth Implementation).
