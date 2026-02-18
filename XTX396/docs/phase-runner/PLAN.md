# B13/B14/B15 Phase Runner — PLAN

**Branch:** `feature/b13b14b15-phase-runner`  
**Base:** `5932b88` (B12 head on `feature/b12-ai-copilot-scoped-exec`)  
**Date:** 2026-02-17  

---

## Phase Summary

| Chain | Phases | Objective |
|-------|--------|-----------|
| B13 | P1–P10 | Source code protection, anti-deletion, backup, restore, escrow, break-glass |
| B14 | P1–P8 | Client onboarding, billing ops, portal, retention |
| B15 | P0–P8 | Shared tools platform, ToolHub, brand shells |

---

## B13 — Source Code Protection + Anti-Deletion + Recovery

### B13-P1 — Critical Assets Inventory + Risk Map
- **Objective:** Catalog critical repos, paths, and define RPO/RTO targets
- **Deliverables:** `governance/security/critical_assets_inventory.md`, `governance/security/repo_criticality_map.json`, `docs/security/B13_OVERVIEW.md`
- **Tests:** JSON schema validation for `repo_criticality_map.json`
- **Workflows:** None
- **Risk:** Low

### B13-P2 — Encrypted Backup System (Local-first)
- **Objective:** Immutable backup bundles with manifest + hash verification
- **Deliverables:** `ops/backup/BackupService.ts`, `ops/backup/providers/LocalProvider.ts`, `ops/backup/providers/OffsiteProviderStub.ts`, `scripts/security/backup.ps1`, `scripts/security/backup-verify.ps1`, `docs/security/backups.md`, `governance/security/backup_policy.md`
- **Tests:** Manifest generation, hash verification
- **Workflows:** None (B13-P9 adds workflow)
- **Risk:** Medium

### B13-P3 — Restore Drill
- **Objective:** Quarterly/on-demand restore drill with pass/fail report
- **Deliverables:** `ops/backup/RestoreService.ts`, `scripts/security/restore-drill.ps1`, `docs/security/restore_drill.md`, `governance/security/restore_drill_policy.md`
- **Tests:** Mock restore drill unit test
- **Workflows:** None
- **Risk:** Low

### B13-P4 — Artifact Escrow
- **Objective:** Release build provenance with SBOM + signatures + integrity
- **Deliverables:** `ops/escrow/ArtifactEscrowService.ts`, `ops/escrow/escrow-manifest.schema.json`, `governance/security/artifact_escrow_policy.md`, `docs/security/artifact_escrow.md`, `.github/workflows/artifact-escrow.yml`
- **Tests:** Escrow manifest schema validation
- **Workflows:** `artifact-escrow.yml`
- **Risk:** Medium

### B13-P5 — Break-Glass Protocol
- **Objective:** Incident response playbooks for critical scenarios
- **Deliverables:** `ops/break-glass/BreakGlassPlaybook.md`, `ops/break-glass/checklists/*`, `ops/break-glass/runbook_templates/*`, `governance/security/break_glass_policy.md`, `scripts/security/break-glass.ps1`
- **Tests:** Policy docs exist check
- **Workflows:** None
- **Risk:** Low

### B13-P6 — Private Package Registry Strategy
- **Objective:** Document internal package publishing strategy
- **Deliverables:** `docs/security/private_registry.md`, `governance/security/dependency_distribution_policy.md`
- **Tests:** None (docs only)
- **Workflows:** None
- **Risk:** Low

### B13-P7 — Workstation Hardening
- **Objective:** Windows hardening guidance + key hygiene scripts
- **Deliverables:** `docs/security/workstation_hardening_windows.md`, `scripts/security/windows-hardening.ps1`, `scripts/security/windows-hardening-apply.ps1`, `scripts/security/key-hygiene.ps1`, `governance/security/workstation_security_policy.md`
- **Tests:** Script dry-run
- **Workflows:** None
- **Risk:** Low

### B13-P8 — Anti-Deletion Guardrails
- **Objective:** Git hooks to protect critical paths from accidental deletion
- **Deliverables:** `scripts/security/pre-push-guard.ps1`, `scripts/security/pre-commit-guard.ps1`, `governance/security/protected_paths_policy.md`
- **Tests:** Simulate deleted protected file
- **Workflows:** None
- **Risk:** Low

### B13-P9 — B13 Verify Workflow
- **Objective:** CI workflow validating B13 artifacts
- **Deliverables:** `.github/workflows/b13-verify.yml`, `docs/security/B13_VERIFICATION.md`
- **Tests:** None (workflow validation via Gate D)
- **Workflows:** `b13-verify.yml`
- **Risk:** Low

### B13-P10 — B13 Packaging
- **Objective:** Changelog + security posture summary
- **Deliverables:** `governance/security/B13_CHANGELOG.md`, `docs/security/SECURITY_POSTURE_SUMMARY.md`
- **Tests:** None
- **Workflows:** None
- **Risk:** Low

---

## B14 — Client Onboarding + Billing Ops

### B14-P1 — Intake Models + Checklists
- **Objective:** Intake checklists for ediscovery, SMB consulting, public tools
- **Deliverables:** `ops/onboarding/intake/IntakeModel.ts`, `ops/onboarding/intake/checklists/*.json`, `docs/onboarding/intake.md`, `governance/ops/onboarding/intake_policy.md`
- **Tests:** Checklist schema validation
- **Risk:** Low

