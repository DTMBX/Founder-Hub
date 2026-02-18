# Transparency Report v1

> Evident Technologies — Operational Transparency Statement
>
> This report describes operational practices, data handling,
> and security posture. It is published in the interest of
> transparency and accountability.

---

## 1. Data Handling Overview

Evident Technologies processes digital evidence and related
operational data on behalf of its clients.

### Data Categories

| Category | Description | Handling |
|---|---|---|
| Evidence data | Digital evidence submitted by clients | Immutable storage, deterministic processing |
| Operational data | System logs, health checks, SLO metrics | Append-only audit trail |
| Authentication data | API keys, tenant identifiers | SHA-256 hashed storage |
| Configuration data | Tenant settings, tool manifests | Versioned, auditable |

### Data Processing Principles

- **Immutability:** Original evidence is never modified
- **Determinism:** Processing pipelines produce identical output from identical input
- **Minimization:** Logs exclude PII beyond operational necessity
- **Integrity:** SHA-256 hashing at every trust boundary

---

## 2. No-Sale-of-Data Statement

Evident Technologies does not sell, rent, lease, or otherwise
transfer customer data to third parties for purposes unrelated
to service delivery.

Customer data is used solely for:

- Providing the contracted evidence management service
- Maintaining system integrity and security
- Complying with applicable legal obligations

No customer data is used for advertising, marketing analytics,
or profiling.

---

## 3. Incident Handling Summary

### Current Incident Status

As of the publication date of this report, Evident Technologies
has not experienced any security incidents, data breaches, or
unauthorized access events.

### Incident Response Capabilities

The platform maintains:

- A vulnerability management process with CVSS-based severity
  classification and defined remediation SLAs
- A break-glass emergency access protocol with dual authorization
- A change management policy with emergency change and rollback procedures
- Responsible disclosure process for external vulnerability reports

### Incident Notification

In the event of a security incident affecting customer data:

1. Affected parties will be notified within the timeframe required
   by applicable law and contractual obligations
2. The notification will include: nature of the incident, data
   affected, remediation steps taken, and preventive measures
3. Updates will be provided at least every 14 days until resolution

---

## 4. Subprocessor Disclosure

### Current Subprocessors

| Provider | Purpose | Data Access Level |
|---|---|---|
| Hosting provider | Application deployment and infrastructure | Infrastructure-level access |
| GitHub | Source control and CI/CD pipeline | Code repository access |
| npm registry | Dependency distribution | No customer data access |

### Subprocessor Governance

- Subprocessors are selected based on security posture and
  operational necessity
- A formal subprocessor register will be published as part of
  SOC 2 preparation
- Material changes to subprocessors will be communicated to
  customers with reasonable advance notice

---

## 5. Audit Readiness Statement

Evident Technologies has completed an internal audit readiness
assessment. The current posture is:

**Internal-Audit Ready**

This means:

- 66 controls are documented across 10 categories
- 38 controls are mapped to SOC 2-style Trust Service Categories
- 76 evidence artifacts are traceable to specific controls
- 401 automated tests verify control implementation
- Evidence collection is automated via a single-command bundle
- A 46-item internal audit dry-run checklist is available
- 12 risks are identified and scored in a risk register

### What This Does Not Mean

- Evident is **not** SOC 2 Type I or Type II certified
- No external audit has been conducted
- No external penetration test has been completed
- This statement is not an attestation by any third party

External audit engagement is a planned next step on the compliance
roadmap.

---

## 6. Security Practice Summary

| Practice | Implementation |
|---|---|
| Dependency scanning | `npm audit` on every build + weekly automated scan |
| Access review | Quarterly full review, monthly API key audit |
| Vulnerability SLAs | Critical: 24h, High: 7d, Medium: 30d |
| Log retention | 2–7 years, append-only, integrity-verified |
| Backup verification | Monthly restore drills |
| Change management | Branch protection, phase gates, pre-merge testing |
| Emergency access | Break-glass protocol with dual authorization |

---

## 7. Report Metadata

| Field | Value |
|---|---|
| Report version | v1 |
| Publication date | [insert date] |
| Next scheduled update | [insert date + 12 months] |
| Prepared by | Security Compliance Lead |
| Repository commit | [insert SHA] |

---

## 8. Contact

For questions about this transparency report or Evident's security
practices, contact the security team at the address published in
the security.txt file.

---

*This report reflects operational practices as of the publication
date. It is not a certification, attestation, or legal guarantee.
Updates will be published at least annually or upon material change.*
