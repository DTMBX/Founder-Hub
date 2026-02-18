# Git History Remediation Guide

> Evident Technologies — Security Response  
> Created: Phase 2 — `feature/honorbar-security-admin-upgrade`

---

## Purpose

This document provides **step-by-step instructions** for removing secrets from
git history using `git-filter-repo`. These commands rewrite history and are
**destructive** — they must be executed deliberately and never automated
without review.

---

## Prerequisites

- Python 3.6+
- `git-filter-repo` installed: `pip install git-filter-repo`
- A **fresh clone** of the repository (filter-repo requires it)
- All collaborators notified that history will be rewritten
- All open PRs noted (they will need to be rebased)

---

## Prior Remediation (Reference)

The repository was previously cleaned using `git-filter-repo` to replace
Stripe key patterns across all 234 commits:

```
sk_live_... → xk_fake_...
sk_test_... → xk_fake_...
```

This was completed successfully and force-pushed to `origin/main`.

---

## Remediation Steps

> **WARNING:** These commands rewrite ALL commits. This is irreversible.
> Do NOT run these commands without explicit authorization.

### Step 1: Fresh Clone

```bash
git clone --bare <REPO_URL> repo-clean.git
cd repo-clean.git
```

### Step 2: Create Replacement Rules

Create a file named `replacements.txt` with one rule per line.
Format: `literal:OLD_VALUE==>NEW_VALUE`

```
# Example (do NOT paste real secrets here):
literal:sk_live_EXAMPLE_KEY==>xk_fake_REDACTED
literal:AKIA1234567890ABCDEF==>FAKE_AWS_REDACTED
```

### Step 3: Run git-filter-repo

```bash
git filter-repo --replace-text replacements.txt
```

This rewrites every commit that contained the pattern.

### Step 4: Verify the Cleaned History

```bash
# Search for the old pattern — should return nothing
git log --all -p | grep -c "sk_live_"
git log --all -p | grep -c "AKIA"
```

Or use the scan script:

```powershell
.\scripts\security\scan-git-history.ps1
```

### Step 5: Push the Cleaned History

```bash
git push origin --force --all
git push origin --force --tags
```

### Step 6: Notify Collaborators

All collaborators must either:

1. **Re-clone** the repository (recommended), or
2. **Reset** their local branches:
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

### Step 7: Rebase Open PRs

Any open pull requests will have orphaned base commits. They must be rebased
onto the new history.

---

## Alternative: BFG Repo-Cleaner

For simpler cases (removing a single file or string):

```bash
# Remove a file from all history
java -jar bfg.jar --delete-files secrets.env

# Replace a string
java -jar bfg.jar --replace-text replacements.txt

# Then clean and push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## Post-Remediation Verification

After rewriting history, run ALL of these:

| Check                         | Command                                          | Expected |
| ----------------------------- | ------------------------------------------------ | -------- |
| Working tree scan             | `.\scripts\security\scan-working-tree.ps1`       | CLEAN    |
| Git history scan              | `.\scripts\security\scan-git-history.ps1`        | CLEAN    |
| Pre-commit hook               | `git commit --allow-empty -m "test"`             | Pass     |
| CI secret scan                | Push to branch; check workflow                   | Pass     |

---

## What This Does NOT Fix

- **Forks:** If the repo was forked before cleanup, forks retain the old
  history. Contact fork owners or GitHub support.
- **Cached clones:** Anyone who cloned before the rewrite has the old history
  locally. They must re-clone.
- **CI artifacts:** Build logs and artifacts may contain the secret. Check and
  delete them manually.
- **GitHub caches:** GitHub may cache old commits for a period. Contact GitHub
  support to purge if the repo was public.

---

## Related Documentation

- [SECRET_EXPOSURE_RESPONSE.md](SECRET_EXPOSURE_RESPONSE.md) — Full response protocol
- [SECRET_EXPOSURE_TRIAGE.md](SECRET_EXPOSURE_TRIAGE.md) — Initial triage
- `scripts/security/scan-working-tree.ps1` — Working tree scanner
- `scripts/security/scan-git-history.ps1` — History scanner
- `scripts/scan-secrets.mjs` — Pre-commit scanner
