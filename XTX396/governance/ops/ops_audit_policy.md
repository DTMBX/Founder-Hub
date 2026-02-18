<!-- B11 – Operations + Growth Automation Layer -->

# Ops Audit Policy

**Effective Date:** 2026-02-17
**Owner:** DTMBX
**Review Cadence:** Quarterly

---

## 1. Event Taxonomy

All ops automation actions emit structured audit events categorized as follows:

| Category Prefix | Domain        | Examples                               |
| --------------- | ------------- | -------------------------------------- |
| `lead.*`        | Lead capture  | created, updated, status_changed       |
| `client.*`      | Clients       | created, updated, archived             |
| `automation.*`  | Engine        | rule_triggered, completed, failed      |
| `message.*`     | Messaging     | draft_created, sent, send_failed       |
| `content.*`     | Content ops   | request_created, publish_triggered     |
| `crm.*`         | CRM sync      | sync_outbound, adapter_switched        |
| `console.*`     | Admin console | login, logout, action, safe_mode       |
| `settings.*`    | Configuration | updated                                |
| `system.*`      | Platform      | startup, error                         |

---

## 2. Event Structure

Every event must include:

| Field           | Type   | Required | Notes                        |
| --------------- | ------ | -------- | ---------------------------- |
| id              | UUID   | Yes      | Unique per event             |
| timestamp       | ISO8601| Yes      | UTC                          |
| category        | string | Yes      | From taxonomy above          |
| severity        | enum   | Yes      | info / warn / error / critical|
| actor           | string | Yes      | Username or 'system'         |
| description     | string | Yes      | Human-readable               |
| payload         | object | Yes      | Structured data              |
| payloadHash     | string | Yes      | SHA-256 of JSON payload      |
| correlationId   | string | No       | Links related events         |

---

## 3. Retention & Access Controls

| Property          | Requirement                  |
| ----------------- | ---------------------------- |
| Retention period  | 2 years minimum              |
| Storage format    | JSONL (append-only)          |
| Access            | Admin and Operator roles     |
| Modification      | Prohibited (append-only)     |
| Export            | Admin only, logged           |
| Deletion          | Requires Owner approval      |

---

## 4. Redaction Rules (PII Minimization)

| Data Type       | Rule                              |
| --------------- | --------------------------------- |
| Email addresses | Store domain only in payload      |
| Phone numbers   | Last 4 digits only                |
| Full names      | Permitted in lead/client events   |
| Messages        | Template ID only, not content     |
| IP addresses    | Not stored                        |
| Passwords       | Never stored                      |
| API keys/tokens | Never stored                      |

If PII must appear in a payload for operational reasons, it must be hashed
or redacted before logging.

---

## 5. Integrity Verification

- Every event payload is hashed with SHA-256 at creation time.
- Verification script (`ops/automation/audit/verify.ts`) validates all hashes.
- Integrity checks run as part of the weekly integrity report (B10-10).
- Any hash mismatch triggers an immediate investigation.

---

## 6. Sink Configuration

| Sink            | Environment | Default |
| --------------- | ----------- | ------- |
| localStorage    | Browser/dev | Yes     |
| JSONL file      | Server/CI   | Yes     |
| Database        | Production  | Future  |
| Object storage  | Archive     | Future  |

Sinks are pluggable via the `IAuditSink` interface.

---

*Last updated: 2026-02-17*
