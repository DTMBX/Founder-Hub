# Admin Panel Review Plan

> Architecture Planning — Session A  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## 1. Current State Inventory

### 1.1 Admin Pages (40 nav items, 7 categories)

| id | label | category | Component | Lines | Risk | Destructive Actions |
|----|-------|----------|-----------|-------|------|---------------------|
| `content` | Content | XTX396 Site | ContentManager | 184 | Low | None (toggle/reorder) |
| `about` | About / Updates | XTX396 Site | AboutManager | — | Low | None |
| `links` | Links | XTX396 Site | LinksManager | — | Low | None |
| `profile` | Profile & Emails | XTX396 Site | ProfileManager | — | Low | None |
| `hero-media` | Hero Media | XTX396 Site | HeroMediaManager | 452 | Low | Config overwrite |
| `visual-modules` | Visual Modules | XTX396 Site | VisualModulesManager | — | Low | None |
| `honor-flag-bar` | Honor Flag Bar | XTX396 Site | HonorFlagBarManager | — | Low | None |
| `investor` | Investor Section | Investor & Trade | InvestorManager | — | Low | None |
| `offerings` | Offerings | Investor & Trade | OfferingsManager | — | Low | None |
| `evident` | Evident Dashboard | Evident Platform | EvidentManager | 506 | Medium | None (config) |
| `sites` | Sites & Repos | Evident Platform | SitesManager | 690 | High | Archive, Delete site |
| `client-sites` | Client Sites | Frameworks | ClientSiteManager | 690 | High | Delete site, export |
| `law-firm` | Law Firm Showcase | Frameworks | LawFirmShowcaseManager | 780 | Medium | Delete records |
| `smb-template` | SMB Template | Frameworks | SMBTemplateManager | 765 | Medium | Delete records |
| `agency` | Agency Framework | Frameworks | AgencyFrameworkManager | 736 | Medium | Delete projects/invoices |
| `projects` | Projects | Case Management | EnhancedProjectsManager | 719 | Medium | Delete project |
| `court` | Court Cases | Case Management | EnhancedCourtManager | 918 | High | Delete case |
| `documents` | Documents | Case Management | DocumentsManager | 531 | High | Delete documents |
| `case-jackets` | Case Jackets | Case Management | CaseJacketManager | 1366 | High | Delete from jacket |
| `filing-types` | Filing Types | Case Management | FilingTypesManager | — | Low | None |
| `templates` | Templates | Case Management | TemplatesManager | — | Low | None |
| `inbox` | Inbox | Assets | AdminInbox | 673 | Medium | Delete uploads |
| `upload` | Upload Queue | Assets | UploadQueueManager | 651 | Medium | Delete from queue |
| `staging` | Staging Review | Assets | StagingReviewManager | 696 | Medium | Delete staged docs |
| `assets` | Asset Scanner | Assets | AssetScanner | 452 | Low | None |
| `asset-policy` | Usage Policy | Assets | AssetUsagePolicyManager | — | Low | None |
| `theme` | Theme | System | ThemeManager | 227 | Low | Reset to defaults |
| `settings` | Site Settings | System | SettingsManager | 661 | High | Clear GitHub token |
| `security` | Security | System | SecurityManager | 313 | Critical | Disable 2FA |
| `session-security` | Sessions & Devices | System | SecuritySettings | 549 | High | Revoke sessions, remove devices |
| `runtime-policy` | Runtime Policy | System | PolicyViewer | 714 | Low | None (read-only) |
| `deployments` | Deployments | System | DeploymentsPanel | 314 | Low | None (read-only) |
| `provenance` | Build Provenance | System | ProvenancePanel | 300 | Low | None (read-only) |
| `incidents` | Incidents | System | IncidentDashboard | 675 | Medium | Status transitions |
| `audit-integrity` | Audit Integrity | System | AuditIntegrity | 564 | Low | None (read-only) |
| `audit` | Audit Log | System | AuditLog | 60 | Low | None (read-only) |
| `leads` | Leads | System | AdminLeadsViewer | — | Low | None (read-only) |

