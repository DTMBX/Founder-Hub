# B13 Verification

**Chain:** B13 — Source Code Protection  
**Phase:** P9 — Verify Workflow  
**Status:** Active  
**Effective:** 2026-02-17  

---

## Overview

The B13 verification workflow (`.github/workflows/b13-verify.yml`) validates all
B13 artifacts on every push and pull request that touches B13-related paths.

## Trigger Paths

The workflow runs when changes are made to:

- `ops/backup/**` — Backup, restore, escrow, guard services
- `governance/security/**` — Security policies and manifests
- `scripts/security/**` — Security hook and hardening scripts
- `docs/security/**` — Security documentation

## Jobs

### 1. Typecheck (Gate A)

Runs `npx tsc --noEmit` to verify all B13 TypeScript modules compile without
errors.

### 2. Unit Tests (Gate B)

Runs `npx vitest run ops/__tests__/b13-backup.test.ts` with verbose reporter.
Validates:

- SHA-256 hashing (4 tests)
- Manifest generation and verification (9 tests)
- File exclusion rules (11 tests)
- Local provider store/retrieve/verify (4 tests)
- Offsite provider stub (3 tests)
- Bundle creation integration (5 tests)
- Restore service verification (3 tests)
- Restore drill execution (7 tests)
- Artifact escrow lifecycle (14 tests)
- Anti-deletion glob matching (8 tests)
- Deletion evaluation (9 tests)
- Guard report formatting (3 tests)
- Constants validation (2 tests)

**Total:** 82 tests

### 3. Artifact Presence (Gate E)

Verifies all B13 deliverable files exist on disk:

| Phase | Files Checked |
|-------|---------------|
| P1 | `critical_assets_inventory.md`, `repo_criticality_map.json` |
| P2 | `BackupService.ts`, `LocalProvider.ts`, `OffsiteProviderStub.ts`, backup scripts, docs |
| P3 | `RestoreService.ts`, drill script, policy |
| P4 | `ArtifactEscrowService.ts`, escrow policy |
| P5 | Break-glass playbook, checklists, script |
| P6 | Private registry strategy |
| P7 | Workstation hardening script, policy |
| P8 | `AntiDeletionGuard.ts`, hook scripts, policy |

Also validates `repo_criticality_map.json` parses as valid JSON.

## Running Locally

```bash
# Run all B13 tests
npx vitest run ops/__tests__/b13-backup.test.ts

# Run typecheck
npx tsc --noEmit

# Run full gate suite
.\scripts\verify.ps1
```

## References

- [GATES.md](../../docs/phase-runner/GATES.md) — Gate definitions
- [PLAN.md](../../docs/phase-runner/PLAN.md) — Full phase plan
