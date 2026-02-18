# Risk Register

> B18-P7 | External Audit Preparation | Classification: Governance
>
> **Effective Date:** Upon merge to production branch
> **Owner:** Security Compliance Lead
> **Review Cadence:** Quarterly

---

## 1. Purpose

This register documents identified risks to the Evident Technologies platform,
their assessed impact and likelihood, implemented mitigations, residual risk
levels, and review schedules. It aligns with the STRIDE threat model (B17-P2)
and extends it into an operational risk management framework.

---

## 2. Risk Assessment Methodology

### 2.1 Impact Scale

| Level | Score | Description |
|---|---|---|
| Critical | 5 | Platform-wide compromise, evidence integrity loss, legal liability |
| High | 4 | Major feature unavailability, data exposure for single tenant |
| Medium | 3 | Degraded service, partial data access concern |
| Low | 2 | Minor inconvenience, no data impact |
| Negligible | 1 | Cosmetic, informational only |

### 2.2 Likelihood Scale

| Level | Score | Description |
|---|---|---|
| Almost Certain | 5 | Expected to occur within review period |
| Likely | 4 | More likely than not within review period |
| Possible | 3 | Could occur but not expected |
| Unlikely | 2 | Conceivable but improbable |
| Rare | 1 | Extraordinary circumstances only |

### 2.3 Risk Rating

Risk Rating = Impact × Likelihood

| Rating | Range | Treatment |
|---|---|---|
| Critical | 20–25 | Immediate remediation required |
| High | 12–19 | Remediation within current quarter |
| Medium | 6–11 | Remediation planned, monitored quarterly |
| Low | 1–5 | Accepted with documentation, reviewed annually |

---

## 3. Risk Register

### RISK-001: Dependency Supply Chain Compromise

| Field | Value |
|---|---|
| ID | RISK-001 |
| Category | STRIDE: Tampering |
| Description | A compromised npm package introduces malicious code into the build |
| Impact | Critical (5) |
| Likelihood | Unlikely (2) |
| Risk Rating | 10 — Medium |
| Mitigation | `npm audit`, Dependabot alerts, lockfile integrity, `npm ci` in CI |
| Residual Risk | Medium — no runtime code signing; relies on npm registry integrity |
| Control References | SH-10, SH-11, Patch management policy |
| Review Cadence | Monthly |

---

### RISK-002: API Key Compromise

| Field | Value |
|---|---|
| ID | RISK-002 |
| Category | STRIDE: Spoofing |
| Description | An API key is leaked or stolen, enabling unauthorized tenant access |
| Impact | High (4) |
| Likelihood | Possible (3) |
| Risk Rating | 12 — High |
| Mitigation | Hash-only storage, immediate revocation, tenant-scoped binding, secret scanning |
| Residual Risk | Medium — key transmitted in plaintext over HTTPS; depends on transport security |
| Control References | SH-01, SH-02, SH-04, TI-02 |
| Review Cadence | Monthly (API key audit) |

---

### RISK-003: Cross-Tenant Data Leakage

| Field | Value |
|---|---|
| ID | RISK-003 |
| Category | STRIDE: Information Disclosure |
| Description | A bug or misconfiguration exposes one tenant's data to another |
| Impact | Critical (5) |
| Likelihood | Rare (1) |
| Risk Rating | 5 — Low |
| Mitigation | Fail-closed middleware, `assertSameTenant()`, export tenant-scoping, 13 isolation tests |
| Residual Risk | Low — extensive test coverage but no formal penetration testing yet |
| Control References | TI-02, TI-03, EX-04 |
| Review Cadence | Quarterly |

---

### RISK-004: Backup Integrity Failure

| Field | Value |
|---|---|
| ID | RISK-004 |
| Category | STRIDE: Tampering |
| Description | Backup data is corrupted or tampered with, undetected until restore |
| Impact | High (4) |
| Likelihood | Unlikely (2) |
| Risk Rating | 8 — Medium |
| Mitigation | Per-file SHA-256 hashing, manifest verification, monthly restore drills |
| Residual Risk | Low — drills detect corruption; no geographic redundancy yet |
| Control References | BK-01, BK-03, BK-06 |
| Review Cadence | Monthly (restore drill) |

---

### RISK-005: Audit Log Tampering

| Field | Value |
|---|---|
| ID | RISK-005 |
| Category | STRIDE: Repudiation |
| Description | An attacker or insider modifies or deletes audit log entries |
| Impact | Critical (5) |
| Likelihood | Rare (1) |
| Risk Rating | 5 — Low |
| Mitigation | Append-only policy, SHA-256 payload hashing, write-restricted access, break-glass logging |
| Residual Risk | Low — no independent log store yet (same infrastructure as application) |
| Control References | AU-03, AU-05, BG-03 |
| Review Cadence | Quarterly |

---

### RISK-006: Denial of Service via Abuse

| Field | Value |
|---|---|
| ID | RISK-006 |
| Category | STRIDE: Denial of Service |
| Description | Excessive requests degrade platform availability for legitimate users |
| Impact | Medium (3) |
| Likelihood | Possible (3) |
| Risk Rating | 9 — Medium |
| Mitigation | Per-IP rate limiting (60 req/min), burst detection (15/5s), soft ban (10 min) |
| Residual Risk | Medium — no distributed rate limiting; single-node enforcement |
| Control References | AB-01, AB-02, AB-03 |
| Review Cadence | Quarterly |

