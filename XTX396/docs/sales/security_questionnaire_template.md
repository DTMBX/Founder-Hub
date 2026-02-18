# Security Questionnaire Response Template

> Evident Technologies — Pre-Populated Security Questionnaire
>
> Common questions from law firm procurement, IT security, and vendor
> risk management teams. Answers reference specific B13–B18 artifacts.

---

## Instructions

This template provides pre-drafted responses to frequently asked security
questions. Each answer includes a reference to the source artifact for
verification. Responses should be reviewed and customized for each
specific questionnaire before submission.

---

## Section 1: Organization & Governance

### Q1.1: Do you have a documented information security policy?

**Answer:** Yes. The platform maintains governance policies covering:

- Change management (`governance/change_management_policy.md`)
- Patch management (`governance/security/patch_management_policy.md`)
- Log retention (`governance/security/log_retention_policy.md`)
- Audit logging (`governance/ops/ops_audit_policy.md`)
- Protected paths (`governance/security/protected_paths_policy.md`)
- Break-glass emergency access (`governance/security/break_glass_playbook.md`)
- Restore drills (`governance/security/restore_drill_policy.md`)

### Q1.2: Do you conduct risk assessments?

**Answer:** Yes. A risk register is maintained with 12 identified risks,
scored using an Impact × Likelihood methodology aligned with STRIDE
threat modeling. The register is reviewed quarterly.

**Reference:** `docs/audit/RISK_REGISTER.md`, `docs/trust/THREAT_MODEL.md`

### Q1.3: Do you have a vulnerability management program?

**Answer:** Yes. Vulnerabilities are classified using CVSS v3.1 with
defined remediation SLAs: Critical (24h), High (7d), Medium (30d),
Low (90d). Dependency scanning runs on every build and weekly via
automated tools.

**Reference:** `docs/audit/VULNERABILITY_MANAGEMENT.md`

### Q1.4: Do you maintain an audit trail?

**Answer:** Yes. All operations generate structured audit events with
UUID, UTC timestamp, actor, and SHA-256 payload hash. Events are
append-only with 2–7 year retention.

**Reference:** `governance/ops/ops_audit_policy.md`,
`governance/security/log_retention_policy.md`

---

## Section 2: Access Control

### Q2.1: How is authentication implemented?

**Answer:** API keys are SHA-256 hashed before storage. The plaintext
key is returned once at creation and never persisted. Keys are bound
to a specific tenant and carry explicit permission scopes
(admin, export, read_only).

**Reference:** `ops/auth/ApiKeyManager.ts`

### Q2.2: How is authorization enforced?

**Answer:** Through a hierarchical scope model (admin > export > read_only)
enforced at the API key layer, and fail-closed tenant middleware that
rejects all requests without valid tenant context.

**Reference:** `ops/auth/ApiKeyManager.ts`,
`ops/tenancy/TenantContextMiddleware.ts`

### Q2.3: Do you conduct periodic access reviews?

**Answer:** Yes. Full access reviews are conducted quarterly. API key
audits and tenant status reviews are conducted monthly. Privileged
access is reviewed quarterly with MFA verification.

**Reference:** `docs/audit/ACCESS_REVIEW_PROCESS.md`

### Q2.4: How do you handle employee offboarding?

**Answer:** Access is revoked within 24 hours of departure. Dormant
accounts (90+ days inactive) are flagged for review. Accounts inactive
for 180+ days are suspended unless justified in writing.

**Reference:** `docs/audit/ACCESS_REVIEW_PROCESS.md` Section 4.3

### Q2.5: Do you support multi-factor authentication?

**Answer:** MFA is required for privileged access (repository admin,
CI/CD secret management, infrastructure). MFA for API key consumers
is not currently implemented — keys serve as the authentication factor.

---

## Section 3: Data Protection

### Q3.1: How is data encrypted at rest?

**Answer:** API keys are stored as SHA-256 hashes. Backup integrity
is protected with per-file SHA-256 hashing. Primary data storage
encryption is provided by the hosting infrastructure.

### Q3.2: How is data encrypted in transit?

**Answer:** All external communication uses HTTPS (TLS 1.2+).

### Q3.3: How is data isolated between tenants?

**Answer:** Fail-closed middleware rejects requests without valid
tenant context. Cross-tenant data access is prevented by
`assertSameTenant()` checks at every data boundary. Exports verify
tenant ownership of every record before inclusion.

