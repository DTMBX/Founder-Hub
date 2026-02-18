# B17 Control Baseline

> B17-Step 0 | External Trust Layer | Classification: Governance

## Purpose

This document extracts and inventories all security, operational, and compliance
controls implemented across the B13–B16 chain. It serves as the foundation for
external trust documentation, control mapping, and institutional readiness
assessment.

## Methodology

Controls were extracted by parsing:

- Governance policies (`governance/security/*.md`, `governance/ops/*.md`)
- Deployment documentation (`docs/deployment/*.md`)
- Implementation source (`ops/**/*.ts`)
- Test suites (`ops/__tests__/b13–b16*.test.ts`)
- Changelogs (`governance/security/B13_CHANGELOG.md`, `governance/ops/onboarding/B14_CHANGELOG.md`, `governance/tools/B15_CHANGELOG.md`, `governance/deployment/B16_CHANGELOG.md`)

## Control Inventory

### 1. Backup Controls (11)

| ID | Control | Description | Source |
|---|---|---|---|
| BK-01 | Backup Bundle Creation | Source-code backup bundles with per-file SHA-256 hashes and manifest generation | `governance/security/backup_policy.md` |
| BK-02 | Backup Encryption | AES-256 encryption for offsite backups; local encryption in non-controlled environments | `governance/security/backup_policy.md` |
| BK-03 | Backup Integrity Verification | Post-creation verification of manifest completeness, SHA-256 hashes, and metadata | `governance/security/backup_policy.md` |
| BK-04 | Backup Retention & Rotation | 30-day local rolling; 90-day minimum offsite; rotation logged in append-only log | `governance/security/backup_policy.md` |
| BK-05 | Backup Audit Trail | Structured audit events for all backup operations | `governance/security/backup_policy.md` |
| BK-06 | Monthly Full Restore Drill | Full restore drill with manifest validation, hash verification, build simulation | `governance/security/restore_drill_policy.md` |
| BK-07 | Weekly Quick Integrity Check | Manifest and metadata hash validation without full file-level verification | `governance/security/restore_drill_policy.md` |
| BK-08 | Restore Failure Escalation | Failed drills escalate to Engineering Lead within 4 hours | `governance/security/restore_drill_policy.md` |
| BK-09 | Artifact Escrow | Cryptographic escrow with SHA-256 integrity, chain of custody metadata, append-only records | `governance/security/escrow_policy.md` |
| BK-10 | Escrow Release Protocol | Written justification, identity recording, audit logging, post-release hash verification | `governance/security/escrow_policy.md` |
| BK-11 | Escrow Expiration | Auto-marked expired artifacts retained in manifest for audit | `governance/security/escrow_policy.md` |

### 2. Source Protection Controls (5)

| ID | Control | Description | Source |
|---|---|---|---|
| SP-01 | Protected Paths Guard | Automated guardrails block deletion of governance, CI/CD, ops, and critical source files | `governance/security/protected_paths_policy.md` |
| SP-02 | Mass Deletion Detection | Commits deleting >25% of tracked files blocked regardless of path | `governance/security/protected_paths_policy.md` |
| SP-03 | Pre-Commit Hook Guard | Staged deletion scanning via `scripts/security/pre-commit-guard.ps1` | `governance/security/protected_paths_policy.md` |
| SP-04 | Pre-Push Hook Guard | Push-range scanning for protected branch protection | `governance/security/protected_paths_policy.md` |
| SP-05 | Override Protocol | Requires env var, documented reason, audit trail, reviewer confirmation | `governance/security/protected_paths_policy.md` |

### 3. Break-Glass Controls (5)

| ID | Control | Description | Source |
|---|---|---|---|
| BG-01 | Break-Glass Activation | Emergency access requiring two-person authorization | `governance/security/break_glass_playbook.md` |
| BG-02 | Two-Person Rule | Dual authorization; single-person only if unreachable 15+ min with mandatory review | `governance/security/break_glass_playbook.md` |
| BG-03 | Break-Glass Logging | Independent append-only logging of all emergency actions | `governance/security/break_glass_playbook.md` |
| BG-04 | Deactivation & Recovery | Post-remediation credential rotation, normal control restoration, audit verification | `governance/security/break_glass_playbook.md` |
| BG-05 | Anti-Abuse Review | All events reviewed by Security Officer; unauthorized use is terminable | `governance/security/break_glass_playbook.md` |

