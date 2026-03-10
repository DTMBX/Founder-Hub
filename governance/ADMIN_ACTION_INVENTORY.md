# Admin Action Inventory

> Chain A1 Deliverable — Admin Panel Hardening Audit  
> Generated: 2025-01-XX  
> Status: AUDIT COMPLETE — Awaiting Implementation

---

## Overview

This document provides a complete inventory of all admin panel routes, components, and actions. Each action is classified by priority (P0–P3) and security risk level.

---

## Navigation Structure

### Category 1: Founder-Hub Site (7 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `content` | Content | ContentManager | **P0** Daily | Low |
| `about` | About | AboutManager | P1 Weekly | Low |
| `links` | Links | LinksManager | P1 Weekly | Low |
| `profile` | Profile | ProfileManager | P1 Weekly | Low |
| `hero-media` | Hero Media | HeroMediaManager | P2 Rare | Low |
| `visual-modules` | Visual Modules | VisualModulesManager | P2 Rare | Low |
| `honor-flag-bar` | Honor Flag Bar | HonorFlagBarManager | P2 Rare | Low |

### Category 2: Investor & Trade (2 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `investor` | Investor | InvestorManager | P1 Weekly | Medium |
| `offerings` | Offerings | OfferingsManager | P1 Weekly | Medium |

### Category 3: Evident Platform (2 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `evident` | Evident | EvidentManager | P1 Weekly | Low |
| `sites` | Sites | SitesManager | **P0** Daily | **High** |

### Category 4: Frameworks (4 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `client-sites` | Client Sites | ClientSiteManager | P1 Weekly | Medium |
| `law-firm` | Law Firm | LawFirmShowcaseManager | P2 Rare | Low |
| `smb-template` | SMB Template | SMBTemplateManager | P2 Rare | Medium |
| `agency` | Agency | AgencyFrameworkManager | P2 Rare | Low |

### Category 5: Case Management (6 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `projects` | Projects | ProjectsManager | **P0** Daily | Medium |
| `court` | Court | CourtManager | P1 Weekly | Medium |
| `documents` | Documents | DocumentsManager | P1 Weekly | Medium |
| `case-jackets` | Case Jackets | CaseJacketManager | P1 Weekly | Medium |
| `filing-types` | Filing Types | FilingTypesManager | P2 Rare | Low |
| `templates` | Templates | TemplatesManager | P2 Rare | Low |

### Category 6: Assets (6 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `inbox` | Inbox | AdminInbox | **P0** Daily | Low |
| `upload` | Upload Queue | UploadQueueManager | **P0** Daily | **High** |
| `staging` | Staging | StagingReviewManager | P1 Weekly | **High** |
| `assets` | Assets | MediaManager | P1 Weekly | Medium |
| `asset-policy` | Asset Policy | AssetUsagePolicyManager | P2 Rare | Low |
| *(scanner)* | *(embedded)* | AssetScanner | P2 Rare | Low |

### Category 7: System (5 routes)

| Route ID | Label | Component | Classification | Risk Level |
|----------|-------|-----------|----------------|------------|
| `theme` | Theme | ThemeManager | P2 Rare | Low |
| `settings` | Settings | SettingsManager | P2 Rare | **Critical** |
| `security` | Security | SecurityManager | P2 Rare | **Critical** |
| `audit` | Audit Log | AuditLog | P1 Weekly | Low |
| `leads` | Leads | LeadsManager | **P0** Daily | Medium |

---

## Global Actions (Sidebar Footer)

| Action | Handler | Location | Classification | Risk Level | Confirmation |
|--------|---------|----------|----------------|------------|--------------|
| **Publish to Live** | `handlePublish()` | AdminDashboard | **P0** Daily | **Critical** | None |
| **Export Data** | `downloadDataFiles()` | AdminDashboard | P1 Weekly | **Critical** | None |
| **Public Site** | Navigation | AdminDashboard | P0 Daily | None | None |
| **Logout** | `handleLogout()` | AdminDashboard | P0 Daily | Low | None |

---

## Destructive Actions Inventory

### Critical Severity (Data Loss / Exfiltration)

| Component | Action | Handler | Current Confirmation | Risk |
|-----------|--------|---------|---------------------|------|
| AdminDashboard | Publish to Live | `handlePublish()` | **None** | Pushes to production |
| AdminDashboard | Export Data | `downloadDataFiles()` | **None** | Full data exfil |
| SettingsManager | Clear GitHub Token | `handleClearToken()` | **None** | Breaks deployment |
| SettingsManager | Disable USB Keyfile | `handleDisableKeyfile()` | **None** | Weakens auth |
| TwoFactorSetup | Disable 2FA | `disable2FA()` | **None** | Deletes backup codes |
| TwoFactorSetup | Regenerate Backup Codes | `regenerateBackupCodes()` | **None** | Invalidates existing |

### High Severity (Destructive with Partial Recovery)

| Component | Action | Handler | Current Confirmation | Risk |
|-----------|--------|---------|---------------------|------|
| SitesManager | Delete Site | `handleDeleteSite()` | `confirm()` | Deletes site config |
| SitesManager | Delete Satellite | `handleDeleteSatellite()` | `confirm()` | Deletes satellite app |
| StagingReviewManager | Delete Document | `handleDeleteDoc()` | `confirm()` | Deletes staged doc |
| UploadQueueManager | Clear All | `handleClearAll()` | `confirm()` | Clears upload queue |
| ProjectsManager | Delete Project | `handleDelete()` | `confirm()` | Deletes project |
| OfferingsManager | Delete Offering | `handleDelete()` | `confirm()` | Deletes offering |
| SMBTemplateManager | Delete Template | `crudDelete()` | `confirm()` | Deletes template |