**Reference:** `ops/tenancy/TenantContextMiddleware.ts`,
`ops/export/ExportIntegrity.ts`

### Q3.4: Do you sell or share customer data?

**Answer:** No. Customer data is used solely for service delivery.
No data is sold, shared with third parties for marketing, or used
for purposes beyond the contracted service.

### Q3.5: How is PII handled in logs?

**Answer:** Logs are minimized to avoid PII. Email addresses are
reduced to domain only, phone numbers to last 4 digits. IP addresses
are hashed or truncated after 30 days. API keys and secrets are
never logged.

**Reference:** `governance/security/log_retention_policy.md` Section 5

---

## Section 4: Availability & Business Continuity

### Q4.1: What are your uptime targets?

**Answer:** Tiered SLO targets: Public 99.0%, Professional 99.5%,
Internal 99.9%.

**Reference:** `ops/monitoring/SLOConfig.json`

### Q4.2: How are backups managed?

**Answer:** Automated backup bundles with per-file SHA-256 integrity
verification. Restore drills are conducted monthly. Anti-deletion
guards prevent mass or protected-path deletions.

**Reference:** `ops/backup/BackupService.ts`,
`governance/security/restore_drill_policy.md`

### Q4.3: Do you have a disaster recovery plan?

**Answer:** Backup and restore capabilities are implemented and tested
monthly. Artifact escrow provides independent custody of critical
data. A break-glass protocol enables emergency access with dual
authorization and independent logging.

**Reference:** `governance/security/break_glass_playbook.md`

### Q4.4: How do you handle abuse and denial of service?

**Answer:** Per-IP rate limiting (60 req/min), burst detection
(15 req/5s), and automatic soft bans (10 min). Rate limiting
is enforced at the application layer.

**Reference:** `ops/security/AbuseProtection.ts`

---

## Section 5: Incident Response

### Q5.1: Do you have an incident response process?

**Answer:** Yes. The vulnerability management process defines
severity classification, remediation SLAs, and escalation paths.
The break-glass protocol provides emergency access procedures.
The change management policy defines emergency change and
rollback procedures.

### Q5.2: How are incidents communicated to customers?

**Answer:** The transparency report template includes an incident
disclosure section. Communication follows the timeline defined
in the responsible disclosure process (acknowledgment within
48 hours, updates every 14 days).

**Reference:** `docs/trust/TRANSPARENCY_REPORT_TEMPLATE.md`

### Q5.3: Have you experienced any security breaches?

**Answer:** As of the date of this response, no security breaches
have been identified or reported.

---

## Section 6: Compliance

### Q6.1: Are you SOC 2 certified?

**Answer:** No. The control environment is structured to align with
SOC 2 Trust Service Categories. An internal audit readiness assessment
has been completed. External audit engagement is planned.

**Reference:** `docs/audit/B18_AUDIT_READINESS_SUMMARY.md`

### Q6.2: What compliance frameworks do you follow?

**Answer:** SOC 2 Trust Service Categories (structural alignment),
STRIDE threat modeling, CVSS v3.1 vulnerability scoring. No
certifications have been obtained yet.

### Q6.3: Can you provide evidence of your security controls?

**Answer:** Yes. An automated evidence bundle can be generated
containing test reports, dependency audits, governance documents,
and git history. All files are SHA-256 hashed with a verification
manifest. Available under NDA.

**Reference:** `scripts/audit/generate-evidence-bundle.ps1`

### Q6.4: Do you have third-party security assessments?

**Answer:** Not yet. Internal security assessment includes 401
automated tests, STRIDE threat modeling, and a 46-item audit
dry-run checklist. External penetration testing is planned.

---

## Section 7: Subprocessors

### Q7.1: What subprocessors do you use?

| Provider | Purpose | Data Access |
|---|---|---|
| Hosting provider | Application deployment | Infrastructure level |
| GitHub | Source control, CI/CD | Code only |
| npm registry | Dependency distribution | None (public packages) |

A formal subprocessor register will be published as part of the
SOC 2 preparation pathway.

---

## Response Metadata

| Field | Value |
|---|---|
| Prepared by | Security Compliance Lead |
| Date | [insert date] |
| Valid through | [insert date + 12 months] |
| Repository commit | [insert SHA] |
| Test count | 401 |

---

*All responses reflect implemented capabilities. Where capabilities
are planned but not yet deployed, this is stated explicitly.*
