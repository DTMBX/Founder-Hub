# Internal Audit Dry-Run Checklist

> B18-P8 | External Audit Preparation | Classification: Governance
>
> **Purpose:** Simulate an external auditor's evidence requests against the
> current control environment. Each item represents a question an auditor
> would ask, the expected evidence, and how to locate or reproduce it.

---

## Instructions

For each checklist item:

1. Read the **Auditor Request** — what the auditor would ask
2. Locate the **Evidence Source** — where the answer lives
3. Follow the **Reproduction Steps** — how to verify independently
4. Record the **Result** — Pass / Partial / Fail / N/A
5. Note any **Gaps** — missing evidence, incomplete documentation

---

## 1. Governance & Organization

### 1.1 Control Framework

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 1.1.1 | "Show me your control framework." | `docs/trust/CONTROL_MATRIX.md` | Open file; verify 31 controls mapped to 5 TSC categories | ☐ |
| 1.1.2 | "How many controls do you have?" | `docs/trust/B17_CONTROL_BASELINE.md` | Open file; count 66 controls across 10 categories | ☐ |
| 1.1.3 | "Map each control to evidence." | `docs/audit/CONTROL_EVIDENCE_MATRIX.md` | Open file; verify 38 controls with 76 evidence artifacts | ☐ |

### 1.2 Risk Management

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 1.2.1 | "Show me your risk register." | `docs/audit/RISK_REGISTER.md` | Open file; verify 12 risks with scoring | ☐ |
| 1.2.2 | "What is your threat model?" | `docs/trust/THREAT_MODEL.md` | Open file; verify STRIDE analysis, 24 threats | ☐ |
| 1.2.3 | "How do you score risks?" | `docs/audit/RISK_REGISTER.md` Section 2 | Verify Impact × Likelihood methodology | ☐ |
| 1.2.4 | "What are your high-priority risks?" | `docs/audit/RISK_REGISTER.md` Section 4 | Verify 2 High, 5 Medium, 4 Low, 1 Accepted Gap | ☐ |

### 1.3 Policies

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 1.3.1 | "Show me your change management policy." | `governance/change_management_policy.md` | Open file; verify branch protection, phase gates, rollback | ☐ |
| 1.3.2 | "Show me your patch management policy." | `governance/security/patch_management_policy.md` | Open file; verify scanning cadence, SLAs | ☐ |
| 1.3.3 | "Show me your log retention policy." | `governance/security/log_retention_policy.md` | Open file; verify retention durations, disposal | ☐ |
| 1.3.4 | "Show me your audit logging policy." | `governance/ops/ops_audit_policy.md` | Open file; verify event taxonomy, mandatory fields | ☐ |

---

## 2. Access Controls

### 2.1 Authentication

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 2.1.1 | "How are API keys stored?" | `ops/auth/ApiKeyManager.ts` | Inspect `create()` — SHA-256 hash only | ☐ |
| 2.1.2 | "Prove keys are never stored in plaintext." | `ops/__tests__/b16-multitenant.test.ts` P3 | Run tests: `npx vitest run ops/__tests__/b16-multitenant.test.ts` | ☐ |
| 2.1.3 | "How do you handle key revocation?" | `ops/auth/ApiKeyManager.ts` | Inspect `revoke()` — permanent, immediate | ☐ |
| 2.1.4 | "Show me your access review process." | `docs/audit/ACCESS_REVIEW_PROCESS.md` | Open file; verify quarterly cadence | ☐ |

### 2.2 Authorization

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 2.2.1 | "How are permissions scoped?" | `ops/auth/ApiKeyManager.ts` | Inspect `checkScope()` — admin > export > read_only | ☐ |
| 2.2.2 | "Show me tenant isolation enforcement." | `ops/tenancy/TenantContextMiddleware.ts` | Inspect `resolve()`, `assertSameTenant()` | ☐ |
| 2.2.3 | "Prove cross-tenant access is denied." | `ops/__tests__/b16-multitenant.test.ts` P1 | Run tests; verify denial assertions | ☐ |

---

## 3. Data Integrity

### 3.1 Export Integrity

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 3.1.1 | "How do you ensure export reproducibility?" | `ops/export/ExportIntegrity.ts` | Inspect deterministic ordering + canonical hashing | ☐ |
| 3.1.2 | "Show me export verification tests." | `ops/__tests__/b16-multitenant.test.ts` P7 | Run tests; verify reproducibility + tamper detection | ☐ |
| 3.1.3 | "How are exports watermarked?" | `ops/export/ExportIntegrity.ts` | Inspect `ExportWatermark` type | ☐ |

### 3.2 Backup Integrity

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 3.2.1 | "How are backups hashed?" | `ops/backup/BackupService.ts` | Inspect `createBundle()` — per-file SHA-256 | ☐ |
| 3.2.2 | "How often do you test restores?" | `governance/security/restore_drill_policy.md` | Verify monthly drill requirement | ☐ |
| 3.2.3 | "Show me restore verification tests." | `ops/__tests__/b13-backup.test.ts` P3 | Run tests; verify manifest + hash validation | ☐ |
| 3.2.4 | "How does artifact escrow work?" | `ops/backup/ArtifactEscrowService.ts` | Inspect deposit/verify/release lifecycle | ☐ |

