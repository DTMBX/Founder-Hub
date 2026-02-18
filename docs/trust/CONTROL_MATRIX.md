# Control Matrix — SOC 2-Style Alignment

> B17-P1 | External Trust Layer | Classification: Governance
>
> **Disclaimer:** This document maps implemented controls to industry-standard
> control categories. It does not constitute a formal SOC 2 certification,
> attestation, or audit report. No external auditor has reviewed these controls.
> This mapping is provided for internal maturity assessment and to facilitate
> future external audit preparation.

## 1. Security

### 1.1 Access Controls

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Restrict system access to authorized users | Tenant-scoped API keys with hash-only storage (SH-01, SH-02) | `ops/auth/ApiKeyManager.ts` | 17 tests in `ops/__tests__/b16-multitenant.test.ts` (P3 suite) |
| Enforce least-privilege permissions | Scoped API key permissions: read_only < export < admin (SH-03) | `governance/security/api_key_policy.md` | Scope hierarchy tests in B16-P3 suite |
| Prevent unauthorized credential use | Immediate and permanent key revocation (SH-04) | `ops/auth/ApiKeyManager.ts` | Revocation tests in B16-P3 suite |
| Protect credentials at rest | SHA-256 hash-only key storage; non-plaintext workstation credential helpers (SH-01, SH-06) | `governance/security/api_key_policy.md`, `governance/security/workstation_hardening_policy.md` | Key creation tests; `scripts/security/workstation-hardening.ps1` |
| Enforce multi-tenant data boundaries | Fail-closed tenant resolution; cross-tenant access denied and logged (TI-02, TI-03) | `ops/tenancy/TenantContextMiddleware.ts` | 35 tests in B16-P1 suite |

### 1.2 Network & Abuse Protection

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Limit request rates to prevent abuse | Per-IP rate limiting (60 req/min) with burst detection (AB-01, AB-02) | `ops/security/AbuseProtection.ts` | 11 tests in B16-P5 suite |
| Automatically ban abusive actors | Soft-ban after 3 violations; exponential backoff (AB-03, AB-04) | `ops/security/AbuseProtection.ts` | Ban/backoff tests in B16-P5 suite |
| Restrict demo mode capabilities | Output bounding, feature restrictions, rate limiting (DM-01–DM-05) | `ops/demo/DemoGuard.ts` | 15 tests in B16-P2 suite |

### 1.3 Emergency Access

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Provide controlled emergency access | Two-person break-glass protocol with independent logging (BG-01–BG-03) | `governance/security/break_glass_playbook.md` | `scripts/security/break-glass.ps1` |
| Prevent emergency access abuse | Post-event Security Officer review; credential rotation (BG-04, BG-05) | `governance/security/break_glass_playbook.md` | Procedural; checklist in `governance/security/break_glass_checklists.md` |

## 2. Availability

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Define and enforce uptime targets | Tier-specific SLOs: public 99.0%, pro 99.5%, internal 99.9% (MO-02, MO-04) | `ops/monitoring/SLOConfig.json` | 16 tests in B16-P4 suite |
| Detect degradation promptly | Health checks with warning/critical thresholds; 15-min critical escalation (MO-01, MO-03) | `ops/monitoring/HealthMonitor.ts` | Alert generation tests in B16-P4 suite |
| Ensure recoverability | Monthly full restore drills with manifest validation and build simulation (BK-06) | `governance/security/restore_drill_policy.md` | 10 tests in B13-P3 suite |
| Maintain backup integrity | Per-file SHA-256 hashes; post-creation verification; 30/90-day retention (BK-01–BK-05) | `ops/backup/BackupService.ts` | 36 tests in B13-P2 suite |
| Preserve critical artifacts | Cryptographic escrow with chain-of-custody metadata (BK-09–BK-11) | `ops/backup/ArtifactEscrowService.ts` | 14 tests in B13-P4 suite |