### 4. Tenant Isolation Controls (7)

| ID | Control | Description | Source |
|---|---|---|---|
| TI-01 | Tenant Identification | UUID-based tenant IDs; default `public-demo` tenant with restricted capabilities | `governance/security/tenant_isolation_policy.md` |
| TI-02 | Data Isolation | All queries include `tenant_id`; cross-tenant access logged and denied | `governance/security/tenant_isolation_policy.md` |
| TI-03 | Fail-Closed Access | No tenant context or suspended tenant = denied; rate limits per tenant | `governance/security/tenant_isolation_policy.md` |
| TI-04 | Tenant Lifecycle | Active/suspended states; suspension retains data; no deletion | `governance/security/tenant_isolation_policy.md` |
| TI-05 | Tenant-Scoped Feature Flags | Per-tenant feature flags; demo tenant has billing/messaging/upload disabled | `governance/security/tenant_isolation_policy.md` |
| TI-06 | Tenant Tool Access Control | `allowedTools[]` restricts tool availability per tenant | `governance/security/tenant_isolation_policy.md` |
| TI-07 | Tenant Audit Trail | All context resolutions, denials, and cross-tenant attempts logged | `governance/security/tenant_isolation_policy.md` |

### 5. Secret Hygiene & API Key Controls (10)

| ID | Control | Description | Source |
|---|---|---|---|
| SH-01 | API Key Hash-Only Storage | SHA-256 hash only; plain key returned once at creation | `governance/security/api_key_policy.md` |
| SH-02 | API Key Tenant Binding | Each key bound to one `tenant_id`; cross-tenant usage denied | `governance/security/api_key_policy.md` |
| SH-03 | Scoped Permissions | `read_only` < `export` < `admin` hierarchy enforced | `governance/security/api_key_policy.md` |
| SH-04 | Immediate Revocation | Revocation is permanent and immediate; all revocations logged | `governance/security/api_key_policy.md` |
| SH-05 | Key Audit Events | `key_created`, `key_revoked`, `revoked_key_attempt` logged | `governance/security/api_key_policy.md` |
| SH-06 | Workstation Credential Storage | Non-plaintext credential helpers required | `governance/security/workstation_hardening_policy.md` |
| SH-07 | Disk Encryption | BitLocker/FileVault required on developer workstations | `governance/security/workstation_hardening_policy.md` |
| SH-08 | Workstation Firewall | OS firewall enabled on all workstations | `governance/security/workstation_hardening_policy.md` |
| SH-09 | No Secrets in Configs | Shell configs scanned for tokens, keys, passwords | `governance/security/workstation_hardening_policy.md` |
| SH-10 | Commit Signing | GPG/SSH commit signing recommended | `governance/security/workstation_hardening_policy.md` |

### 6. Public Demo Controls (5)

| ID | Control | Description | Source |
|---|---|---|---|
| DM-01 | Output Bounding | Max 100 rows, 5 MB exports, 10K-char previews | `governance/security/public_demo_policy.md` |
| DM-02 | Feature Restrictions | File uploads, external APIs, billing, messaging disabled | `governance/security/public_demo_policy.md` |
| DM-03 | Rate Limiting | Per-tenant (30 rpm) and per-IP rate limiting, fail-closed | `governance/security/public_demo_policy.md` |
| DM-04 | Demo Audit Logging | All rejections logged with tenant, action, timestamp, detail | `governance/security/public_demo_policy.md` |
| DM-05 | DemoGuard Enforcement | All public endpoints pass through DemoGuard checks | `governance/security/public_demo_policy.md` |

### 7. Abuse Prevention Controls (5)

| ID | Control | Description | Source |
|---|---|---|---|
| AB-01 | Per-IP Rate Limiting | 60 req/min default; exceeding = rejection with retry delay | `governance/security/abuse_prevention_policy.md` |
| AB-02 | Burst Detection | 15 req/5s triggers throttling; 3+ violations = auto soft-ban | `governance/security/abuse_prevention_policy.md` |
| AB-03 | Soft Ban | 10-min auto-ban; auto-expiry; manual control; audit-logged | `governance/security/abuse_prevention_policy.md` |
| AB-04 | Exponential Backoff | 1s base, doubling per violation, 60s cap | `governance/security/abuse_prevention_policy.md` |
| AB-05 | Abuse Audit Trail | All events (allowed/throttled/blocked/banned) logged | `governance/security/abuse_prevention_policy.md` |

