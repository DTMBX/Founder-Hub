# Site Generator + Admin Panel Implementation Plan

**Date:** February 17, 2026  
**Prerequisites:** Audit Report reviewed and approved  
**Estimated Duration:** 6 sprints (12-18 days)

---

## Overview

This plan implements the Site Generator + Admin Panel upgrades in 6 checkpoints. Each checkpoint is independently testable and deployable.

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ROADMAP                        │
├─────────────────────────────────────────────────────────────────┤
│ CP0: Baseline Safety                                             │
│  └─► CP1: Site Registry + Versioning                             │
│       └─► CP2: Create Site Wizard                                │
│            └─► CP3: GitHub Integration                           │
│                 └─► CP4: Publish Gates + Rollback                │
│                      └─► CP5: Embedded Terminal                  │
│                           └─► CP6: Subscription Management       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checkpoint 0: Baseline Safety

**Goal:** Ensure we can run tests, build locally, and have a stable starting point.

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 0.1 | `package.json` | Add `verify` script that checks Node, npm, git versions |
| 0.2 | `scripts/verify-prereqs.mjs` | Check all prerequisites (Node 20+, git, etc.) |
| 0.3 | `vitest.config.ts` | Confirm test environment is configured |
| 0.4 | `.github/workflows/deploy.yml` | Ensure build passes in CI |
| 0.5 | N/A | Run full test suite locally |

### Acceptance Criteria

- [ ] `npm run verify` exits 0 with all prerequisites met
- [ ] `npm test` runs all tests (no regressions)
- [ ] `npm run build` produces dist/ without errors
- [ ] GitHub Actions build passes on main branch

### Test Plan

```bash
npm run verify       # Should output: ✓ All prerequisites met
npm test             # Should pass 27+ tests
npm run build        # Should complete in <60s
```

### Commit Message
```
chore(cp0): add verify script and baseline safety checks
```

---

## Checkpoint 1: Site Registry + Versioning

**Goal:** Implement data model for sites, versions, deployments, and audit events.

### Data Model

```typescript
// src/lib/types.ts additions

/** Represents an immutable snapshot of site state */
export interface SiteVersion {
  versionId: string
  siteId: string
  snapshotData: NormalizedSiteData
  dataHash: string              // SHA-256 of JSON.stringify(snapshotData)
  createdAt: string             // ISO 8601
  createdBy: string             // userId
  label?: string                // e.g., "v1.2.0", "Pre-launch"
  notes?: string
}

/** Site lifecycle state machine */
export type SiteState = 'draft' | 'preview' | 'staging' | 'live'

/** Represents a deployment attempt */
export interface Deployment {
  deploymentId: string
  siteId: string
  versionId: string
  environment: 'preview' | 'staging' | 'production'
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'rolled-back'
  commitSha?: string
  buildHash?: string
  previewUrl?: string
  deployedAt?: string
  deployedBy: string
  approvedBy?: string
  logs: DeploymentLog[]
  errorMessage?: string
}

export interface DeploymentLog {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

/** Extended SiteSummary with versioning */
export interface SiteSummaryV2 extends SiteSummary {
  state: SiteState
  currentVersionId?: string
  liveVersionId?: string
  lastDeploymentId?: string
  deploymentCount: number
}
```

### Storage Keys

```typescript
// src/lib/site-registry.ts additions
export const KEYS = {
  // ... existing keys
  siteVersions: (siteId: string) => `sites:${siteId}:versions`,
  siteVersion: (siteId: string, versionId: string) => `sites:${siteId}:versions:${versionId}`,
  deployments: (siteId: string) => `sites:${siteId}:deployments`,
  deployment: (siteId: string, deploymentId: string) => `sites:${siteId}:deployments:${deploymentId}`,
}
```

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 1.1 | `src/lib/types.ts` | Add SiteVersion, Deployment, DeploymentLog interfaces |
| 1.2 | `src/lib/types.ts` | Add SiteState type and SiteSummaryV2 |
| 1.3 | `src/lib/site-registry.ts` | Add storage keys for versions and deployments |
| 1.4 | `src/lib/site-versioning.ts` | Create versioning service |
| 1.5 | `src/lib/deployment-service.ts` | Create deployment service |
| 1.6 | `src/components/admin/SiteVersions.tsx` | UI for version history |
| 1.7 | `src/components/admin/DeploymentHistory.tsx` | UI for deployment history |
| 1.8 | `src/lib/__tests__/site-versioning.test.ts` | Tests for versioning |
| 1.9 | `src/lib/__tests__/deployment-service.test.ts` | Tests for deployments |

