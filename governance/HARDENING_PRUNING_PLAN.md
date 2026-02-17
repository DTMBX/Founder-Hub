# Hardening & Pruning Plan

> Chain A1 Deliverable — Admin Panel Hardening Audit  
> Generated: 2025-01-XX  
> Status: PLAN COMPLETE — Awaiting Implementation

---

## Executive Summary

This document outlines the implementation plan for hardening the admin panel based on the audit findings in `ADMIN_ACTION_INVENTORY.md` and the navigation spec in `ADMIN_MINIMAL_NAV_SPEC.md`.

**Key Changes:**
- Add role-based access control (RBAC)
- Add typed confirmation dialogs for destructive actions
- Implement Founder Mode / Ops Mode switching
- Add audit logging for critical actions
- Gate dangerous actions behind feature flags

---

## Phase 1: Confirmation Dialog Hardening

### Priority: CRITICAL (Before any other changes)

All destructive actions must be hardened with proper confirmation dialogs.

### Current State → Target State

| Component | Action | Current | Target |
|-----------|--------|---------|--------|
| AdminDashboard | Publish to Live | None | Typed "PUBLISH" + audit |
| AdminDashboard | Export Data | None | Typed "EXPORT" + audit |
| SettingsManager | Clear GitHub Token | None | `confirm()` + audit |
| SettingsManager | Disable USB Keyfile | None | Typed "DISABLE" + audit |
| TwoFactorSetup | Disable 2FA | None | Typed "DISABLE-2FA" + audit |
| TwoFactorSetup | Regenerate Backup Codes | None | `confirm()` + audit |
| ThemeManager | Reset to Defaults | None | `confirm()` |
| SitesManager | Delete Site | `confirm()` | Typed site name |
| SitesManager | Delete Satellite | `confirm()` | `confirm()` + audit |
| StagingReviewManager | Delete Document | `confirm()` | Typed doc name |
| UploadQueueManager | Clear All | `confirm()` | `confirm()` + count display |
| ProjectsManager | Delete Project | `confirm()` | Typed project name |
| OfferingsManager | Delete Offering | `confirm()` | Typed offering name |

### Implementation: ConfirmationDialog Component

```typescript
// src/components/ui/confirmation-dialog.tsx

interface ConfirmationDialogProps {
  title: string
  description: string
  confirmText?: string      // If provided, user must type this
  confirmLabel?: string     // Button label
  cancelLabel?: string
  destructive?: boolean     // Red styling
  onConfirm: () => void
  onCancel: () => void
  open: boolean
}
```

### Audit Log Integration

Every confirmed destructive action must:
1. Log to audit trail before execution
2. Include: action, target, user, timestamp, confirmation method
3. Continue with action only after log success

---

## Phase 2: Role-Based Access Control

### Priority: HIGH

Implement 3-tier role system as specified in nav spec.

### Role Definitions

```typescript
// src/lib/types.ts

type UserRole = 'editor' | 'admin' | 'superadmin'

interface AuthUser {
  email: string
  role: UserRole
  createdAt: string
  lastLogin: string
}
```

### Permission Matrix

| Capability | editor | admin | superadmin |
|------------|--------|-------|------------|
| View content | ✓ | ✓ | ✓ |
| Edit content | ✓ | ✓ | ✓ |
| Delete content | — | ✓ | ✓ |
| View audit log | — | ✓ | ✓ |
| Publish to live | — | ✓ | ✓ |
| Export data | — | — | ✓ |
| Manage settings | — | — | ✓ |
| Manage security | — | — | ✓ |
| Manage users | — | — | ✓ |

### Route Guards

```typescript
// src/lib/route-guards.ts

const routePermissions: Record<string, UserRole[]> = {
  // Content routes - all roles
  'content': ['editor', 'admin', 'superadmin'],
  'inbox': ['editor', 'admin', 'superadmin'],
  'leads': ['editor', 'admin', 'superadmin'],
  'projects': ['editor', 'admin', 'superadmin'],
  'documents': ['editor', 'admin', 'superadmin'],
  'assets': ['editor', 'admin', 'superadmin'],
  
  // Admin routes - admin+
  'sites': ['admin', 'superadmin'],
  'investor': ['admin', 'superadmin'],
  'offerings': ['admin', 'superadmin'],
  'court': ['admin', 'superadmin'],
  'staging': ['admin', 'superadmin'],
  'audit': ['admin', 'superadmin'],
  'theme': ['admin', 'superadmin'],
  
  // Superadmin routes
  'settings': ['superadmin'],
  'security': ['superadmin'],
  'asset-policy': ['superadmin'],
  'filing-types': ['superadmin'],
}
```

### Enforcement Points

1. **Navigation filtering**: Hide routes user cannot access
2. **Route guard**: Redirect unauthorized route access
3. **Action guard**: Disable buttons user cannot use
4. **API guard**: Reject unauthorized mutations (if API exists)

---

