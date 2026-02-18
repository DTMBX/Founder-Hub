# Procurement FAQ

> Evident Technologies — Common Procurement Questions
>
> Answers reference implemented controls from chains B13–B18.
> Where capabilities are planned but not yet deployed, this is
> stated explicitly.

---

## Data Residency

**Q: Where is data stored?**

Data is stored in the deployment region configured at provisioning.
The current architecture supports single-region deployment. Geographic
redundancy across multiple regions is planned but not yet implemented.

**Q: Can data be restricted to a specific jurisdiction?**

Yes. Tenant data is logically isolated and can be provisioned within
a specific deployment region. Cross-region data transfer does not
occur unless explicitly configured.

**Q: Is data stored outside the primary region for backup purposes?**

Currently, backups are stored in the same region as primary data.
Cross-region backup replication is on the governance roadmap.

---

## Encryption

**Q: Is data encrypted at rest?**

Backup bundles are integrity-protected with per-file SHA-256 hashing.
Encryption at rest for primary data storage depends on the hosting
provider's storage encryption capabilities. API keys are stored as
SHA-256 hashes — the plaintext key is returned once at creation and
never persisted.

**Q: Is data encrypted in transit?**

All client-server communication uses HTTPS (TLS 1.2+). Internal
service communication follows the same transport security standard.

**Q: How are encryption keys managed?**

API key secrets are hashed (SHA-256) before storage. The platform
does not maintain a key management service (KMS) for data encryption
keys — this is delegated to the hosting infrastructure provider.

---

## Log Retention

**Q: How long are audit logs retained?**

| Log Category | Minimum Retention | Maximum Retention |
|---|---|---|
| Security events | 2 years | 7 years |
| Authentication | 2 years | 7 years |
| Access control | 2 years | 7 years |
| Export operations | 2 years | 7 years |
| Backup operations | 2 years | 5 years |
| Tenant lifecycle | 2 years | 5 years |
| Health monitoring | 1 year | 3 years |
| Administrative | 2 years | 7 years |

Full policy: `governance/security/log_retention_policy.md`

**Q: Can logs be deleted on request?**

No. Audit logs are append-only. Disposal occurs only after the
maximum retention period, subject to litigation holds and active
investigations. Selective deletion is prohibited.

---

## Incident Response

**Q: Do you have an incident response process?**

Yes. The platform maintains:

- A vulnerability management process with CVSS-based severity
  classification and defined remediation SLAs
  (Critical: 24h, High: 7d, Medium: 30d)
- A break-glass emergency access protocol with dual-authorization
  and independent logging
- A change management policy with emergency change procedures
  and rollback capability

**Q: Have you had any security incidents?**

As of the date of this document, no security incidents have been
reported or identified.

**Q: How are vulnerabilities reported?**

Through the responsible disclosure process. Reports are acknowledged
within 48 hours, assessed within 7 days, and updated at least every
14 days until resolution.

---

## Access Controls

**Q: How is access controlled?**

| Layer | Mechanism |
|---|---|
| Tenant access | Fail-closed middleware — deny by default |
| API authentication | SHA-256 hashed keys with tenant binding |
| Permission scopes | Hierarchical: admin > export > read_only |
| Administrative access | Quarterly review, MFA required |
| Emergency access | Break-glass protocol, dual authorization |

**Q: How often are access rights reviewed?**

- Full access review: quarterly
- API key audit: monthly
- Tenant status review: monthly
- Privileged access review: quarterly
- Break-glass review: after each activation

Full procedure: `docs/audit/ACCESS_REVIEW_PROCESS.md`

**Q: What happens when an employee leaves?**

Access is revoked within 24 hours of departure. This is documented
in the access review procedure under dormant account handling.

---

## Vendor and Subprocessor Posture

**Q: Do you use subprocessors?**

The platform's subprocessor footprint is minimal. Current dependencies:

| Category | Provider | Purpose |
|---|---|---|
| Hosting | Deployment provider | Application hosting |
| Source control | GitHub | Code repository, CI/CD |
| Dependencies | npm registry | Package distribution |

A formal subprocessor register will be published as part of the
SOC 2 preparation pathway.

**Q: Do you sell or share customer data?**

No. Customer data is used solely for the purpose of providing the
contracted service. No customer data is sold, shared with third
parties for marketing, or used for purposes beyond service delivery.

---

## Compliance

**Q: Are you SOC 2 certified?**

No. The control environment has been structured to align with SOC 2
Trust Service Categories (Security, Availability, Confidentiality,
Processing Integrity, Change Management), and an internal audit
readiness assessment has been completed. External audit engagement
is a planned next step.

**Q: What compliance frameworks do you align with?**

- SOC 2 Trust Service Categories (structural alignment, not certified)
- STRIDE threat modeling methodology
- CVSS v3.1 vulnerability scoring

**Q: Can you provide evidence of your controls?**

Yes. An automated evidence bundle can be generated on request,
containing test reports, dependency audits, governance documents,
and git history. All files are SHA-256 hashed with a manifest
for integrity verification.

---

## Business Continuity

**Q: What are your SLO targets?**

| Tier | Uptime Target |
|---|---|
| Public | 99.0% |
| Professional | 99.5% |
| Internal | 99.9% |

**Q: How do you handle backups?**

- Automated backup bundles with per-file SHA-256 integrity
- Monthly restore drills to verify recoverability
- Anti-deletion guards preventing mass or protected-path deletions
- Artifact escrow with chain-of-custody verification

---

*Answers reflect implemented capabilities. Planned capabilities are
identified with explicit future-tense language.*