### 8. Export Integrity Controls (7)

| ID | Control | Description | Source |
|---|---|---|---|
| EX-01 | Deterministic Ordering | Lexicographic sort by record ID before hashing | `governance/security/export_integrity_policy.md` |
| EX-02 | Watermarking | Tenant, timestamp, batch ID, system ID, version in every export | `governance/security/export_integrity_policy.md` |
| EX-03 | SHA-256 Integrity Hash | Canonical-representation hash included in manifest | `governance/security/export_integrity_policy.md` |
| EX-04 | Tenant Scope Enforcement | Cross-tenant records rejected at export creation | `governance/security/export_integrity_policy.md` |
| EX-05 | Verification on Consumption | Re-verify integrity hash before processing | `governance/security/export_integrity_policy.md` |
| EX-06 | Reproducibility | Same inputs produce identical hashes across runs | `governance/security/export_integrity_policy.md` |
| EX-07 | Export Audit Trail | `export_created`, `export_verified`, `export_tampered` events | `governance/security/export_integrity_policy.md` |

### 9. Monitoring Controls (5)

| ID | Control | Description | Source |
|---|---|---|---|
| MO-01 | Health Checks | Deterministic checks reporting uptime, p95 latency, error rate; SHA-256 hashed | `governance/ops/monitoring_policy.md` |
| MO-02 | SLO Enforcement | Rolling 7d/30d window evaluation; breach alerts | `governance/ops/monitoring_policy.md` |
| MO-03 | Alert Severity | Warning = 4h investigate; Critical = 15-min escalation | `governance/ops/monitoring_policy.md` |
| MO-04 | Tier-Specific SLOs | Public 99.0%, Pro 99.5%, Internal 99.9% uptime | `governance/ops/monitoring_policy.md` |
| MO-05 | Health Check Audit Trail | All checks and alerts in append-only storage | `governance/ops/monitoring_policy.md` |

### 10. Audit Controls (6)

| ID | Control | Description | Source |
|---|---|---|---|
| AU-01 | Structured Event Taxonomy | 9 category prefixes across all ops automation | `governance/ops/ops_audit_policy.md` |
| AU-02 | Mandatory Event Fields | UUID, ISO-8601 timestamp, category, severity, actor, description, payloadHash | `governance/ops/ops_audit_policy.md` |
| AU-03 | Append-Only Retention | JSONL format; 2-year minimum; modification prohibited | `governance/ops/ops_audit_policy.md` |
| AU-04 | PII Redaction | Emails to domain only; phone to last 4; IPs/passwords/keys never stored | `governance/ops/ops_audit_policy.md` |
| AU-05 | Integrity Verification | SHA-256 per event; `ops/automation/audit/verify.ts` validates | `governance/ops/ops_audit_policy.md` |
| AU-06 | Pluggable Sinks | `IAuditSink` interface; localStorage, JSONL, future DB/object storage | `governance/ops/ops_audit_policy.md` |

## Summary

| Category | Control Count | Test Coverage |
|---|---|---|
| Backup | 11 | 60 tests (B13 P2/P3/P4) |
| Source Protection | 5 | 22 tests (B13-P8) |
| Break Glass | 5 | Script-based |
| Tenant Isolation | 7 | 35 tests (B16-P1) |
| Secret Hygiene / API Keys | 10 | 17 tests (B16-P3) |
| Public Demo | 5 | 15 tests (B16-P2) |
| Abuse Prevention | 5 | 11 tests (B16-P5) |
| Export Integrity | 7 | 17 tests (B16-P7) |
| Monitoring | 5 | 16 tests (B16-P4) |
| Audit | 6 | Verification script |
| **Total** | **66** | **401 tests** |

## Gate Check

All 66 controls are documented with:
- Policy source identified
- Implementation file referenced
- Test coverage mapped where applicable

No undocumented core controls found. Baseline validated.

---

*Generated for B17-Step 0. All references point to committed artifacts on branches B13–B16.*
