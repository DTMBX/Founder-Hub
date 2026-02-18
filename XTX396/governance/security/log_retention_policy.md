# Operational Log Retention Policy

> B18-P3 | External Audit Preparation | Classification: Governance
>
> **Effective Date:** Upon merge to production branch
> **Owner:** Security Compliance Lead
> **Review Cadence:** Annually or upon material system change

---

## 1. Purpose

This policy defines retention durations, access controls, integrity
protections, and minimization requirements for all operational logs generated
by the Evident Technologies platform.

Operational logs serve three functions:

1. **Forensic reconstruction** — enabling timeline analysis of system events
2. **Compliance evidence** — demonstrating adherence to controls during audits
3. **Incident response** — supporting root-cause analysis and remediation

---

## 2. Scope

This policy covers all log categories defined in the
[ops audit policy](../ops/ops_audit_policy.md):

| Prefix | Category | Examples |
|---|---|---|
| `TENANT.*` | Tenant lifecycle | create, suspend, activate, configure |
| `AUTH.*` | Authentication | key create, validate, revoke, scope check |
| `ACCESS.*` | Access control | middleware resolve, deny, cross-tenant attempt |
| `EXPORT.*` | Export operations | create, verify, integrity check |
| `BACKUP.*` | Backup lifecycle | create, restore, verify, escrow deposit |
| `MONITOR.*` | Health & SLO | health check, SLO evaluation, alert |
| `SECURITY.*` | Security events | rate limit, burst detect, soft ban |
| `DEMO.*` | Demo guard | feature block, row limit, export limit |
| `ADMIN.*` | Administrative | config change, policy update, override |

---

## 3. Retention Durations

| Log Category | Minimum Retention | Maximum Retention | Rationale |
|---|---|---|---|
| `SECURITY.*` | 2 years | 7 years | Incident investigation, compliance |
| `AUTH.*` | 2 years | 7 years | Access audit trail |
| `ACCESS.*` | 2 years | 7 years | Tenant isolation verification |
| `EXPORT.*` | 2 years | 7 years | Evidence chain of custody |
| `BACKUP.*` | 2 years | 5 years | Disaster recovery verification |
| `TENANT.*` | 2 years | 5 years | Tenant lifecycle audit |
| `MONITOR.*` | 1 year | 3 years | SLO compliance history |
| `DEMO.*` | 1 year | 2 years | Abuse detection review |
| `ADMIN.*` | 2 years | 7 years | Administrative accountability |

### Retention Start

Retention periods begin from the UTC timestamp of the log entry.

### Extension

Retention may be extended if logs are:

- Subject to a litigation hold
- Part of an active incident investigation
- Required by a regulatory authority

---

## 4. Log Format & Integrity

### 4.1 Format

All operational logs are stored in **JSONL** (JSON Lines) format:

- One JSON object per line
- UTF-8 encoding
- No multi-line entries

### 4.2 Mandatory Fields

Every log entry must include:

| Field | Type | Description |
|---|---|---|
| `id` | UUID v4 | Unique event identifier |
| `timestamp` | ISO 8601 | UTC event time |
| `category` | string | Event category prefix |
| `action` | string | Specific action performed |
| `actor` | string | System or user identifier |
| `payloadHash` | SHA-256 | Hash of the event payload |

### 4.3 Integrity

- Log entries are **append-only** — no modification or deletion
- Each entry includes a SHA-256 `payloadHash` for tamper detection
- Logs must be stored on media that enforces write-once semantics
  or uses equivalent access controls to prevent overwrite

### 4.4 Verification

Log integrity can be verified by:

1. Re-computing the SHA-256 hash of each entry's payload
2. Comparing against the stored `payloadHash`
3. Confirming sequential timestamps (no backdated entries)
4. Validating UUID uniqueness across the log stream

---

## 5. Data Minimization

### 5.1 PII Avoidance

Logs must NOT contain:

- Full email addresses (domain only: `user@→ *@example.com`)
- Full phone numbers (last 4 digits only)
- IP addresses in long-term storage (hash or truncate after 30 days)
- API keys or secrets (never logged, even partially)
- Personally identifiable information beyond operational necessity

### 5.2 Payload Scope

Log payloads should include only:

- System identifiers (tenant ID, key ID, export ID)
- Operation metadata (action, status, duration)
- Error codes and categories (not stack traces in production)
- Quantitative measures (row counts, file sizes, response times)

### 5.3 Review

Data minimization compliance is reviewed during each access review
cycle (see B18-P4).

---

## 6. Access Controls

### 6.1 Read Access

| Role | Access Level |
|---|---|
| Security Compliance Lead | Full read access to all log categories |
| Platform Engineer | Read access to `MONITOR.*`, `BACKUP.*`, `DEMO.*` |
| Audit Personnel | Read access to all categories during audit engagement |
| External Counsel | Read access upon written authorization |

### 6.2 Write Access

- Only the **OpsAuditLogger** system component may write log entries
- No human actor may directly write, modify, or delete log entries
- Administrative overrides require break-glass authorization
  (see break-glass playbook)

### 6.3 Export

- Log exports for audit purposes must be generated through the
  evidence bundle process (see B18-P2)
- Exported logs inherit the same retention requirements as originals

---

## 7. Disposal

### 7.1 Process

When a log entry exceeds its maximum retention period:

1. Confirm no litigation hold or active investigation applies
2. Record the disposal action in the `ADMIN.*` log category
3. Securely delete the log data (overwrite or cryptographic erasure)
4. Retain the disposal record for the `ADMIN.*` retention period

### 7.2 Prohibition

- Logs must NOT be disposed of before their minimum retention period
- Disposal must NOT be performed during an active audit engagement
- Selective disposal (deleting specific entries) is prohibited —
  disposal operates on complete time-bounded segments only

---

## 8. Compliance Mapping

| Requirement | SOC 2 Category | Control Reference |
|---|---|---|
| Append-only retention | Security | AU-03 |
| Structured event taxonomy | Change Management | AU-01 |
| Mandatory event fields | Change Management | AU-02 |
| PII redaction | Confidentiality | AU-04 |
| Integrity verification | Processing Integrity | AU-05 |

---

## 9. Exceptions

No exceptions to minimum retention periods are permitted without
written authorization from the Security Compliance Lead and legal
counsel.

Temporary logging reductions (e.g., during a performance emergency)
must be:

1. Documented in the `ADMIN.*` log
2. Limited to 24 hours maximum
3. Restored to full logging immediately after resolution

---

*B18-P3. Operational log retention policy established.*
