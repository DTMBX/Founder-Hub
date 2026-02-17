# PII Handling Policy — Ops Layer

**Effective:** 2025-07-16  
**Scope:** All code under `/ops`  
**Owner:** Ops Security Engineering

---

## Purpose

This policy governs how personally identifiable information (PII) is handled
within the ops automation layer. It ensures that PII is never persisted in audit
logs, webhook payloads, or external-facing data unless explicitly necessary and
separately authorized.

---

## Definitions

**PII** includes any data element that, alone or in combination, could identify
a natural person:

| Field Category | Examples |
|---|---|
| Direct identifiers | Email address, phone number, SSN |
| Quasi-identifiers | Date of birth, street address |
| Credentials | Password, API key, token, secret |

---

## Rules

### 1. Redaction Before Logging

All data written to audit logs MUST be passed through `redactForAudit()` (from
`ops/security/pii/redact.ts`) before persistence.

**Rationale:** Audit logs are append-only and retained indefinitely. PII in
audit logs creates compliance risk and complicates data-subject access requests.

### 2. Redaction Before External Transmission

Webhook payloads and external API request bodies MUST be redacted before
transmission unless the external system is the authoritative source of that PII.

**Exception:** CRM systems that are the system-of-record for contact data may
receive unredacted contact fields during initial sync operations. All other
transmissions must be redacted.

### 3. Redaction Behavior

The `redactPii()` function applies the following transformations:

| Data Type | Redaction Format | Example |
|---|---|---|
| Email address | `***@domain.tld` | `***@example.com` |
| Phone number | `***XXXX` (last 4 digits) | `***1234` |
| SSN | `***-**-XXXX` (last 4 digits) | `***-**-5678` |
| All other PII fields | `***REDACTED***` | `***REDACTED***` |
| Embedded email in strings | `***@domain.tld` | Pattern-matched |
| Embedded SSN in strings | `***-**-XXXX` | Pattern-matched |

### 4. Field Detection

PII fields are identified by key name (case-insensitive match):

```
email, phone, ssn, socialsecuritynumber, dateofbirth, dob,
address, streetaddress, password, secret, token, apikey
```

String values are additionally scanned for embedded email patterns
(`user@domain.tld`) and SSN patterns (`XXX-XX-XXXX`).

### 5. Deep Clone Guarantee

`redactForAudit()` performs a deep clone before redaction. The original data
object is never mutated.

### 6. Nested Object Handling

Redaction is applied recursively through nested objects and arrays. No nesting
depth is exempt.

---

## Implementation Reference

| Component | Location |
|---|---|
| Redaction functions | `ops/security/pii/redact.ts` |
| Audit integration | `CrmAdapter.ts`, `MessageAdapter.ts` |
| Test coverage | `ops/__tests__/b11-hardening.test.ts` (D5 suite, 9 tests) |

---

## Compliance Notes

- This policy supports data minimization principles consistent with GDPR
  Article 5(1)(c) and CCPA data minimization guidance.
- This policy does not constitute legal advice. Consult counsel for
  jurisdiction-specific requirements.
- Redaction is deterministic and reproducible. The same input always produces
  the same redacted output.

---

## Review Schedule

This policy MUST be reviewed when:

1. New PII field types are introduced to the data model
2. New external integrations are added
3. Audit log retention requirements change
4. Regulatory guidance applicable to the deployment jurisdiction changes
