# Repository Controls — Branch Protection & Governance

**Chain B1 — GitHub Governance Baseline**

This document specifies the branch protection rules, CODEOWNERS configuration,
and environment-based deployment gates required for the XTX396 repository.

---

## Branch Protection Rules

### `main` Branch

The `main` branch is protected with the following rules:

| Rule | Setting | Rationale |
|------|---------|-----------|
| **Require pull request before merging** | ✅ Enabled | No direct pushes allowed |
| **Required approving reviews** | 1 | All changes require Owner review |
| **Dismiss stale reviews** | ✅ Enabled | Re-review required after new commits |
| **Require review from CODEOWNERS** | ✅ Enabled | Security-sensitive paths require Owner |
| **Require status checks to pass** | ✅ Enabled | CI must pass before merge |
| **Required status checks** | `verify`, `test`, `build`, `scan-secrets` | Core quality gates |
| **Require branches to be up to date** | ✅ Enabled | Force rebase before merge |
| **Require signed commits** | 🔄 Optional | Recommended for production |
| **Require linear history** | ✅ Enabled | Clean commit history |
| **Do not allow bypassing settings** | ✅ Enabled | Even admins follow rules |
| **Restrict force pushes** | ✅ Blocked | History immutable |
| **Restrict deletions** | ✅ Blocked | Branch cannot be deleted |

### Status Checks

The following status checks must pass before merge:

1. **verify** — Runs `npm run verify` (lint, type-check, format)
2. **test** — Runs `npm run test` (unit tests)
3. **build** — Runs `npm run build` (production build)
4. **scan-secrets** — Runs `npm run scan:secrets` (secret detection)

### Configuration via GitHub CLI