### Medium Severity (Reversible / Low Impact)

| Component | Action | Handler | Current Confirmation | Risk |
|-----------|--------|---------|---------------------|------|
| ThemeManager | Reset to Defaults | `handleReset()` | **None** | Resets theme |
| UploadQueueManager | Clear Completed | `handleClearCompleted()` | **None** | Clears completed |
| UploadQueueManager | Remove Item | `handleRemove()` | **None** | Removes queue item |
| ProjectsManager | Remove Link | `handleRemoveLink()` | **None** | Removes project link |

---

## Security Risk Classifications

### Risk Level: Critical

Actions that can:
- Expose credentials or secrets
- Push unauthorized code to production
- Disable authentication mechanisms
- Export all system data

**Components with Critical Risk:**
1. `SettingsManager` — GitHub token storage, keyfile auth
2. `SecurityManager` — Password change, 2FA management
3. `AdminDashboard` — Publish, Export actions

### Risk Level: High

Actions that can:
- Delete important configuration
- Remove evidence or documents
- Clear audit-relevant data

**Components with High Risk:**
1. `SitesManager` — Site/satellite deletion
2. `StagingReviewManager` — Document deletion
3. `UploadQueueManager` — Queue clearing

### Risk Level: Medium

Actions that can:
- Modify investor-facing content
- Change project configurations
- Affect client deliverables

**Components with Medium Risk:**
1. `OfferingsManager` — Investment content
2. `InvestorManager` — Investor relations
3. `ProjectsManager` — Project data

### Risk Level: Low

Actions that are:
- Reversible through re-entry
- Cosmetic or presentational
- Read-only or viewing

**Components with Low Risk:**
1. `ContentManager` — Text content
2. `ThemeManager` — Visual theming
3. `AuditLog` — Read-only viewing

---

## Authentication & Access Control

### Current State

| Mechanism | Status | Location |
|-----------|--------|----------|
| Password Auth | Active | `useAuth` hook |
| 2FA (TOTP) | Optional | `TwoFactorSetup` |
| Hardware Key | Optional | `HardwareKeySetup` |
| USB Keyfile | Optional | `SettingsManager` |
| Session Timeout | Not implemented | — |
| Role-Based Access | Not implemented | — |
| Rate Limiting | Not implemented | — |

### Gaps Identified

1. **No role separation** — All authenticated users have full admin access
2. **No session timeout** — Sessions persist indefinitely
3. **No rate limiting** — Brute force possible on 2FA backup codes
4. **Weak confirmations** — Most destructive actions use only `confirm()` or nothing
5. **No audit for critical actions** — Publish/Export not logged

---

## Component Count Summary

| Category | Count | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| Founder-Hub Site | 7 | 1 | 3 | 3 | 0 |
| Investor & Trade | 2 | 0 | 2 | 0 | 0 |
| Evident Platform | 2 | 1 | 1 | 0 | 0 |
| Frameworks | 4 | 0 | 1 | 3 | 0 |
| Case Management | 6 | 1 | 3 | 2 | 0 |
| Assets | 6 | 2 | 2 | 2 | 0 |
| System | 5 | 1 | 1 | 3 | 0 |
| **TOTAL** | **32** | **6** | **13** | **13** | **0** |

---

## Manager Component File List (41 files)

```
src/components/admin/
├── AboutManager.tsx
├── AdminDashboard.tsx
├── AdminInbox.tsx
├── AdminLogin.tsx
├── AgencyFrameworkManager.tsx
├── AssetScanner.tsx
├── AssetUsagePolicyManager.tsx
├── AuditLog.tsx
├── CaseJacketManager.tsx
├── ClientSiteManager.tsx
├── ContentManager.tsx
├── CourtManager.tsx
├── DeploymentsPanel.tsx
├── DocumentsManager.tsx
├── EnhancedCourtManager.tsx
├── EnhancedProjectsManager.tsx
├── EvidentManager.tsx
├── FilingTypesManager.tsx
├── HardwareKeySetup.tsx
├── HeroMediaManager.tsx
├── HonorFlagBarManager.tsx
├── InvestorManager.tsx
├── LawFirmShowcaseManager.tsx
├── LinksManager.tsx
├── MediaManager.tsx
├── OfferingsManager.tsx
├── PresetSelector.tsx
├── ProfileManager.tsx
├── ProjectsManager.tsx
├── SecurityManager.tsx
├── SettingsManager.tsx
├── SitePicker.tsx
├── SitesManager.tsx
├── SiteVersionsPanel.tsx
├── SMBTemplateManager.tsx
├── StagingReviewManager.tsx
├── TemplatesManager.tsx
├── ThemeManager.tsx
├── TwoFactorSetup.tsx
├── UploadQueueManager.tsx
└── VisualModulesManager.tsx
```

---

## Next Steps

1. Review `ADMIN_MINIMAL_NAV_SPEC.md` for navigation redesign
2. Review `HARDENING_PRUNING_PLAN.md` for implementation plan
3. Implement hardening changes per acceptance criteria

---

*Document generated as part of Chain A1: Admin Panel Hardening Audit*