### API Surface

```typescript
// site-versioning.ts
export class SiteVersioningService {
  async createVersion(siteId: string, label?: string): Promise<SiteVersion>
  async getVersions(siteId: string): Promise<SiteVersion[]>
  async getVersion(siteId: string, versionId: string): Promise<SiteVersion | null>
  async compareVersions(v1: string, v2: string): Promise<VersionDiff>
  async restoreVersion(siteId: string, versionId: string): Promise<void>
}

// deployment-service.ts
export class DeploymentService {
  async createDeployment(siteId: string, versionId: string, env: Environment): Promise<Deployment>
  async updateDeploymentStatus(deploymentId: string, status: DeploymentStatus): Promise<void>
  async getDeployments(siteId: string, limit?: number): Promise<Deployment[]>
  async getLatestDeployment(siteId: string, env: Environment): Promise<Deployment | null>
  async rollback(siteId: string, toDeploymentId: string): Promise<Deployment>
}
```

### Acceptance Criteria

- [ ] SiteVersion stores immutable snapshots with SHA-256 hash
- [ ] Deployment tracks status, commit SHA, logs
- [ ] UI shows version history with timestamps
- [ ] UI shows deployment history with status badges
- [ ] Tests pass for versioning and deployment services

### Test Plan

```typescript
// site-versioning.test.ts
describe('SiteVersioningService', () => {
  it('creates version with hash', async () => { ... })
  it('lists versions in reverse chronological order', async () => { ... })
  it('compares two versions', async () => { ... })
  it('restores version to current', async () => { ... })
})
```

### Commit Message
```
feat(cp1): add site versioning and deployment data model
```

---

## Checkpoint 2: Create Site Wizard

**Goal:** Build a 4-step GUI wizard for creating new sites.

### UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ CREATE SITE WIZARD                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Choose Template                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                    │
│  │Law Firm│ │Medical │ │Contrac.│ │Nonprof.│                    │
│  └────────┘ └────────┘ └────────┘ └────────┘                    │
│                                                                  │
│  Step 2: Configure Site                                          │
│  ┌──────────────────────────────────────────┐                    │
│  │ Site Name: [____________________]        │                    │
│  │ Domain: [____________________].com       │                    │
│  │ Admin Email: [____________________]      │                    │
│  │ Theme: [Primary Color] [Secondary]       │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  Step 3: Preview                                                 │
│  ┌──────────────────────────────────────────┐                    │
│  │ [Live preview iframe or screenshots]     │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  Step 4: Confirm & Create                                        │
│  ┌──────────────────────────────────────────┐                    │
│  │ ✓ Site name: Smith Legal                 │                    │
│  │ ✓ Domain: smithlegal.com                 │                    │
│  │ ✓ Template: Law Firm                     │                    │
│  │                                          │                    │
│  │ [Cancel]                    [Create Site]│                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 2.1 | `src/components/admin/CreateSiteWizard.tsx` | Main wizard container |
| 2.2 | `src/components/admin/wizard/TemplateStep.tsx` | Template selection |
| 2.3 | `src/components/admin/wizard/ConfigStep.tsx` | Site configuration form |
| 2.4 | `src/components/admin/wizard/PreviewStep.tsx` | Live preview component |
| 2.5 | `src/components/admin/wizard/ConfirmStep.tsx` | Summary and confirm |
| 2.6 | `src/lib/site-generator.ts` | Client-side site generation |
| 2.7 | `src/components/admin/AdminDashboard.tsx` | Add "Create Site" button |
| 2.8 | Integration | Connect wizard to site-registry |

### Acceptance Criteria