### B14-P2 — Contract Templates
- **Objective:** MSA/SOW/NDA placeholder templates
- **Deliverables:** `contracts/templates/MSA_template.md`, `contracts/templates/SOW_template.md`, `contracts/templates/NDA_lite_template.md`, `contracts/policies/template_usage_policy.md`, `docs/onboarding/contracts.md`
- **Tests:** Placeholder linter
- **Risk:** Low

### B14-P3 — Proposal + SOW Generator
- **Objective:** Draft-first proposal generation with hash + audit
- **Deliverables:** `ops/onboarding/proposals/ProposalService.ts`, `ops/onboarding/proposals/templates/*`, `docs/onboarding/proposals.md`
- **Tests:** Deterministic hash + template fill
- **Risk:** Low

### B14-P4 — Billing Core
- **Objective:** Invoice model + append-only billing ledger
- **Deliverables:** `ops/billing/models/Invoice.ts`, `ops/billing/ledger/BillingLedger.ts`, `ops/billing/adapters/PaymentAdapter.ts`, `ops/billing/adapters/LocalManualAdapter.ts`, `docs/onboarding/billing.md`, `governance/ops/onboarding/billing_policy.md`
- **Tests:** Ledger append-only integrity
- **Risk:** Medium

### B14-P5 — Customer Portal Handoff Packages
- **Objective:** Zip packages with manifest + deliverables + audit extract
- **Deliverables:** `ops/portal/HandoffPackageService.ts`, `ops/portal/package.schema.json`, `ops/portal/storage/local/*.ts`, `docs/onboarding/portal.md`
- **Tests:** Manifest verification
- **Risk:** Low

### B14-P6 — Retention + Referrals Automation
- **Objective:** Draft-only retention rules with audit events
- **Deliverables:** `ops/automation/rules/retention_rules.json`, `ops/automation/templates/retention/*`, `docs/onboarding/retention.md`
- **Tests:** Rules parsing + scheduling
- **Risk:** Low

### B14-P7 — Confidence Builder Publishing Hooks
- **Objective:** Content ops request templates
- **Deliverables:** `docs/onboarding/confidence_builders.md`, `ops/automation/content/templates/*`
- **Tests:** Request schema validation
- **Risk:** Low

### B14-P8 — B14 Packaging
- **Objective:** Playbook + changelog
- **Deliverables:** `docs/onboarding/PLAYBOOK.md`, `governance/ops/onboarding/B14_CHANGELOG.md`
- **Risk:** Low

---

## B15 — Shared Tools Platform + ToolHub

### B15-P0 — Preflight: Existing Apps Inventory
- **Objective:** Enumerate Evident/apps, detect frameworks
- **Deliverables:** `docs/tools/EXISTING_APPS_INVENTORY.md`
- **Risk:** Low

### B15-P1 — Tool Contract + Schema + Loader
- **Objective:** ToolManifest schema + validation + loader
- **Deliverables:** `apps/tooling/ToolManifest.schema.json`, `apps/tooling/toolkit.ts`, `apps/tooling/loadTools.ts`, `apps/tooling/tests/*`
- **Tests:** Manifest validation
- **Risk:** Low

### B15-P2 — ToolHub Host App
- **Objective:** Tool directory UI, router, acceptance banners, audit hooks
- **Deliverables:** `apps/toolhub/*`
- **Tests:** Route mounting, acceptance gating
- **Risk:** Medium

### B15-P3 — Brand Profiles
- **Objective:** Evident vs XTX396 tool filtering
- **Deliverables:** `apps/toolhub/profiles/evident.json`, `apps/toolhub/profiles/xtx396.json`
- **Tests:** Profile validation
- **Risk:** Low

### B15-P4 — Convert Existing Tools
- **Objective:** Add tool.manifest.json to each app
- **Deliverables:** Per-app manifests
- **Tests:** Manifest validation
- **Risk:** Low

### B15-P5 — Integrate Highlight Tools
- **Objective:** Risk + acceptance configuration for sensitive tools
- **Deliverables:** Updated manifests with disclaimers
- **Tests:** Acceptance banner required for high-risk
- **Risk:** Medium

### B15-P6 — Shell Integration Plan
- **Objective:** Document XTX396 ↔ ToolHub integration
- **Deliverables:** `docs/tools/SHELL_INTEGRATION.md`, package export stubs
- **Risk:** Low

### B15-P7 — Policy Generator
- **Objective:** Generate governance policies from tool manifests
- **Deliverables:** `apps/tooling/generatePolicies.ts`, `governance/tools/*`
- **Tests:** Generator snapshot tests
- **Risk:** Low

### B15-P8 — B15 Packaging
- **Objective:** Changelog + README + PR docs
- **Deliverables:** `governance/tools/B15_CHANGELOG.md`, `docs/tools/README.md`
- **Risk:** Low

---

## Commit Naming Convention

Each phase commits as: `B{chain}-P{phase}: {short description}`

Example: `B13-P1: Critical assets inventory + risk map`

## Gate Checkpoints

Gates A–E run after each phase. See [GATES.md](GATES.md) for details.