## Phase 3: Admin Mode Implementation

### Priority: HIGH

Implement Founder Mode / Ops Mode as specified in nav spec.

### State Management

```typescript
// src/lib/admin-mode.ts

type AdminMode = 'founder' | 'ops'

interface AdminModeState {
  mode: AdminMode
  opsConfirmedAt?: string
  lastActivity: string
}

// Stored in localStorage: 'founder-hub-admin-mode'
```

### Mode Switching Logic

```typescript
// Founder → Ops
async function switchToOpsMode(): Promise<boolean> {
  // 1. Show confirmation dialog
  const confirmed = await showConfirmation({
    title: 'Switch to Ops Mode?',
    description: 'This grants access to all admin functions.',
    confirmLabel: 'Switch to Ops Mode'
  })
  
  if (!confirmed) return false
  
  // 2. Check if 2FA verification needed
  const user = getAuthUser()
  const state = getAdminModeState()
  
  if (user.twoFactorEnabled) {
    const lastVerified = state.opsConfirmedAt
    const hoursAgo = lastVerified 
      ? (Date.now() - new Date(lastVerified).getTime()) / 3600000
      : Infinity
    
    if (hoursAgo > 24) {
      const verified = await prompt2FA()
      if (!verified) return false
    }
  }
  
  // 3. Update state
  setAdminModeState({
    mode: 'ops',
    opsConfirmedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  })
  
  // 4. Log to audit
  logAuditEvent({
    action: 'MODE_SWITCH',
    details: 'Switched to Ops Mode',
    userEmail: user.email
  })
  
  return true
}

// Ops → Founder
function switchToFounderMode(): void {
  setAdminModeState({
    mode: 'founder',
    lastActivity: new Date().toISOString()
  })
  // No confirmation needed - restricting access
}
```

### Auto-Downgrade

After 24 hours of inactivity in Ops Mode, automatically downgrade to Founder Mode on next load.

---

## Phase 4: Audit Log Enhancement

### Priority: HIGH

Extend audit logging to cover all critical actions.

### Events to Log

| Event Type | Trigger | Data Logged |
|------------|---------|-------------|
| `LOGIN` | Successful login | email, 2FA used, timestamp |
| `LOGOUT` | Manual logout | email, timestamp |
| `MODE_SWITCH` | Founder ↔ Ops | mode, email, timestamp |
| `PUBLISH` | Publish to Live | commit hash, email, timestamp |
| `EXPORT` | Export Data | export type, email, timestamp |
| `DELETE` | Any delete action | resource type, resource id, email |
| `CONFIG_CHANGE` | Settings change | key, old value, new value, email |
| `SECURITY_CHANGE` | 2FA/password/key | change type, email, timestamp |
| `ROLE_CHANGE` | User role change | target user, old role, new role, email |

### Log Structure

```typescript
interface AuditEvent {
  id: string
  timestamp: string
  action: string
  category: 'auth' | 'config' | 'content' | 'security' | 'system'
  severity: 'info' | 'warning' | 'critical'
  userEmail: string
  details: string
  metadata?: Record<string, unknown>
}
```

### Log Immutability

- Audit log stored append-only
- No delete capability in UI
- Encrypted at rest
- Export requires superadmin + confirmation

---

## Phase 5: Feature Flag Gating

### Priority: MEDIUM

Gate potentially dangerous features behind feature flags.

### Flag Definitions

```typescript
// src/lib/feature-flags.ts

interface FeatureFlags {
  // Destructive actions
  enableBulkDelete: boolean        // Default: false
  enableDataExport: boolean        // Default: true (superadmin only)
  enableAccountDeletion: boolean   // Default: false
  
  // Advanced features
  enableMultiSite: boolean         // Default: true
  enableOCRProcessing: boolean     // Default: true
  enableInvestorPortal: boolean    // Default: true
  
  // Dev features
  enableDebugMode: boolean         // Default: false
  enableMockData: boolean          // Default: false
}
```

### Flag Control

- Flags stored in `runtime.config.json` or localStorage
- Superadmin can toggle via Settings
- Changes logged to audit

---

## Phase 6: Pruning (Feature Removal)

### Priority: LOW

Features identified for potential removal or deprecation.

### Candidates for Review

| Component | Reason | Recommendation |
|-----------|--------|----------------|
| EnhancedCourtManager | Duplicate of CourtManager | Consolidate into CourtManager |
| EnhancedProjectsManager | Duplicate of ProjectsManager | Consolidate into ProjectsManager |
| PresetSelector | Unclear purpose | Review usage, potentially remove |
| SiteVersionsPanel | May be unused | Review usage, gate behind flag |

### Pruning Process

1. **Audit usage**: Check if component is actively used
2. **Flag first**: Gate behind feature flag before removal
3. **Monitor**: Track flag engagement for 30 days
4. **Remove**: If unused, remove from codebase
5. **Document**: Update inventory and changelog

