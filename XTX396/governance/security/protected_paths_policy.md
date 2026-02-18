# Protected Paths Policy

**Chain:** B13 — Source Code Protection  
**Phase:** P8 — Anti-Deletion Guardrails  
**Status:** Active  
**Effective:** 2026-02-17  

---

## Purpose

This policy defines the paths within each repository that are protected from
accidental or malicious deletion through automated guardrails.

## Scope

All repositories governed by the Evident Technologies security framework.

## Protected Path Categories

### 1. Governance & Policy

| Pattern | Reason |
|---------|--------|
| `governance/**` | Security policies, changelogs, audit records |

### 2. CI/CD Infrastructure

| Pattern | Reason |
|---------|--------|
| `.github/workflows/**` | CI/CD pipeline definitions |

### 3. Operations Core

| Pattern | Reason |
|---------|--------|
| `ops/runner/**` | Phase runner execution engine |
| `ops/copilot/**` | AI copilot integration layer |
| `ops/automation/**` | Audit logging, automation rules |
| `ops/console/**` | Operator console |
| `ops/core/**` | Core operational logic |
| `ops/security/**` | Security services |
| `ops/backup/**` | Backup, restore, escrow services |

### 4. Applications & Contracts

| Pattern | Reason |
|---------|--------|
| `apps/**` | Application code and tool manifests |
| `contracts/**` | Legal document templates |

### 5. Scripts

| Pattern | Reason |
|---------|--------|
| `scripts/**` | Build, deployment, security scripts |

### 6. Critical Source Files

| Pattern | Reason |
|---------|--------|
| `src/lib/secret-vault.ts` | Secret management implementation |
| `src/lib/redaction.ts` | PII redaction logic |

## Guardrail Mechanisms

### Pre-Commit Hook

- Runs `scripts/security/pre-commit-guard.ps1`
- Scans staged changes for deletions matching protected patterns
- Blocks the commit if violations are found

### Pre-Push Hook

- Runs `scripts/security/pre-push-guard.ps1`
- Scans the commit range being pushed for protected-path deletions
- Blocks pushes to protected branches (`main`, `master`, `production`)
  without explicit override

### Mass Deletion Detection

- If more than **25%** of tracked files are deleted in a single commit or
  push range, the operation is blocked regardless of which paths are affected

## Override Protocol

1. Set environment variable `EVIDENT_GUARD_OVERRIDE=1`
2. Document the override reason in the commit message
3. Log the override in the ops audit trail
4. A reviewer must confirm the override is justified before merge

Override is a fail-open escape hatch for legitimate operations such as:

- Major refactors with path changes
- Repository restructuring approved by maintainers
- Archival of deprecated modules

Override **must not** be used to circumvent the policy for convenience.

## Enforcement

- Hooks are installed via project setup (`scripts/setup.ps1` or equivalent)
- CI workflow (`b13-verify.yml`) validates that hook scripts exist
- Quarterly review of protected paths list alongside critical assets inventory

## References

- `governance/security/repo_criticality_map.json` — Source of protected paths
- `governance/security/critical_assets_inventory.md` — Asset inventory
- `ops/backup/AntiDeletionGuard.ts` — TypeScript implementation (testable logic)
- `scripts/security/pre-commit-guard.ps1` — Pre-commit hook implementation
- `scripts/security/pre-push-guard.ps1` — Pre-push hook implementation
