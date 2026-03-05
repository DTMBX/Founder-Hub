# Release Process

> Version 1.0 | Last Updated: 2026-02-17 | Chain B3

This document defines how releases are cut, signed, verified, and promoted
to production. For quality gates, see [release_gates.md](./release_gates.md).

---

## Release Types

### 1. Greenline Release (Production)

**Definition:** A fully verified, signed production release.

**Tag Format:** `greenline-YYYYMMDD-HHMM`

**Example:** `greenline-20260217-1430`

**Requirements:**
- All release gates passed (see release_gates.md)
- Production environment approval obtained
- Commit signature verified (if configured)
- Release record generated

### 2. Staging Release (Pre-Production)

**Definition:** A candidate release for production validation.

**Tag Format:** `staging-YYYYMMDD-HHMM`

**Requirements:**
- All CI checks passed
- No blocking issues
- Deploy to staging succeeded

### 3. Hotfix Release (Emergency)

**Definition:** An emergency production fix.

**Tag Format:** `hotfix-YYYYMMDD-HHMM`

**Requirements:**
- Fix verified in local/preview
- Abbreviated gate process (critical gates only)
- Post-deployment verification required
- Incident record created

---

## Release Workflow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           FEATURE DEVELOPMENT                            │
│  Branch: feature/* or admin/*                                            │
│  - Commits to feature branch                                             │
│  - Preview deploys automatically                                         │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                             PULL REQUEST                                 │
│  - CI runs: verify, test, build, scan-secrets                           │
│  - CODEOWNERS review required for protected paths                       │
│  - At least 1 approving review                                          │
│  - All status checks must pass                                          │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              MERGE TO MAIN                               │
│  - Squash merge (linear history)                                        │
│  - Commit signature verified (GitHub-signed merge)                      │
│  - Staging auto-deploy triggered                                        │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           STAGING VALIDATION                             │
│  - Staging tag created: staging-YYYYMMDD-HHMM                           │
│  - Smoke tests run                                                       │
│  - Manual QA (if required)                                              │
│  - Staging sign-off checklist                                           │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION APPROVAL                              │
│  ⏸️  Environment protection rule triggered                              │
│  - Owner (@DTMBX) must approve deployment                               │
│  - Approval recorded in GitHub                                          │
│  - Approval audit trail created                                         │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION DEPLOY                                │
│  - Greenline tag created: greenline-YYYYMMDD-HHMM                       │
│  - Release record generated (see below)                                 │
│  - Deploy to production                                                 │
│  - Health check verification                                            │
│  - GitHub Deployment record created                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Release Record

Every Greenline release generates a structured release record:

```json
{
  "release": {
    "tag": "greenline-20260217-1430",
    "version": "1.0.0-greenline.20260217",
    "commitSha": "abc123def456",
    "branch": "main",
    "createdAt": "2026-02-17T14:30:00Z"
  },
  "build": {
    "hash": "sha256:...",
    "manifestHash": "sha256:...",
    "files": 42,
    "totalSize": 1234567
  },
  "deployment": {
    "id": 123456789,
    "environment": "production",
    "url": "https://devon-tyler.com",
    "deployedAt": "2026-02-17T14:32:00Z"
  },
  "approval": {
    "approvedBy": "DTMBX",
    "approvedAt": "2026-02-17T14:29:00Z",
    "method": "GitHub Environment"
  },
  "verification": {
    "signatureVerified": true,
    "checksAllPassed": true,
    "healthCheckPassed": true
  }
}
```

**Storage:**
- Written to `dist/release-record.json` in each production build
- Committed as GitHub Release artifact
- Logged to deployment history

---

## Signature Verification

### GitHub-Signed Merges (Recommended)

GitHub automatically signs merge commits when:
1. Branch protection requires signed commits
2. Merges are performed via GitHub UI or API

The web flow merge signature is:
- **Signed by:** GitHub (noreply@github.com)
- **Verified:** GitHub GPG key

### Manual GPG Signing (Optional)

For direct commits (admin override only):

1. Configure GPG key in Git:
   ```bash
   git config --global user.signingkey YOUR_KEY_ID
   git config --global commit.gpgsign true
   ```

2. Add key to GitHub: Settings → SSH and GPG keys

3. Verify commit locally:
   ```bash
   git verify-commit HEAD
   ```

### Verification in CI

The release workflow verifies commit signatures:

```yaml
- name: Verify commit signature
  run: |
    # Check if commit is verified by GitHub
    VERIFIED=$(gh api repos/${{ github.repository }}/commits/${{ github.sha }} \
      --jq '.commit.verification.verified')
    
    if [ "$VERIFIED" != "true" ]; then
      echo "⚠️ WARNING: Commit is not verified"
      # Note: This is a warning, not a blocker, for GitHub-signed merges
    fi
```

---

## Production Promotion Checklist

Before approving a production deployment:

### Pre-Approval
- [ ] All CI checks passed
- [ ] Staging deployment successful
- [ ] Staging smoke tests passed
- [ ] No blocking issues in GitHub Issues
- [ ] No in-progress hotfixes
- [ ] Deployment window acceptable (Mon-Thu, 9AM-4PM ET recommended)

### Post-Deployment
- [ ] Health check passed
- [ ] Greenline tag created
- [ ] Release record generated
- [ ] No error alerts triggered
- [ ] Key user flows verified

---

## Release Notes Generation

Release notes are auto-generated from PR labels:

| Label | Category |
|-------|----------|
| `feat` | ✨ Features |
| `fix` | 🐛 Bug Fixes |
| `perf` | ⚡ Performance |
| `security` | 🔒 Security |
| `docs` | 📚 Documentation |
| `deps` | 📦 Dependencies |
| `breaking` | ⚠️ Breaking Changes |

### Auto-Generated Format

```markdown
# Release greenline-20260217-1430

## ✨ Features
- Add GitHub App integration (#123)

## 🐛 Bug Fixes  
- Fix form validation edge case (#124)

## 🔒 Security
- Migrate to installation tokens (#125)

---
**Full Changelog:** [greenline-20260216-0900...greenline-20260217-1430](link)
**Commit:** abc123def456
**Deployed:** 2026-02-17T14:32:00Z
```

---

## Rollback Procedure

See [rollback_runbook.md](./rollback_runbook.md) for detailed rollback steps.

**Quick Rollback:**

1. Identify last good Greenline tag:
   ```bash
   git tag | grep greenline | sort -r | head -5
   ```

2. Deploy the previous tag:
   ```bash
   gh workflow run deploy-approval.yml \
     -f environment=production \
     -f ref=greenline-YYYYMMDD-HHMM
   ```

3. Document incident.

---

## Audit Trail

All releases maintain an audit trail:

| Event | Location | Retention |
|-------|----------|-----------|
| PR Approval | GitHub PR | Permanent |
| CI Results | GitHub Actions | 90 days |
| Environment Approval | GitHub Deployments | Permanent |
| Greenline Tag | Git Repository | Permanent |
| Release Record | GitHub Release | Permanent |
| Deploy Logs | Netlify | 30 days |

---

## Emergency Procedures

### Hotfix Process

1. Create `hotfix/description` branch from `main`
2. Implement minimal fix
3. Open PR with `hotfix` label
4. Abbreviated review (can be single reviewer)
5. Merge and deploy with expedited approval
6. Create `hotfix-YYYYMMDD-HHMM` tag

### Bypassing Gates (Emergency Only)

In true emergencies, an admin can:

1. Use workflow dispatch with `skip_tests: true`
2. Document reason in deployment notes
3. Create incident record
4. Follow up with proper fix

**Note:** This should be extremely rare and always documented.

---

## References

- [Release Gates](./release_gates.md)
- [Repo Controls](./repo_controls.md)
- [Rollback Runbook](./rollback_runbook.md)
- [GitHub Commit Signing](https://docs.github.com/en/authentication/managing-commit-signature-verification)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments)