- [ ] User can select from 8 template presets
- [ ] Configuration form validates required fields
- [ ] Preview shows site appearance before creation
- [ ] Confirmation step summarizes all choices
- [ ] Created site appears in Sites list immediately
- [ ] Initial SiteVersion is created automatically

### Test Plan

```typescript
describe('CreateSiteWizard', () => {
  it('navigates through all 4 steps', async () => { ... })
  it('validates required fields', async () => { ... })
  it('creates site on confirmation', async () => { ... })
  it('creates initial version', async () => { ... })
})
```

### Commit Message
```
feat(cp2): add create site wizard with 4-step flow
```

---

## Checkpoint 3: GitHub Integration

**Goal:** Implement GitHub App-based connection with PR workflow.

### Architecture

```
┌─────────────────┐     ┌───────────────────┐     ┌──────────────┐
│   Admin Panel   │────▶│   GitHub App API  │────▶│  Repository  │
│                 │     │ (Installation)    │     │   (main)     │
└─────────────────┘     └───────────────────┘     └──────────────┘
        │                        │                       │
        │                        ▼                       │
        │               ┌───────────────────┐            │
        └──────────────▶│  PR: site-update  │◀───────────┘
                        │  (auto-created)   │
                        └───────────────────┘
                                │
                                ▼
                        ┌───────────────────┐
                        │  Actions: Build   │
                        │  + Preview Deploy │
                        └───────────────────┘
```

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 3.1 | GitHub | Create GitHub App in org (Evident-SiteGen) |
| 3.2 | `src/lib/github-app.ts` | GitHub App authentication service |
| 3.3 | `src/lib/github-app.ts` | Installation token management |
| 3.4 | `src/lib/github-pr.ts` | PR creation and management |
| 3.5 | `src/components/admin/GitHubConnect.tsx` | GitHub connection UI |
| 3.6 | `src/components/admin/GitHubStatus.tsx` | Connection status indicator |
| 3.7 | `.github/workflows/preview-deploy.yml` | PR preview deployment |
| 3.8 | Migrate | Update existing sites to use App |

### GitHub App Permissions Required

```yaml
# App permissions
permissions:
  contents: write      # Push commits
  pull_requests: write # Create/update PRs
  actions: read        # Check workflow status
  deployments: write   # Create deployment records
```

### API Surface

```typescript
// github-app.ts
export class GitHubAppService {
  async getInstallationToken(installationId: number): Promise<string>
  async listInstallations(): Promise<Installation[]>
  async getRepository(installationId: number, repoFullName: string): Promise<Repository>
}

// github-pr.ts
export class GitHubPRService {
  async createBranch(baseBranch: string, newBranch: string): Promise<void>
  async createCommit(branch: string, files: FileChange[], message: string): Promise<string>
  async createPullRequest(title: string, head: string, base: string): Promise<PullRequest>
  async getPullRequestStatus(prNumber: number): Promise<PRStatus>
  async mergePullRequest(prNumber: number): Promise<MergeResult>
}
```

### Acceptance Criteria

- [ ] GitHub App is registered and accessible
- [ ] Admin can connect site to GitHub repo via App installation
- [ ] Edits create a branch and PR automatically
- [ ] PR preview deployment runs on PR creation
- [ ] Installation token is refreshed automatically (expires in 1 hour)

### Test Plan

```typescript
describe('GitHubAppService', () => {
  it('retrieves installation token', async () => { ... })
  it('creates branch from main', async () => { ... })
  it('creates commit with file changes', async () => { ... })
  it('creates pull request', async () => { ... })
})
```

### Commit Message
```
feat(cp3): add GitHub App integration with PR workflow
```

---

## Checkpoint 4: Publish Gates + Rollback

**Goal:** Implement approval workflow and one-click rollback.

### State Machine