---

### RISK-007: Unauthorized Privilege Escalation

| Field | Value |
|---|---|
| ID | RISK-007 |
| Category | STRIDE: Elevation of Privilege |
| Description | A user or API key gains access beyond its authorized scope |
| Impact | High (4) |
| Likelihood | Unlikely (2) |
| Risk Rating | 8 — Medium |
| Mitigation | Scoped permissions (admin > export > read_only), scope hierarchy enforcement, access review |
| Residual Risk | Low — no RBAC at application layer beyond API key scopes |
| Control References | SH-03, SH-07, SH-08 |
| Review Cadence | Quarterly (access review) |

---

### RISK-008: Mass Data Deletion (Accidental or Malicious)

| Field | Value |
|---|---|
| ID | RISK-008 |
| Category | STRIDE: Denial of Service |
| Description | Large-scale file deletion — accidental commit or insider threat |
| Impact | High (4) |
| Likelihood | Unlikely (2) |
| Risk Rating | 8 — Medium |
| Mitigation | AntiDeletionGuard (>25% threshold), protected paths, override audit logging |
| Residual Risk | Low — guard is pre-commit advisory; enforcement depends on hook installation |
| Control References | SP-01, SP-02, SP-03, SP-05 |
| Review Cadence | Quarterly |

---

### RISK-009: Export Non-Reproducibility

| Field | Value |
|---|---|
| ID | RISK-009 |
| Category | STRIDE: Tampering |
| Description | An export cannot be independently reproduced, undermining evidentiary value |
| Impact | High (4) |
| Likelihood | Rare (1) |
| Risk Rating | 4 — Low |
| Mitigation | Deterministic ordering, canonical JSON hashing, watermarking, verification on consumption |
| Residual Risk | Low — well-tested; 12 export integrity tests |
| Control References | EX-01, EX-03, EX-05, EX-06 |
| Review Cadence | Quarterly |

---

### RISK-010: Stale Governance Documentation

| Field | Value |
|---|---|
| ID | RISK-010 |
| Category | Operational |
| Description | Policies and procedures become outdated, creating gaps between documented and actual controls |
| Impact | Medium (3) |
| Likelihood | Possible (3) |
| Risk Rating | 9 — Medium |
| Mitigation | Annual review cadence, chain-based changelog, change management policy |
| Residual Risk | Medium — dependent on manual review discipline |
| Control References | AU-01, Change management policy |
| Review Cadence | Annually |

---

### RISK-011: Single Point of Failure — Personnel

| Field | Value |
|---|---|
| ID | RISK-011 |
| Category | Operational |
| Description | Key knowledge held by single individual; departure creates capability gap |
| Impact | High (4) |
| Likelihood | Possible (3) |
| Risk Rating | 12 — High |
| Mitigation | Comprehensive documentation (B17–B18), code comments, test suite as specification |
| Residual Risk | High — small team; no formal knowledge transfer process |
| Control References | B17 trust documents, B18 audit documents |
| Review Cadence | Quarterly |

---

### RISK-012: No External Penetration Testing

| Field | Value |
|---|---|
| ID | RISK-012 |
| Category | Security |
| Description | No third-party security assessment has validated the control environment |
| Impact | Medium (3) |
| Likelihood | N/A (gap, not threat) |
| Risk Rating | N/A — Accepted gap |
| Mitigation | Internal test coverage (401 tests), STRIDE model, code review process |
| Residual Risk | Medium — undiscovered vulnerabilities may exist |
| Control References | THREAT_MODEL.md |
| Review Cadence | Annual (assess feasibility of engagement) |

---

## 4. Risk Summary

| Rating | Count | Risk IDs |
|---|---|---|
| Critical | 0 | — |
| High | 2 | RISK-002, RISK-011 |
| Medium | 5 | RISK-001, RISK-004, RISK-006, RISK-007, RISK-008 |
| Low | 4 | RISK-003, RISK-005, RISK-009, RISK-010 |
| Accepted Gap | 1 | RISK-012 |

---

## 5. Risk Treatment Plan

### High-Priority Actions

| Risk | Action | Target |
|---|---|---|
| RISK-002 | Implement API key rotation capability | Next development chain |
| RISK-011 | Formalize knowledge transfer documentation | Next quarter |

### Medium-Priority Monitoring

| Risk | Action | Cadence |
|---|---|---|
| RISK-001 | Continue dependency scanning, evaluate code signing | Monthly |
| RISK-004 | Continue monthly restore drills, evaluate geo-redundancy | Monthly |
| RISK-006 | Evaluate distributed rate limiting when scaling | Quarterly |
| RISK-007 | Continue access reviews, evaluate application-layer RBAC | Quarterly |
| RISK-008 | Verify pre-commit hook installation across team | Quarterly |

---

## 6. Compliance Mapping

This register satisfies the following audit requirements:

| Requirement | SOC 2 Category | Evidence |
|---|---|---|
| Risk identification | Security | This register |
| Risk assessment methodology | Security | Section 2 |
| Risk treatment | Security | Section 5 |
| Residual risk documentation | Security | Each risk entry |
| Periodic risk review | Change Management | Review cadence per risk |

---

*B18-P7. Risk register established with 12 identified risks, aligned to STRIDE threat model.*
