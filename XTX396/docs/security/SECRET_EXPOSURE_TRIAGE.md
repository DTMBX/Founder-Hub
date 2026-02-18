# Secret Exposure Triage

> Date: 2026-02-17
> Branch: `feature/honorbar-security-admin-upgrade`

---

## Prior Remediation (B19 cleanup)

The repository history was rewritten using `git-filter-repo` to remove
Stripe key patterns (`sk_live_*`, `sk_test_*`) across all 234 commits.
All occurrences were replaced with `xk_fake_*` placeholder values.
The rewritten history was force-pushed to `origin/main` at commit `1582898`.

---

## Current .gitignore Status

Present:
- `.env` — YES
- `node_modules` — YES
- `dist` — YES
- `*.local` — YES

Missing (should be added):
- `.env.*` with `!.env.example` exception
- `*.pem`, `*.key`, `*.pfx`, `*.p12`
- `*.sqlite`, `*.db`
- `/secrets/`

---

## Scan Targets

### File Pattern Scan (Working Tree)

Files to check for by name/extension:
- `.env`, `.env.local`, `.env.production`, `.env.development`
- `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.jks`
- `*.sqlite`, `*.db`
- `id_rsa`, `id_ed25519`
- `credentials.json`, `service-account*.json`
- `*.secret`, `*.secrets`

### Content Pattern Scan (Working Tree + History)

Patterns to detect (file paths only — never print matched content):
- `sk_live_`, `sk_test_` — Stripe keys
- `AKIA[0-9A-Z]{16}` — AWS access keys
- `ghp_[A-Za-z0-9]{36}` — GitHub PATs
- `-----BEGIN.*PRIVATE KEY-----` — Private keys
- `password\s*[:=]\s*['"].+['"]` — Hardcoded passwords
- `Bearer [A-Za-z0-9\-._~+/]+=*` — Bearer tokens
- `xox[bprs]-[A-Za-z0-9-]+` — Slack tokens

---

## Existing Security Infrastructure

| Feature | Location | Status |
|---|---|---|
| Secret vault (AES-256-GCM) | `src/lib/secret-vault.ts` | Active |
| Redaction module | `src/lib/redaction.ts` | Active — 15+ patterns |
| Terminal redaction | `src/terminal/redaction.ts` | Active |
| Pre-commit scanner | `scripts/scan-secrets.mjs` | Present |
| Husky pre-commit hook | `.husky/pre-commit` | Present |
| CI secret scan workflow | `.github/workflows/` | Present |
| Audit logger | `src/lib/auth.ts` (append-only) | Active |
| Terminal audit logger | `src/terminal/executor.ts` | Active |

---

## Assessment

**Working tree:** Expected clean — prior remediation was thorough.
**Git history:** Expected clean — `git-filter-repo` rewrite confirmed.
**CI pipeline:** Secret scan job exists in workflow.
**.gitignore:** Needs hardening for additional sensitive file types.

---

## Action Items

1. Create `scripts/security/scan-working-tree.ps1` — safe filename + pattern scan
2. Create `scripts/security/scan-git-history.ps1` — safe history pattern scan
3. Update `.gitignore` with missing patterns
4. Create `docs/security/SECRET_EXPOSURE_RESPONSE.md` — procedural response doc
5. Create `docs/security/GIT_HISTORY_REMEDIATION.md` — if any exposure found
6. Run both scans and document results