### Non-Removable (Per Directive)

The following **must not** be removed:
- Sites (SitesManager)
- Leads (LeadsManager)
- Clients (ClientSiteManager)
- Deployments (DeploymentsPanel)
- Audit (AuditLog)

---

## Implementation Order

### Sprint 1: Critical Hardening (Week 1)

1. [ ] Create `ConfirmationDialog` component
2. [ ] Add confirmation to Publish action
3. [ ] Add confirmation to Export action
4. [ ] Add confirmation to 2FA disable
5. [ ] Add confirmation to GitHub token clear
6. [ ] Enhance audit logging for critical actions

### Sprint 2: Role System (Week 2)

1. [ ] Define `UserRole` type
2. [ ] Add role to user data structure
3. [ ] Create `routePermissions` map
4. [ ] Implement route guards
5. [ ] Filter navigation by role
6. [ ] Add role management UI (superadmin only)

### Sprint 3: Admin Modes (Week 3)

1. [ ] Create `AdminModeState` management
2. [ ] Create Founder Mode navigation component
3. [ ] Create Ops Mode navigation component
4. [ ] Implement mode switching with confirmation
5. [ ] Add 2FA verification for Ops Mode elevation
6. [ ] Implement 24h auto-downgrade

### Sprint 4: Polish & Testing (Week 4)

1. [ ] Feature flag implementation
2. [ ] Review and prune unused components
3. [ ] End-to-end testing of all flows
4. [ ] Security review of changes
5. [ ] Documentation update
6. [ ] Deploy to staging

---

## Acceptance Criteria

### Confirmation Dialogs

- [ ] Publish action requires typed "PUBLISH" confirmation
- [ ] Export action requires typed "EXPORT" confirmation
- [ ] 2FA disable requires typed "DISABLE-2FA" confirmation
- [ ] Site deletion requires typing site name
- [ ] All confirmations logged to audit before action

### Role System

- [ ] Three roles defined: editor, admin, superadmin
- [ ] First user automatically superadmin
- [ ] Routes filtered by role
- [ ] Unauthorized routes show 403 or redirect
- [ ] Role changes logged to audit

### Admin Modes

- [ ] Founder Mode shows only 6 P0 routes
- [ ] Ops Mode shows all routes (role-filtered)
- [ ] Mode switch requires confirmation
- [ ] Ops Mode may require 2FA after 24h
- [ ] Mode persists across sessions
- [ ] Mode resets after 24h Ops inactivity

### Audit Log

- [ ] All critical actions logged
- [ ] Log is append-only (no delete UI)
- [ ] Log entries include user, action, timestamp
- [ ] Log export requires superadmin + confirmation

### General

- [ ] No regressions in existing functionality
- [ ] All tests pass
- [ ] Security review completed
- [ ] Documentation updated

---

## Risk Mitigation

### Risk: Breaking Existing Auth

**Mitigation**: Implement role system as additive. Existing users default to `superadmin` to ensure no lockout.

### Risk: Audit Log Performance

**Mitigation**: Implement log rotation/export for logs older than 90 days. Keep recent logs in local storage.

### Risk: Mode Confusion

**Mitigation**: Strong visual differentiation between modes. Clear badge in header. Different accent colors.

### Risk: Accidental Lockout

**Mitigation**: Always allow access to Security settings for password reset. Backup codes always available offline.

---

## Files to Create/Modify

### New Files

```
src/components/ui/confirmation-dialog.tsx
src/lib/admin-mode.ts
src/lib/route-guards.ts
src/lib/feature-flags.ts
src/lib/audit-service.ts
src/components/admin/FounderModeNav.tsx
src/components/admin/OpsModeNav.tsx
src/components/admin/RoleManager.tsx
```

### Modified Files

```
src/components/admin/AdminDashboard.tsx  # Mode switching, nav update
src/components/admin/SettingsManager.tsx  # Confirmations
src/components/admin/SecurityManager.tsx  # Confirmations
src/components/admin/TwoFactorSetup.tsx   # Confirmations
src/components/admin/SitesManager.tsx     # Confirmations
src/components/admin/StagingReviewManager.tsx  # Confirmations
src/components/admin/UploadQueueManager.tsx    # Confirmations
src/components/admin/ProjectsManager.tsx       # Confirmations
src/components/admin/OfferingsManager.tsx      # Confirmations
src/components/admin/ThemeManager.tsx          # Confirmations
src/components/admin/AuditLog.tsx              # Enhanced display
src/lib/types.ts  # Role types
src/lib/auth.ts   # Role support
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Critical actions with confirmation | 100% |
| Destructive actions logged | 100% |
| Routes with role gates | 100% |
| Test coverage of new code | >80% |
| Zero regressions | Yes |

---

## Sign-Off

This plan requires approval before implementation:

- [ ] Founder review
- [ ] Security review
- [ ] Technical review

---

*Document generated as part of Chain A1: Admin Panel Hardening Audit*
