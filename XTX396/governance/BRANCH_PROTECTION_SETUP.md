# Branch Protection Setup Guide

> This document provides instructions for configuring GitHub branch protection rules.

## Required Settings for `main` Branch

Navigate to: **Settings → Branches → Add rule**

### Branch name pattern
```
main
```

### Protect matching branches

#### Require a pull request before merging
- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners
  - [ ] Restrict who can dismiss pull request reviews

#### Require status checks to pass before merging
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `build`
    - `test`
    - `lint`
    - `security-scan`
    - `required-checks`

#### Require conversation resolution before merging
- [x] **Require conversation resolution before merging**

#### Require signed commits
- [ ] Require signed commits (optional, recommended for stricter security)

#### Require linear history
- [x] **Require linear history** (enforces squash or rebase merges)

#### Do not allow bypassing the above settings
- [x] **Do not allow bypassing the above settings** (including administrators)

#### Restrict who can push to matching branches
- [x] **Restrict who can push to matching branches**
  - Allow: `@DTMBX` (or your admin team)

#### Rules applied to everyone including administrators
- [x] **Lock branch** - NO
- [x] **Allow force pushes** - NO
- [x] **Allow deletions** - NO

---

## Settings for `staging` Branch

### Branch name pattern
```
staging
```

### Settings
- [x] Require a pull request before merging
  - Require approvals: **1**
- [x] Require status checks: `build`, `test`
- [x] Require linear history
- [ ] Do not allow bypassing (allow admins to bypass for emergencies)

---

## Settings for `develop` Branch

### Branch name pattern
```
develop
```

### Settings
- [ ] Require a pull request (optional for develop)
- [x] Require status checks: `build`, `test`
- [ ] Allow force pushes: NO

---

## Enabling Secret Scanning

Navigate to: **Settings → Code security and analysis**

### Secret scanning
- [x] **Enable secret scanning**
- [x] **Push protection** - Block commits containing secrets

### Dependabot
- [x] **Dependabot alerts** - Enabled
- [x] **Dependabot security updates** - Enabled
- [x] **Dependabot version updates** - Enabled (configured via `dependabot.yml`)

### Code scanning
- [x] **CodeQL analysis** - Recommended
- Tools: Semgrep, Trufflehog (configured in CI workflow)

---

## Environment Protection Rules

Navigate to: **Settings → Environments**

### Preview Environment
- **Name:** `preview`
- **Deployment branches:** All branches
- **Required reviewers:** None
- **Wait timer:** None

### Staging Environment
- **Name:** `staging`
- **Deployment branches:** `staging`, `main`
- **Required reviewers:** None (or 1 for extra safety)
- **Wait timer:** None

### Production Environment
- **Name:** `production`
- **Deployment branches:** `main` only
- **Required reviewers:** 1 (select admin users)
- **Wait timer:** 0-5 minutes (optional cooling off period)
- **Environment secrets:**
  - `NETLIFY_AUTH_TOKEN`
  - `NETLIFY_SITE_ID`

---

## Rulesets (Alternative to Branch Protection)

For GitHub Enterprise or advanced needs, consider using **rulesets**:

Navigate to: **Settings → Rules → Rulesets**

Benefits of rulesets:
- Can apply to multiple branches with patterns
- More granular control
- Easier to manage at organization level
- Support for bypass lists

---

## Verification Checklist

After configuring, verify:

- [ ] Cannot push directly to `main`
- [ ] PR requires at least 1 approval
- [ ] Status checks must pass before merge
- [ ] Force push is blocked
- [ ] Secret scanning is active
- [ ] Dependabot is creating PRs for updates
- [ ] Environment approvals work for production

---

## Troubleshooting

### "Required status check not found"
Ensure the CI workflow has run at least once. Status checks are only available after first run.

### "This branch is protected"
Expected behavior. Create a PR instead of pushing directly.

### "Merge blocked by required review"
Request a review from a code owner or team member.

### Bypass for emergencies
1. Admin with bypass permission merges
2. Document the bypass in incident ticket
3. Post-merge review required within 24 hours
