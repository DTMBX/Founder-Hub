# Access Review Procedure

> B18-P4 | External Audit Preparation | Classification: Governance
>
> **Effective Date:** Upon merge to production branch
> **Owner:** Security Compliance Lead
> **Review Cadence:** Quarterly

---

## 1. Purpose

This procedure defines how access rights across the Evident Technologies
platform are reviewed, validated, and adjusted on a recurring basis. The
goal is to ensure that access privileges remain appropriate, that stale
credentials are revoked, and that evidence of each review is retained for
audit purposes.

---

## 2. Scope

### 2.1 Systems Under Review

| System | Access Type | Managed By |
|---|---|---|
| Repository (GitHub) | Collaborator roles | Repository admin |
| CI/CD (GitHub Actions) | Workflow permissions, secrets | Repository admin |
| API Keys | Tenant-scoped keys | `ApiKeyManager` |
| Tenant Accounts | Tenant status (active/suspended) | `TenantContextMiddleware` |
| Infrastructure | Server/hosting access | Platform engineer |
| Audit Logs | Read access | Security Compliance Lead |
| Evidence Bundles | Read/export access | Security Compliance Lead |

### 2.2 Out of Scope

- End-user accounts within client-facing applications (managed by clients)
- Third-party SaaS tool access (managed separately per vendor policy)

---

## 3. Review Schedule

| Review Type | Frequency | Reviewer | Documentation |
|---|---|---|---|
| Full access review | Quarterly | Security Compliance Lead | Access Review Report |
| API key audit | Monthly | Platform engineer | Key Audit Log |
| Tenant status review | Monthly | Platform engineer | Tenant Status Report |
| Break-glass review | After each activation | Security Compliance Lead | Break-Glass Report |
| Privileged access review | Quarterly | Security Compliance Lead | Privileged Access Report |

---

## 4. Full Access Review Procedure

### 4.1 Preparation

1. Export current access list for each system in scope
2. Obtain the previous review report for comparison
3. Identify any personnel changes since last review (joins, departures,
   role changes)

### 4.2 Review Steps

For each system:

| Step | Action | Evidence Produced |
|---|---|---|
| 1 | List all accounts with access | Account inventory |
| 2 | Verify each account belongs to an active team member | Validated roster |
| 3 | Verify access level matches current role | Role-access mapping |
| 4 | Identify dormant accounts (no activity in 90+ days) | Dormant account list |
| 5 | Identify over-privileged accounts | Exception list |
| 6 | Revoke or downgrade inappropriate access | Remediation log |
| 7 | Document findings and sign off | Access Review Report |

### 4.3 Dormant Account Handling

| Dormancy Period | Action |
|---|---|
| 90–180 days | Flag for review, contact account owner |
| 180+ days | Suspend or revoke unless justified in writing |
| Departed personnel | Immediate revocation (within 24 hours of departure) |

### 4.4 Completion

- Access Review Report filed in `docs/audit/access-reviews/`
- Naming convention: `ACCESS_REVIEW_YYYY_QN.md` (e.g., `ACCESS_REVIEW_2025_Q1.md`)
- Report retained for minimum 2 years

---

## 5. API Key Audit Procedure

### 5.1 Monthly Review Steps

1. Query all active API keys from `ApiKeyManager`
2. For each key, verify:
   - Associated tenant is active (not suspended)
   - Scope matches tenant's service tier
   - Key has been used within the last 90 days
   - Key was created by an authorized actor
3. Revoke keys that fail any verification check
4. Document findings in the Key Audit Log

### 5.2 Key Lifecycle Events

All key lifecycle events are logged by `OpsAuditLogger` under the
`AUTH.*` category:

| Event | Log Action |
|---|---|
| Key creation | `AUTH.KEY_CREATE` |
| Key validation | `AUTH.KEY_VALIDATE` |
| Key revocation | `AUTH.KEY_REVOKE` |
| Scope check | `AUTH.SCOPE_CHECK` |

### 5.3 Revocation Criteria

A key must be revoked if:

- The associated tenant has been suspended
- The key has not been used in 90+ days and no justification exists
- The key's scope exceeds the tenant's authorized tier
- A security incident involves or may involve the key

Revocation is permanent and immediate (see `ApiKeyManager.revoke()`).

---

## 6. Tenant Status Review Procedure

### 6.1 Monthly Review Steps

1. List all active tenants from `TenantModel`
2. Verify each tenant has:
   - A valid configuration
   - At least one active API key
   - Activity within the last 90 days
3. Flag tenants with no activity for suspension review
4. Verify suspended tenants are denied access (confirm middleware enforcement)
5. Document findings in the Tenant Status Report

### 6.2 Suspension Criteria

| Condition | Action |
|---|---|
| No activity for 180+ days | Flag for suspension |
| Billing delinquency | Suspend per billing policy |
| Security concern | Immediate suspension + investigation |
| Client request | Suspend per written request |

---

## 7. Privileged Access Review

### 7.1 Privileged Roles

| Role | Privileges | Justification Required |
|---|---|---|
| Repository admin | Full repo access, branch protection, secrets | Business need + background check |
| CI/CD secret manager | Workflow secret access | Platform engineering role |
| Infrastructure admin | Server access, deployment | Platform engineering role |
| Break-glass holder | Emergency override capability | Security Compliance Lead approval |

### 7.2 Review Steps

1. List all accounts with privileged access
2. Verify each account has documented justification
3. Verify multi-factor authentication is enabled
4. Review activity logs for unusual patterns
5. Confirm least-privilege principle is maintained
6. Document findings in the Privileged Access Report

---

## 8. Evidence Retention

| Evidence | Retention | Storage |
|---|---|---|
| Access Review Reports | 2 years minimum | `docs/audit/access-reviews/` |
| Key Audit Logs | 2 years minimum | `ADMIN.*` audit log |
| Tenant Status Reports | 2 years minimum | `docs/audit/access-reviews/` |
| Remediation Logs | 2 years minimum | `ADMIN.*` audit log |
| Break-Glass Reports | 7 years | Secure storage per break-glass playbook |

---

## 9. Escalation

| Finding | Escalation Path |
|---|---|
| Unauthorized access detected | Security Compliance Lead → Incident response |
| Over-privileged account (non-urgent) | Documented in report → Remediated in 7 days |
| Departed personnel with active access | Immediate revocation → Document in report |
| Break-glass activation without authorization | Security Compliance Lead → Legal counsel |

---

## 10. Compliance Mapping

| Requirement | SOC 2 Category | Control Reference |
|---|---|---|
| Periodic access review | Security | SH-07 |
| API key lifecycle management | Security | SH-01, SH-04 |
| Tenant isolation verification | Confidentiality | TI-02, TI-03 |
| Privileged access review | Security | SH-08 |
| Evidence retention | Change Management | AU-03 |

---

*B18-P4. Access review procedure established.*