```
             ┌─────────┐
             │  DRAFT  │
             └────┬────┘
                  │ save-draft
                  ▼
             ┌─────────┐
             │ PREVIEW │◀──────────────┐
             └────┬────┘               │
                  │ approve-preview    │
                  ▼                    │
             ┌─────────┐               │
             │ STAGING │               │ (rollback)
             └────┬────┘               │
                  │ approve-staging    │
                  ▼                    │
             ┌─────────┐               │
             │  LIVE   │───────────────┘
             └─────────┘
```

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 4.1 | `src/lib/publish-workflow.ts` | State machine implementation |
| 4.2 | `src/lib/publish-workflow.ts` | Approval requirements checker |
| 4.3 | `src/lib/publish-workflow.ts` | Rollback implementation |
| 4.4 | `src/components/admin/PublishPanel.tsx` | Publish controls UI |
| 4.5 | `src/components/admin/ApprovalDialog.tsx` | Approval confirmation |
| 4.6 | `src/components/admin/RollbackDialog.tsx` | Rollback confirmation |
| 4.7 | `.github/workflows/deploy.yml` | Add environment approvals |
| 4.8 | Tests | Publish workflow tests |

### API Surface

```typescript
// publish-workflow.ts
export class PublishWorkflow {
  async getState(siteId: string): Promise<SiteState>
  async canTransition(siteId: string, toState: SiteState): Promise<TransitionCheck>
  async transition(siteId: string, toState: SiteState, actor: string): Promise<void>
  
  async saveDraft(siteId: string): Promise<SiteVersion>
  async createPreview(siteId: string): Promise<Deployment>
  async promoteToStaging(siteId: string, approver: string): Promise<Deployment>
  async publishLive(siteId: string, approver: string): Promise<Deployment>
  
  async rollback(siteId: string, toVersionId: string): Promise<Deployment>
  async getRollbackImpact(siteId: string, toVersionId: string): Promise<RollbackImpact>
}

export interface RollbackImpact {
  currentVersion: SiteVersion
  targetVersion: SiteVersion
  changedFiles: string[]
  warningMessage?: string
}
```

### Acceptance Criteria

- [ ] Sites have clear DRAFT/PREVIEW/STAGING/LIVE status
- [ ] Preview creates build artifact and preview URL
- [ ] Staging requires explicit approval
- [ ] Production requires confirmation dialog
- [ ] Rollback shows what will change before executing
- [ ] Rollback is one-click with immediate effect
- [ ] All state transitions are logged in audit trail

### Test Plan

```typescript
describe('PublishWorkflow', () => {
  it('transitions through states in order', async () => { ... })
  it('prevents skipping states', async () => { ... })
  it('records audit events on transitions', async () => { ... })
  it('rollback restores previous version', async () => { ... })
  it('rollback impact shows changed files', async () => { ... })
})
```

### Commit Message
```
feat(cp4): add publish gates and one-click rollback
```

---

## Checkpoint 5: Embedded Terminal

**Goal:** Build controlled PowerShell terminal in admin panel.

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     ADMIN PANEL                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    TERMINAL VIEW                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ $ site list                                      │  │  │
│  │  │ Sites (3):                                       │  │  │
│  │  │   smith-legal     [LIVE]   smithlegal.com       │  │  │
│  │  │   jones-medical   [PREVIEW] jonesmed.com        │  │  │
│  │  │   acme-services   [DRAFT]   acme-services.com   │  │  │
│  │  │                                                  │  │  │
│  │  │ $ site use smith-legal                           │  │  │
│  │  │ ✓ Switched to smith-legal (c:\sites\smith-legal) │  │  │
│  │  │                                                  │  │  │
│  │  │ $ site status                                    │  │  │
│  │  │ Site: smith-legal                                │  │  │
│  │  │ State: LIVE                                      │  │  │
│  │  │ Version: v1.2.0 (abc123)                         │  │  │
│  │  │ Domain: smithlegal.com                           │  │  │
│  │  │ Last Deploy: 2026-02-15 14:30:00                 │  │  │
│  │  │                                                  │  │  │
│  │  │ $ _                                              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Command Allowlist

