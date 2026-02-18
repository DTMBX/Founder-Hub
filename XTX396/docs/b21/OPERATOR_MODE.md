# Operator Mode — B21-P1

> Status: IMPLEMENTED  
> Date: 2026-02-18

---

## Overview

Operator Mode provides a locked, wizard-only experience for non-technical users
who need to generate and manage client sites without access to admin internals,
system settings, or destructive actions.

## New Roles

| Role | Level | Operator Mode | Description |
|------|-------|---------------|-------------|
| operator | 40 | ON (default) | Guided site generation only |
| reviewer | 35 | OFF | Case jacket review, notes, exports |

## Operator Capabilities

```
create_site_wizard    — Start guided site creation
preview_site          — Generate watermarked preview
publish_site          — Publish completed site
view_audit            — Read-only audit log access
manage_leads          — View and manage leads
```

## Reviewer Capabilities

```
case_jacket_review    — Review case jacket contents
case_jacket_notes     — Add/edit structured notes
case_jacket_export    — Export jacket (watermarked in demo)
view_audit            — Read-only audit log access
```

## Route Access (Fail-Closed)

**Operator** — allowlist only:
`sites`, `client-sites`, `leads`, `audit`, `law-firm`, `smb-template`, `agency`

**Reviewer** — allowlist only:
`case-jackets`, `documents`, `court`, `audit`

All other routes are invisible and inaccessible to these roles.

## Operator Mode Lock

When Operator Mode is active:
- Admin sidebar shows ONLY allowlisted routes
- No access to system settings, security, deployments
- No destructive actions available
- No feature flag modification
- All actions go through wizard flows

## Enforcement Points

1. `hasCapability(role, cap)` — fail-closed for unknown roles
2. `canAccessRoute(role, route)` — allowlist-based for operator/reviewer
3. `isOperatorModeLocked(role)` — true for operator, true for unknown (fail-closed)
4. `canAssignRole(assigner, target)` — level-based, must be strictly higher

## Integration

- Source: `ops/auth/roles.ts`
- Tests: `ops/auth/__tests__/roles.test.ts`
- Registry: `governance/admin/capabilities_registry.json` (updated)