### 1.2 Sidebar Actions

| Action | Trigger | Gate | Risk |
|--------|---------|------|------|
| Publish Changes | `handlePublish()` → ConfirmDialog → `publishToGitHub()` | `canPublish` (publish:execute) | High |
| Export Data | `downloadDataFiles()` | `canExport` (export:data) | Medium |
| Public Site | `onExit()` | None | None |
| Logout | `handleLogout()` | None | None |
| Mode Toggle | `activateOpsMode()` / `activateFounderMode()` | None | Low |

### 1.3 Feature Flags (14)

| Flag | Default | Owner-Only | Audited |
|------|---------|------------|---------|
| `founderMode` | true | No | No |
| `opsMode` | false | No | Yes |
| `dangerousActions` | false | Yes | Yes |
| `terminalEnabled` | false | Yes | Yes |
| `darkModeForced` | false | No | No |
| `animationsReduced` | false | No | No |
| `debugMode` | false | Yes | No |
| `mockData` | false | Yes | No |
| `newEditorEnabled` | false | No | No |
| `aiAssistEnabled` | false | No | No |
| `githubAppAuth` | false | No | No |
| `previewDeploysEnabled` | true | No | No |

### 1.4 Route Permission Gaps

Routes NOT in `ROUTE_PERMISSIONS` (defaulting to owner-only silently):

- `session-security` — should be `owner`
- `runtime-policy` — should be `admin` (read-only)
- `deployments` — should be `admin` (read-only)
- `provenance` — should be `admin` (read-only)
- `incidents` — should be `admin`
- `audit-integrity` — should be `admin` (read-only)

**Recommendation:** Explicitly add all 6 routes to `ROUTE_PERMISSIONS` so
there are zero silent defaults.

---

## 2. Keep / Remove / Replace Table

| id | Verdict | Rationale |
|----|---------|-----------|
| `content` | **Keep** | Core content management |
| `about` | **Keep** | Site identity |
| `links` | **Keep** | External links management |
| `profile` | **Keep** | Owner profile + emails |
| `hero-media` | **Keep** | Hero configuration |
| `visual-modules` | **Keep** | Section visual config |
| `honor-flag-bar` | **Keep** | Honor bar settings |
| `investor` | **Keep** | Investor section content |
| `offerings` | **Keep** | Offering/pricing management |
| `evident` | **Keep** | Platform dashboard |
| `sites` | **Keep** | Site registry management |
| `client-sites` | **Keep** | Multi-tenant CRUD |
| `law-firm` | **Keep** | Law firm template content |
| `smb-template` | **Keep** | SMB template content |
| `agency` | **Keep** | Agency template content |
| `projects` | **Keep** | Project management |
| `court` | **Keep** | Court case management |
| `documents` | **Keep** | Document management |
| `case-jackets` | **Keep** | Case jacket grouping |
| `filing-types` | **Keep** | Filing type config |
| `templates` | **Keep** | Document templates |
| `inbox` | **Keep** | Upload intake |
| `upload` | **Keep** | Upload queue |
| `staging` | **Keep** | Staging review |
| `assets` | **Keep** | Asset scanner |
| `asset-policy` | **Keep** | Usage policy |
| `theme` | **Replace** | Needs persistence to KV store; currently session-only |
| `settings` | **Keep** | Site settings + GitHub token |
| `security` | **Keep** | Auth security |
| `session-security` | **Keep** | Session + device management |
| `runtime-policy` | **Keep** | Read-only policy viewer |
| `deployments` | **Keep** | Deployment history |
| `provenance` | **Keep** | Build provenance |
| `incidents` | **Keep** | Incident management |
| `audit-integrity` | **Keep** | Hash chain verification |
| `audit` | **Keep** | Audit log viewer |
| `leads` | **Keep** | Lead management |

**Verdict Summary:** 39 Keep, 1 Replace (ThemeManager persistence), 0 Remove.

