# Secret Exposure Response Protocol

> Evident Technologies — Security Response  
> Created: Phase 2 — `feature/honorbar-security-admin-upgrade`

---

## Purpose

This document defines the **mandatory response steps** when a secret or
credential is suspected to have been exposed in the repository — whether in
the working tree, git history, CI logs, or any external surface.

---

## Severity Classification

| Level    | Definition                                         | Response Time |
| -------- | -------------------------------------------------- | ------------- |
| Critical | Production key / PII exposed in public history     | Immediate     |
| High     | Test key exposed; production key in private branch  | < 1 hour      |
| Medium   | Pattern detected but value is placeholder / fake    | < 24 hours    |
| Low      | Filename match only; no actual secret content       | Next sprint   |

---

## Response Checklist

### 1. Contain — Stop the Leak

- [ ] Identify the exact secret type and scope (file, commit range, branches)
- [ ] Determine if the repository is public or has been public
- [ ] If public: assume the secret is compromised — proceed to rotation

### 2. Rotate — Invalidate the Secret

- [ ] **API Keys:** Regenerate in the provider dashboard (Stripe, AWS, etc.)
- [ ] **Tokens:** Revoke the token and issue a new one
- [ ] **Passwords:** Change the password; update all dependent services
- [ ] **Private Keys:** Generate a new key pair; revoke the old certificate
- [ ] **Session Secrets:** Rotate the signing key; this will invalidate all sessions

> **IMPORTANT:** Do NOT paste the new secret into any file tracked by git.
> Use environment variables or the secret vault (`src/lib/secret-vault.ts`).

### 3. Remediate — Clean the History

- [ ] Follow [GIT_HISTORY_REMEDIATION.md](GIT_HISTORY_REMEDIATION.md) to
      rewrite history and remove the secret from all commits
- [ ] Force-push the cleaned history to all remotes
- [ ] Notify all collaborators to re-clone or rebase

### 4. Verify — Confirm Removal

- [ ] Run `scripts/security/scan-working-tree.ps1` — expect CLEAN
- [ ] Run `scripts/security/scan-git-history.ps1` — expect CLEAN
- [ ] Run existing `scripts/scan-secrets.mjs` pre-commit hook — expect CLEAN
- [ ] Check CI workflow for any cached or logged secrets

### 5. Document — Audit Trail

- [ ] Record the incident in an append-only audit log
- [ ] Note: secret type, exposure window, remediation date, who acted
- [ ] Do NOT log the secret value itself — only its identifier/name

### 6. Harden — Prevent Recurrence

- [ ] Verify `.gitignore` includes the file pattern
- [ ] Verify `scripts/scan-secrets.mjs` covers the pattern
- [ ] Verify the pre-commit hook (`husky`) is active
- [ ] Consider adding the pattern to `src/lib/redaction.ts`

---

## Provider-Specific Rotation Guides

### Stripe

1. Dashboard → Developers → API Keys → Roll Key
2. Update the key in your environment / vault
3. Old key is invalidated immediately

### GitHub (PAT / OAuth)

1. Settings → Developer Settings → Personal Access Tokens → Revoke
2. Generate new token with minimum required scopes
3. Update CI secrets and local config

### AWS

1. IAM Console → Users → Security Credentials → Create Access Key
2. Deactivate the old key → Delete after confirmation
3. Update all services using the old key

### Generic Password / JWT Secret

1. Generate a new cryptographically random value (≥32 bytes)
2. Update the signing configuration
3. All existing sessions/tokens signed with the old key become invalid

---

## What NOT to Do

- Do **NOT** commit the rotated secret into git
- Do **NOT** paste secrets into Slack, email, or issue trackers
- Do **NOT** assume a private repo means no exposure — treat all leaks as real
- Do **NOT** delay rotation to "investigate first" — rotate, then investigate

---

## Related Documentation

- [SECRET_EXPOSURE_TRIAGE.md](SECRET_EXPOSURE_TRIAGE.md) — Initial triage
- [GIT_HISTORY_REMEDIATION.md](GIT_HISTORY_REMEDIATION.md) — History rewrite
- `src/lib/secret-vault.ts` — Runtime secret storage (AES-256-GCM)
- `src/lib/redaction.ts` — Log redaction patterns
- `scripts/scan-secrets.mjs` — Pre-commit secret scanner