---

## 4. Availability

### 4.1 Health Monitoring

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 4.1.1 | "What are your SLO targets?" | `ops/monitoring/SLOConfig.json` | Inspect targets: 99.0% / 99.5% / 99.9% | ☐ |
| 4.1.2 | "How do you enforce SLOs?" | `ops/monitoring/HealthMonitor.ts` | Inspect `checkSLO()` | ☐ |
| 4.1.3 | "Show me health monitoring tests." | `ops/__tests__/b16-multitenant.test.ts` P4 | Run tests; verify check + alert + SLO tests | ☐ |

### 4.2 Abuse Protection

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 4.2.1 | "How do you handle rate limiting?" | `ops/security/AbuseProtection.ts` | Inspect sliding window: 60 req/min | ☐ |
| 4.2.2 | "What happens during a burst?" | `ops/security/AbuseProtection.ts` | Inspect burst detection: 15 req / 5s | ☐ |
| 4.2.3 | "Show me abuse protection tests." | `ops/__tests__/b16-multitenant.test.ts` P5 | Run tests; verify rate + burst + ban tests | ☐ |

---

## 5. Change Management

### 5.1 Anti-Deletion

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 5.1.1 | "How do you prevent mass deletions?" | `ops/backup/AntiDeletionGuard.ts` | Inspect `evaluateDeletions()` — >25% threshold | ☐ |
| 5.1.2 | "Show me anti-deletion tests." | `ops/__tests__/b13-backup.test.ts` P8 | Run tests; verify 22 guard tests | ☐ |
| 5.1.3 | "What is the override process?" | `governance/security/protected_paths_policy.md` | Review override requirements | ☐ |

### 5.2 Audit Trail

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 5.2.1 | "Show me audit event structure." | `ops/automation/audit/OpsAuditLogger.ts` | Inspect event format: UUID, timestamp, actor, hash | ☐ |
| 5.2.2 | "What event categories exist?" | `governance/ops/ops_audit_policy.md` | Verify 9 category prefixes | ☐ |
| 5.2.3 | "How do you verify log integrity?" | `ops/automation/audit/verify.ts` | Inspect hash re-computation logic | ☐ |

---

## 6. Vulnerability Management

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 6.1 | "Show me your vulnerability management process." | `docs/audit/VULNERABILITY_MANAGEMENT.md` | Open file; verify classification, SLAs | ☐ |
| 6.2 | "What are your remediation SLAs?" | `docs/audit/VULNERABILITY_MANAGEMENT.md` Section 5 | Verify Critical: 24h, High: 7d, Medium: 30d | ☐ |
| 6.3 | "Run a dependency audit now." | Terminal | `npm audit` — inspect output | ☐ |
| 6.4 | "Show me your vulnerability tracker." | `docs/audit/vulnerability-log/` | Check for VULN-YYYY-NNN entries | ☐ |

---

## 7. Evidence Bundle

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 7.1 | "Generate an evidence bundle." | `scripts/audit/generate-evidence-bundle.ps1` | Run script; verify output directory | ☐ |
| 7.2 | "Verify bundle integrity." | Bundle `manifest.json` | Re-hash each file, compare to manifest | ☐ |
| 7.3 | "Is the bundle reproducible?" | Same commit + `npm ci` | Re-generate; compare file hashes (excl. timestamps) | ☐ |

---

## 8. Test Suite

| # | Auditor Request | Evidence Source | Reproduction Steps | Result |
|---|---|---|---|---|
| 8.1 | "Run the full test suite." | Terminal | `npx vitest run ops/__tests__/b13-backup.test.ts ops/__tests__/b14-onboarding.test.ts ops/__tests__/b15-toolhub.test.ts ops/__tests__/b16-multitenant.test.ts` | ☐ |
| 8.2 | "How many tests pass?" | Test output | Verify: 401 tests, 4 files, 0 failures | ☐ |
| 8.3 | "What do the tests cover?" | `docs/audit/CONTROL_EVIDENCE_MATRIX.md` | Cross-reference TEST evidence entries | ☐ |

---

## Dry-Run Summary Template

```markdown
## Internal Audit Dry-Run Results

**Date:** YYYY-MM-DD
**Reviewer:** [name]
**Commit:** [git SHA]

### Results

| Category | Items | Pass | Partial | Fail | N/A |
|---|---|---|---|---|---|
| Governance | 10 | | | | |
| Access Controls | 7 | | | | |
| Data Integrity | 7 | | | | |
| Availability | 6 | | | | |
| Change Management | 6 | | | | |
| Vulnerability Mgmt | 4 | | | | |
| Evidence Bundle | 3 | | | | |
| Test Suite | 3 | | | | |
| **Total** | **46** | | | | |

### Gaps Identified
1. [description]

### Remediation Actions
1. [action] — [target date]
```

---

## Checklist Statistics

- **Total items:** 46
- **Categories:** 8
- **Evidence sources referenced:** code, tests, policies, scripts, terminal
- **Estimated completion time:** 2–3 hours for internal reviewer

---

*B18-P8. Internal audit dry-run checklist established — 46 items across 8 categories.*