The admin surface is deliberately comprehensive for an owner-operated
platform. No pages are vestigial.

---

## 3. Proposed Minimal Admin IA

### 3.1 Desktop Layout (sidebar + content)

```
┌──────────────────────────────────────────────────────┐
│ HonorFlagBar (fixed top, z-40)                       │
├──────────┬───────────────────────────────────────────┤
│ SIDEBAR  │  CONTENT AREA                             │
│          │                                           │
│ ┌──────┐ │  ┌─ Header ─────────────────────────────┐ │
│ │ Logo │ │  │ [Tab Name]         [View Site] [Mode] │ │
│ │ Mode │ │  └───────────────────────────────────────┘ │
│ │ Role │ │                                           │
│ ├──────┤ │  ┌─ Danger Banner (if active) ──────────┐ │
│ │      │ │  │ ⚠ Dangerous Actions Enabled           │ │
│ │ P0   │ │  └───────────────────────────────────────┘ │
│ │ tabs │ │                                           │
│ │      │ │  ┌─ Module Content ─────────────────────┐ │
│ │ ──── │ │  │                                       │ │
│ │      │ │  │  (lazy-loaded admin component)        │ │
│ │ P1   │ │  │                                       │ │
│ │ tabs │ │  └───────────────────────────────────────┘ │
│ │      │ │                                           │
│ ├──────┤ │                                           │
│ │Publish│ │                                          │
│ │Export │ │                                          │
│ │Logout│ │                                          │
│ └──────┘ │                                          │
└──────────┴───────────────────────────────────────────┘
```

### 3.2 Mobile Layout (bottom bar + drawer)

```
┌──────────────────────┐
│ HonorFlagBar         │
├──────────────────────┤
│ Header [☰] [TabName] │
├──────────────────────┤
│                      │
│  Module Content      │
│  (full width)        │
│                      │
├──────────────────────┤
│ [Quick Actions Bar]  │
│ Content|Inbox|Upload │
│ Publish|Preview      │
└──────────────────────┘
```

### 3.3 Founder Mode IA (6 routes)

In Founder Mode, sidebar shows only:

```
CONTENT
  Content
ASSETS
  Inbox
  Upload Queue
PLATFORM
  Sites & Repos
  Projects
SYSTEM
  Leads
```

All other routes hidden. Mode toggle available in sidebar footer.

### 3.4 Ops Mode IA (all 40 routes)

Full sidebar with 7 categories. Categories collapse/expand. Sidebar
collapses to icon-only mode. Mobile uses Quick Actions bar for the 5
most common actions.

---

## 4. Capability Allowlist Model

### 4.1 Schema

```json
{
  "capability_id": "string",
  "description": "string",
  "roles_allowed": ["owner", "admin", "editor", "support"],
  "tenant_scope": "all | own | none",
  "audit_events": ["event_id_1", "event_id_2"],
  "requires_flag": "flag_name | null",
  "requires_confirmation": "typed | simple | none",
  "risk_level": "low | medium | high | critical"
}
```

### 4.2 Capability Registry (selected high-risk entries)

| capability_id | roles | tenant_scope | audit | confirmation | risk |
|---------------|-------|-------------|-------|-------------|------|
| `publish_changes` | owner, admin | own | `publish_executed` | typed: PUBLISH | high |
| `export_data` | owner | own | `data_exported` | typed: EXPORT | high |
| `delete_site` | owner | own | `site_deleted` | typed | critical |
| `delete_document` | owner, admin | own | `document_deleted` | typed | high |
| `delete_case` | owner, admin | own | `case_deleted` | typed | high |
| `deploy_production` | owner | own | `production_deployed` | typed: DEPLOY-PROD | critical |
| `disable_2fa` | owner | own | `2fa_disabled` | typed: DISABLE-2FA | critical |
| `revoke_session` | owner | own | `session_revoked` | simple | high |
| `bulk_delete` | owner | own | `bulk_delete_executed` | typed: BULK-DELETE | critical |
| `wipe_data` | owner | own | `data_wiped` | typed: WIPE-ALL-DATA | critical |
| `toggle_dangerous_actions` | owner | all | `flag_changed` | simple | critical |
| `clear_github_token` | owner | own | `token_cleared` | simple | high |
| `create_client_site` | owner, admin | own | `site_created` | none | medium |
| `apply_preset` | owner, admin | own | `preset_applied` | none | low |
| `export_site` | owner, admin | own | `site_exported` | simple | medium |
| `generate_preview` | public | none | `preview_created` | none | low |
| `view_audit_log` | owner, admin | own | `audit_accessed` | none | low |
| `manage_incidents` | owner, admin | own | `incident_updated` | none | medium |