```bash
# Set branch protection for main
gh api repos/DTMBX/XTX396/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["verify","test","build","scan-secrets"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

---

## CODEOWNERS Configuration

Location: `/.github/CODEOWNERS`

### Owner-Required Paths

The following paths require **Owner (@DTMBX) review** for all changes:

| Path | Category |
|------|----------|
| `/governance/**` | Governance & Policy |
| `/.github/**` | CI/CD & Workflows |
| `/SECURITY.md` | Security Policy |
| `/CODEOWNERS` | Code Ownership |
| `/src/lib/auth.ts` | Authentication |
| `/src/lib/secret-vault.ts` | Secret Management |
| `/src/lib/redaction.ts` | Data Redaction |
| `/src/lib/permissions.ts` | Authorization |
| `/src/lib/route-guards.ts` | Route Protection |
| `/src/lib/feature-flags.ts` | Feature Gating |
| `/src/lib/destructive-action-safety.ts` | Destructive Actions |
| `/src/lib/deploy-tracking.ts` | Deployment Tracking |
| `/src/lib/github-sync.ts` | GitHub Integration |
| `/scripts/scan-secrets.mjs` | Secret Scanning |
| `/src/billing/**` | Payment Processing |
| `/src/terminal/**` | Terminal Access |

### Enforcement

- GitHub requires CODEOWNERS review when enabled in branch protection
- Reviews from non-CODEOWNERS do not satisfy the requirement
- All paths default to @DTMBX ownership

---

## GitHub Environments

Three environments are configured for deployment:

### 1. `preview`

- **Purpose:** PR preview deployments
- **URL Pattern:** `pr-<number>.preview.devon-tyler.com` or Netlify deploy preview
- **Triggers:** Pull request opened/synchronized
- **Approval Required:** ❌ No
- **Secrets:** Limited (no production secrets)
- **Deployment Limit:** None

### 2. `staging`

- **Purpose:** Pre-production validation
- **URL:** `staging.devon-tyler.com`
- **Triggers:** Push to `staging` branch or manual dispatch
- **Approval Required:** ❌ No (auto-deploys)
- **Secrets:** Staging credentials only
- **Deployment Limit:** 1 concurrent

### 3. `production`

- **Purpose:** Live site deployment
- **URL:** `devon-tyler.com`
- **Triggers:** Push to `main` or manual dispatch
- **Approval Required:** ✅ **Yes — Owner role required**
- **Secrets:** Production credentials
- **Deployment Limit:** 1 concurrent
- **Wait Timer:** 0 (immediate after approval)

### Environment Protection Rules

```yaml
# production environment
protection_rules:
  - type: required_reviewers
    reviewers:
      - type: User
        id: DTMBX  # Owner account
  - type: wait_timer
    wait_timer: 0  # No delay after approval
  - type: branch_policy
    branches:
      - main
```

### Configuration via GitHub UI

1. Navigate to **Settings > Environments**
2. Create/edit `production` environment
3. Add protection rule: **Required reviewers** → Add @DTMBX
4. Enable **Deployment branches** → **Selected branches** → `main`

---

## Deployment Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                PR OPENED                                     │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  CI: verify → test → build → scan-secrets                                    │
│  (All must pass)                                                             │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PREVIEW DEPLOY                                                              │
│  - Auto-deploys to pr-<number> URL                                          │
│  - No approval required                                                      │
│  - Manifest generated with build hash                                        │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  CODE REVIEW                                                                 │
│  - CODEOWNERS review required for protected paths                           │
│  - At least 1 approving review                                              │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  MERGE TO MAIN                                                               │
│  - Squash merge (linear history)                                            │
│  - Branch must be up to date                                                │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOY                                                           │
│  - ⏸️  PAUSED — Waiting for environment approval                            │
│  - Owner (@DTMBX) must approve in GitHub                                    │
│  - Deployment records commit SHA + build hash                               │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  LIVE                                                                        │
│  - Deployed to devon-tyler.com                                                   │
│  - Git tag: deploy-prod-<sha>                                               │
│  - Deployment record created via GitHub API                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Audit & Compliance

### Deployment Records

Every deployment creates:

1. **Git Tag:** `deploy-prod-<short-sha>` for production deploys
2. **GitHub Deployment:** Via Deployments API with status updates
3. **Manifest:** `manifest.json` with file hashes and build metadata
4. **Local Record:** In `deploy-tracking.ts` storage (admin panel)

### Review Trail

All code changes maintain:

1. **PR History:** Who approved, when, what comments
2. **Commit Signatures:** (If enabled) cryptographic verification
3. **CODEOWNERS Attribution:** Which owners reviewed protected paths
4. **CI Logs:** Test results, build artifacts, scan reports

### Rollback Procedure

1. Identify target commit SHA from deployment history
2. Create hotfix branch from that commit
3. Open PR (bypasses normal review for emergencies only if admin)
4. Deploy with expedited review

---

## Manual Setup Checklist

- [ ] Enable branch protection via GitHub Settings or CLI
- [ ] Verify CODEOWNERS file is in `.github/CODEOWNERS`
- [ ] Create `preview` environment (no protection rules)
- [ ] Create `staging` environment (no protection rules)
- [ ] Create `production` environment with required reviewer (@DTMBX)
- [ ] Test PR → Preview deploy flow
- [ ] Test Merge → Production approval flow
- [ ] Verify direct push to main is blocked

---

## Workflow Architecture

### Primary Workflow: `deploy-approval.yml`

- **Triggers:** Push to main, push to staging, PR events, manual dispatch
- **Purpose:** All automated deployments with environment gates
- **Flow:**
  1. Determines target environment from branch/event
  2. Builds and tests
  3. Deploys to appropriate environment (preview/staging/production)
  4. Production deploys require environment approval

### Fallback Workflow: `deploy.yml`

- **Triggers:** Manual dispatch only (workflow_dispatch)
- **Purpose:** Emergency manual deploys
- **Safety:** Requires typing "DEPLOY" to confirm
- **Note:** Does NOT auto-trigger on push to main

This architecture ensures:
- All production deploys route through environment approval gates
- Manual fallback exists for emergencies
- No duplicate deploys on push to main

---

## References

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CODEOWNERS Syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Deployment API](https://docs.github.com/en/rest/deployments)