```typescript
const ALLOWED_COMMANDS = [
  'site list',
  'site use <slug>',
  'site status',
  'site build',
  'site test',
  'site preview',
  'site deploy --env preview|staging|prod',
  'site logs --tail',
  'site rollback --to <versionId>',
  'site versions',
  'git status',          // read-only
  'git log -n 20',       // read-only
  'help',
  'clear',
] as const
```

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 5.1 | `tools/admin-cli/` | Create PowerShell scripts directory |
| 5.2 | `tools/admin-cli/Site-List.ps1` | List sites command |
| 5.3 | `tools/admin-cli/Site-Use.ps1` | Switch site context |
| 5.4 | `tools/admin-cli/Site-Status.ps1` | Show site status |
| 5.5 | `tools/admin-cli/Site-Build.ps1` | Trigger build |
| 5.6 | `tools/admin-cli/Site-Deploy.ps1` | Deploy to environment |
| 5.7 | `tools/admin-cli/Site-Rollback.ps1` | Rollback command |
| 5.8 | `src/lib/terminal-dispatcher.ts` | Command dispatcher |
| 5.9 | `src/components/admin/Terminal.tsx` | xterm.js terminal UI |
| 5.10 | `src/components/admin/TerminalProvider.tsx` | Terminal state context |
| 5.11 | Tests | Terminal security tests |

### Security Implementation

```typescript
// terminal-dispatcher.ts
export class TerminalDispatcher {
  private allowlist: CommandPattern[]
  private currentSiteRoot: string | null = null
  private rateLimiter: RateLimiter
  
  constructor() {
    this.allowlist = parseAllowlist(ALLOWED_COMMANDS)
    this.rateLimiter = new RateLimiter({ maxPerMinute: 10 })
  }
  
  async execute(command: string): Promise<CommandResult> {
    // 1. Rate limit check
    if (!this.rateLimiter.allow()) {
      return { error: 'Rate limit exceeded. Wait 60 seconds.' }
    }
    
    // 2. Parse and validate against allowlist
    const parsed = this.parseCommand(command)
    if (!this.isAllowed(parsed)) {
      return { error: `Command not allowed: ${parsed.cmd}` }
    }
    
    // 3. Execute via PowerShell script
    const result = await this.runScript(parsed)
    
    // 4. Redact secrets from output
    return this.redact(result)
  }
  
  private redact(result: CommandResult): CommandResult {
    // Remove tokens, API keys, passwords
    const patterns = [
      /ghp_[a-zA-Z0-9]{36}/g,     // GitHub PAT
      /sk_[a-zA-Z0-9_]+/g,        // Stripe keys
      /password[=:]\s*\S+/gi,     // Password patterns
    ]
    // ... redaction logic
  }
}
```

### Acceptance Criteria

- [ ] Terminal renders with xterm.js
- [ ] `site list` shows all sites with status
- [ ] `site use <slug>` switches working context
- [ ] `site status` shows detailed site info
- [ ] `site deploy --env preview` triggers deployment
- [ ] Disallowed commands are blocked with clear message
- [ ] Output is redacted of secrets
- [ ] Rate limiting works (10 commands/minute)
- [ ] Each command is logged in audit trail

### Test Plan

```typescript
describe('TerminalDispatcher', () => {
  it('allows site list command', async () => { ... })
  it('blocks arbitrary shell commands', async () => { ... })
  it('redacts GitHub tokens from output', async () => { ... })
  it('enforces rate limit', async () => { ... })
  it('sets working directory on site use', async () => { ... })
})
```

### Commit Message
```
feat(cp5): add embedded terminal with allowlist security
```

---

## Checkpoint 6: Subscription Management

**Goal:** Add plan tiers, subscription status, and managed sites view.

### Data Model Updates

```typescript
// src/lib/types.ts additions

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export interface SiteSubscription {
  siteId: string
  planTier: PlanTier
  status: SubscriptionStatus
  stripeSubscriptionId?: string
  currentPeriodStart: string
  currentPeriodEnd: string
  renewalDate: string
  lastPaymentDate?: string
  lastPaymentAmount?: number  // cents
  cancelAtPeriodEnd: boolean
}

export interface SiteSummaryV3 extends SiteSummaryV2 {
  subscription?: SiteSubscription
}
```

### Tasks