### 4.3 Tenant Scope Rules

- `all` — applies across all tenants (only for system-level flags)
- `own` — scoped to the caller's active site/tenant
- `none` — no tenant context (e.g., public preview)

---

## 5. Default Locked State Rules

### 5.1 Public-Demo Tenant Restrictions

```
IF tenant.status === 'demo':
  - Admin panel: INVISIBLE (no route, no nav item)
  - Settings pages: INACCESSIBLE
  - Publish action: BLOCKED
  - Export action: BLOCKED
  - Destructive actions: BLOCKED
  - Feature flags: READ-ONLY
  - Data: READ-ONLY (no KV writes except analytics)
```

### 5.2 Safe Mode Rules

Safe Mode is active by default for all public-facing flows and non-owner
sessions.

```
WHEN safe_mode === true:
  - External API calls: BLOCKED (GitHub sync, token proxy, webhooks)
  - Adapter connections: DISABLED (payment, email, analytics)
  - File uploads: DISABLED
  - Terminal access: DISABLED
  - Dangerous actions: DISABLED (flag cannot be set)
  - Debug mode: DISABLED
  - All state changes: AUDIT LOGGED
```

### 5.3 Destructive Action Requirements

Every destructive action MUST satisfy ALL of:

1. **Role check** — caller has required role in `ROLE_PERMISSIONS`
2. **Flag check** — if `dangerous:*` permission, `dangerousActions` flag is on
3. **Confirmation** — typed or simple, as defined in `ACTION_GUARDS`
4. **Correlation ID** — unique `correlationId` attached to the action
5. **Audit event** — appended to hash-chained ledger (`auditLedger.append()`)
6. **Cool-down** — no repeat of the same destructive action within 5 seconds

```
destructiveAction(actionId, payload) {
  correlationId = crypto.randomUUID()
  assert(hasPermission(currentRole, actionId))
  assert(isConfirmed(actionId, confirmationType))
  audit({
    category: 'data',
    action: actionId,
    correlationId,
    severity: riskLevel(actionId) >= 'high' ? 'warning' : 'info',
    metadata: { ...sanitize(payload) }
  })
  execute(actionId, payload, correlationId)
}
```

---

## 6. Identified Issues Requiring Resolution

| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| 1 | 6 routes missing from `ROUTE_PERMISSIONS` | Medium | Add explicit entries |
| 2 | ThemeManager does not persist to KV | Low | Add KV save on "Save Theme" |
| 3 | No correlationId on destructive actions | Medium | Generate + attach to audit events |
| 4 | No cool-down on repeated destructive actions | Low | Add 5-second debounce |
| 5 | Mode toggle not audited | Medium | Add to AUDITED_FLAGS or manual audit call |
| 6 | Export Data action has no confirmation dialog | Medium | Add simple confirm |
| 7 | No "Demo tenant cannot access admin" guard | High | Add guard in App.tsx route logic |

---

## Non-Goals

- This plan does NOT redesign the admin UI layout or visual style.
- This plan does NOT introduce server-side admin APIs.
- This plan does NOT add new admin pages — only governs existing ones.
- This plan does NOT implement CAPTCHA or IP-based blocking (see
  RISK_ABUSE_MODEL_PREVIEW.md for visitor-facing abuse protections).
