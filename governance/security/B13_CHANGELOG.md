# B13 Changelog — Source Code Protection

**Chain:** B13  
**Branch:** `feature/b13b14b15-phase-runner`  
**Completed:** 2026-02-17  

---

## Phases

### B13-P1 — Critical Assets Inventory + Risk Map
**Commit:** `04880ca`

- Created `governance/security/critical_assets_inventory.md`
- Created `governance/security/repo_criticality_map.json` with RPO/RTO targets
- Created `docs/security/B13_OVERVIEW.md`
- Catalogued Founder-Hub and Evident repositories with criticality ratings

### B13-P2 — Encrypted Backup System (Local-first)
**Commit:** `b7078f2`

- Created `ops/backup/BackupService.ts` — SHA-256 hashing, manifest generation,
  file exclusion rules, bundle creation with hash verification
- Created `ops/backup/providers/LocalProvider.ts` — In-memory local backup
  provider with store/list/retrieve/verify
- Created `ops/backup/providers/OffsiteProviderStub.ts` — Placeholder for
  remote backup (S3/B2/Azure Blob)
- Created `scripts/security/backup.ps1` — PowerShell backup creation with
  tar + age encryption
- Created `scripts/security/backup-verify.ps1` — PowerShell verification script
- Created `docs/security/backups.md` — Bundle structure documentation
- Created `governance/security/backup_policy.md` — Backup frequency, retention,
  verification requirements
- 36 unit tests for hashing, exclusions, manifests, providers, bundles

### B13-P3 — Restore Drill
**Commit:** `4cf0e3a`

- Created `ops/backup/RestoreService.ts` — Bundle verification, dry-run restore,
  and drill execution with audit logging
- Created `scripts/security/restore-drill.ps1` — PowerShell drill script
- Created `docs/security/restore-drill.md` — Drill documentation
- Created `governance/security/restore_drill_policy.md` — Monthly drill policy
- 10 additional unit tests (restore verification, dry-run, drill reports)

### B13-P4 — Artifact Escrow
**Commit:** `9549a64`

- Created `ops/backup/ArtifactEscrowService.ts` — Cryptographic escrow with
  chain of custody; held/released/expired states; append-only store
- Created `governance/security/escrow_manifest_schema.json` — JSON Schema
- Created `governance/security/escrow_policy.md` — Escrow policy document
- 14 additional unit tests (escrow lifecycle, release, verify, expiry)

### B13-P5 — Break-Glass Protocol
**Commit:** `7921f5b`

- Created `governance/security/break_glass_playbook.md` — Comprehensive incident
  response playbook with report template
- Created `governance/security/break_glass_checklists.md` — Pre/during/post and
  quarterly audit checklists
- Created `scripts/security/break-glass.ps1` — JSONL append-only activation log

### B13-P6 — Private Package Registry Strategy
**Commit:** `fb68417`

- Created `docs/security/private-registry-strategy.md` — GitHub Packages
  recommendation, .npmrc template, publishing workflow guidance

### B13-P7 — Workstation Hardening
**Commit:** `8d3a5d1`

- Created `scripts/security/workstation-hardening.ps1` — 8 security controls
  (git signing, credential store, SSH, secrets scan, firewall, BitLocker,
  commit hooks, .env gitignore)
- Created `governance/security/workstation_hardening_policy.md`

### B13-P8 — Anti-Deletion Guardrails
**Commit:** `4292e1d`

- Created `ops/backup/AntiDeletionGuard.ts` — Pure-function guard logic with
  glob matching, deletion evaluation, mass-deletion detection (25% threshold)
- Created `scripts/security/pre-commit-guard.ps1` — Pre-commit hook
- Created `scripts/security/pre-push-guard.ps1` — Pre-push hook with protected
  branch enforcement
- Created `governance/security/protected_paths_policy.md`
- 22 additional unit tests (glob matching, evaluation, formatting, constants)

### B13-P9 — B13 Verify Workflow
**Commit:** `4234289`

- Created `.github/workflows/b13-verify.yml` — CI workflow with typecheck,
  unit tests, and artifact presence validation
- Created `docs/security/B13_VERIFICATION.md` — Verification documentation

### B13-P10 — B13 Packaging
**Commit:** *(this commit)*

- This changelog
- Security posture summary

---

## Test Summary

| Suite | Tests |
|-------|-------|
| SHA-256 hashing | 4 |
| Hash manifest | 1 |
| File exclusion rules | 11 |
| Manifest generation | 5 |
| Manifest verification | 3 |
| LocalProvider | 4 |
| OffsiteProviderStub | 3 |
| Bundle creation | 5 |
| Restore verification | 3 |
| Restore dry-run | 5 |
| Restore drill | 2 |
| Artifact escrow | 14 |
| Anti-deletion glob | 8 |
| Deletion evaluation | 9 |
| Guard report formatting | 3 |
| Guard constants | 2 |
| **Total** | **82** |

## Files Created

| Phase | Files |
|-------|-------|
| P1 | 3 |
| P2 | 8 (including test file) |
| P3 | 4 |
| P4 | 3 |
| P5 | 3 |
| P6 | 1 |
| P7 | 2 |
| P8 | 4 |
| P9 | 2 |
| P10 | 2 |
| **Total** | **32** |