| Task | File(s) | Description |
|------|---------|-------------|
| 6.1 | `src/lib/types.ts` | Add subscription types |
| 6.2 | `src/lib/subscription-service.ts` | Subscription management |
| 6.3 | `src/components/admin/ManagedSites.tsx` | Filtered sites view |
| 6.4 | `src/components/admin/SubscriptionCard.tsx` | Per-site subscription UI |
| 6.5 | `src/components/admin/BillingManager.tsx` | Update with subscriptions |
| 6.6 | Stripe webhook | Handle subscription events |

### UI: Managed Sites View

```
┌─────────────────────────────────────────────────────────────────┐
│ MANAGED SITES                                                    │
│                                                                  │
│ [All] [Active: 12] [Past Due: 2] [Canceled: 1] [Trialing: 3]    │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Smith Legal               [PRO]  [ACTIVE]                │   │
│ │ smithlegal.com           Last payment: $99/mo on Feb 1   │   │
│ │ Renews: Mar 1, 2026      [View] [Manage Subscription]    │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Jones Medical             [STARTER]  [PAST DUE]          │   │
│ │ jonesmed.com             Payment failed: Feb 10          │   │
│ │ ⚠️ Action required        [View] [Update Payment]        │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria

- [ ] Sites have planTier and subscriptionStatus fields
- [ ] ManagedSites view with status filters
- [ ] Status badges: Active (green), Past Due (amber), Canceled (red)
- [ ] Renewal date displayed prominently
- [ ] Stripe webhook updates subscription status
- [ ] Past due sites are flagged for follow-up

### Test Plan

```typescript
describe('SubscriptionService', () => {
  it('creates subscription for site', async () => { ... })
  it('handles stripe webhook for payment succeeded', async () => { ... })
  it('handles stripe webhook for payment failed', async () => { ... })
  it('filters sites by subscription status', async () => { ... })
})
```

### Commit Message
```
feat(cp6): add subscription management and managed sites view
```

---

## Operator Documentation

### How to Onboard a New Site

1. Open Admin Panel → Sites → Create Site
2. Select template (Law Firm, Medical, etc.)
3. Fill in site configuration (name, domain, admin email)
4. Review preview
5. Click "Create Site" → site is saved as DRAFT
6. Edit content in admin panel
7. Click "Save Draft" to create a version
8. Click "Create Preview" to build and get preview URL
9. Review preview, then "Promote to Staging"
10. Final review, then "Publish Live"

### How to Publish Safely

1. All changes start in DRAFT state
2. "Save Draft" creates a versioned snapshot (SiteVersion)
3. "Create Preview" builds the site and deploys to preview URL
4. "Promote to Staging" requires approval (shows diff from live)
5. "Publish Live" requires confirmation dialog
6. Deployment record tracks: commit SHA, build hash, deployer, approver

### How to Rollback

1. Go to Site → Deployments
2. Find the LIVE deployment you want to restore
3. Click "Rollback to This Version"
4. Dialog shows: "This will revert 5 files changed since v1.1.0"
5. Click "Confirm Rollback"
6. New deployment is created with status "rolled-back"
7. Site is immediately restored to previous state

### Terminal Security Notes

- Terminal only accepts commands from allowlist
- All commands are logged in audit trail
- Output is redacted of: GitHub tokens, Stripe keys, passwords
- Rate limited to 10 commands per minute
- Per-site working directory is enforced
- Cannot execute arbitrary shell commands

---

## Summary

| Checkpoint | Priority | Effort | Dependencies |
|------------|----------|--------|--------------|
| CP0: Baseline Safety | P0 | 2h | None |
| CP1: Site Registry + Versioning | P0 | 8h | CP0 |
| CP2: Create Site Wizard | P1 | 8h | CP1 |
| CP3: GitHub Integration | P1 | 12h | CP1 |
| CP4: Publish Gates + Rollback | P0 | 10h | CP1, CP3 |
| CP5: Embedded Terminal | P1 | 16h | CP1 |
| CP6: Subscription Management | P2 | 8h | CP1 |

**Total Estimated Effort:** ~64 hours (8 working days)

---

*Plan generated by AI engineering agent. Review with team before implementation.*