## 3. Confidentiality

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Isolate tenant data | UUID-based tenant identification; all queries scoped by tenant_id (TI-01, TI-02) | `ops/tenancy/TenantModel.ts` | 35 tests in B16-P1 suite |
| Redact PII from audit logs | Emails to domain; phone to last 4 digits; IPs/passwords/keys never stored (AU-04) | `governance/ops/ops_audit_policy.md` | PII redaction policy; `ops/security/pii/redact.ts` |
| Restrict demo data exposure | Row limits, export size limits, preview truncation (DM-01) | `ops/demo/DemoGuard.ts` | Output bounding tests in B16-P2 suite |
| Prevent secret leakage | Pre-commit scanning; no secrets in shell configs; disk encryption (SH-07, SH-09) | `governance/security/workstation_hardening_policy.md` | `scripts/security/workstation-hardening.ps1` |
| Scope exports to single tenant | Cross-tenant export rejection at creation time (EX-04) | `ops/export/ExportIntegrity.ts` | Tenant scope tests in B16-P7 suite |

## 4. Processing Integrity

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Ensure deterministic export output | Lexicographic record sorting before hash computation (EX-01) | `ops/export/ExportIntegrity.ts` | Sort determinism tests in B16-P7 suite |
| Verify export integrity | SHA-256 hash over canonical representation; re-verification on consumption (EX-03, EX-05) | `ops/export/ExportIntegrity.ts` | Hash verification and tamper detection tests in B16-P7 suite |
| Guarantee export reproducibility | Same inputs produce identical hashes across independent runs (EX-06) | `ops/export/ExportIntegrity.ts` | Reproducibility test in B16-P7 suite |
| Detect data tampering | Re-hash and compare on verification; tamper events logged (EX-05, EX-07) | `ops/export/ExportIntegrity.ts` | Tamper detection tests in B16-P7 suite |
| Watermark all exports | Tenant, timestamp, batch ID, system ID, version in every export (EX-02) | `ops/export/ExportIntegrity.ts` | Watermark field tests in B16-P7 suite |
| Verify backup integrity | Per-bundle SHA-256 verification; restore drill hash matching (BK-03, BK-06) | `ops/backup/BackupService.ts`, `ops/backup/RestoreService.ts` | Integrity verification tests in B13-P2/P3 suites |

## 5. Change Management

| Control Objective | Implemented Control | Evidence Source | Verification Method |
|---|---|---|---|
| Prevent unauthorized source deletion | Protected paths guard with pre-commit/pre-push hooks (SP-01–SP-04) | `ops/backup/AntiDeletionGuard.ts` | 22 tests in B13-P8 suite |
| Require override documentation | Env var + documented reason + audit trail + reviewer required (SP-05) | `governance/security/protected_paths_policy.md` | Override protocol in policy |
| Block mass deletions | >25% tracked file deletion blocked at commit/push (SP-02) | `ops/backup/AntiDeletionGuard.ts` | Mass deletion tests in B13-P8 suite |
| Log all audit events immutably | Append-only JSONL; 2-year retention; SHA-256 per event (AU-01–AU-03, AU-05) | `ops/automation/audit/OpsAuditLogger.ts`, `ops/automation/audit/verify.ts` | Audit verification script |
| Support structured event taxonomy | 9 category prefixes; mandatory UUID, timestamp, severity, payloadHash (AU-01, AU-02) | `governance/ops/ops_audit_policy.md` | Event structure validation |

## Cross-Reference Summary

| Category | Controls Mapped | Primary Chain |
|---|---|---|
| Security | 10 | B16 (P1–P5), B13 (BG) |
| Availability | 5 | B16 (P4), B13 (P2–P4) |
| Confidentiality | 5 | B16 (P1–P3, P7), B13 (SH) |
| Processing Integrity | 6 | B16 (P7), B13 (P2–P3) |
| Change Management | 5 | B13 (P8), B11 (AU) |
| **Total** | **31 mapped** | B11–B16 |

## Unmapped Controls

The following 35 controls from the 66-control baseline are operational or
procedural and do not map directly to SOC 2-style categories. They remain
documented in the baseline and governance policies:

- Backup retention/rotation schedules (BK-04, BK-07, BK-08)
- Escrow release and expiration procedures (BK-10, BK-11)
- Tenant lifecycle management (TI-04–TI-07)
- Key audit event details (SH-05, SH-10)
- Demo audit logging specifics (DM-04)
- Abuse audit trail (AB-05)
- Monitoring audit trail (MO-05)
- Audit sink configuration (AU-06)

These controls support the mapped controls and are referenced in operational
runbooks.

---

*B17-P1. All references verified against committed artifacts.*
