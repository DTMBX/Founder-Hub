# CRM Integration Policy — B11-04

## Purpose

This policy governs outbound CRM synchronization from the Ops automation layer.

## Adapter Architecture

All CRM integrations are implemented through the `ICrmAdapter` interface:

| Adapter              | Type      | External Dependency  |
| -------------------- | --------- | -------------------- |
| LocalJsonCrmAdapter  | Local     | None                 |
| WebhookCrmAdapter    | Outbound  | Configured endpoint  |

Additional adapters (e.g., HubSpot, Salesforce) may be added by implementing
`ICrmAdapter`. No paid vendor lock-in is permitted by default.

## Safe Mode Behavior

When Safe Mode is enabled (default):

- `WebhookCrmAdapter` records the intent but does **not** send external requests.
- `LocalJsonCrmAdapter` operates normally (no external dependency).
- All blocked sends are logged to the audit trail.

## Domain Allowlist

Outbound webhook requests are permitted **only** to domains registered in the
allowlist:

```typescript
addAllowedCrmDomain('crm.example.com');
```

Requests to non-allowlisted domains are:

1. Blocked.
2. Logged with severity `warn`.
3. Returned as `{ success: false, error: 'Domain not in allowlist.' }`.

The allowlist is initialized empty. Domains must be added explicitly during
application startup.

## Audit Events

| Event                 | Severity | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `crm.sync_outbound`  | info     | Lead pushed to CRM adapter           |
| `crm.sync_inbound`   | info     | Contact pulled from CRM adapter      |
| `crm.adapter_switched`| warn    | Active CRM adapter was changed       |

## Data Handling

- Only structured, non-PII-enriched lead data is sent outbound.
- Raw CRM payloads are stored in the `raw` field for auditability.
- No credentials or secrets are stored in application code.
- Webhook auth tokens are passed via configuration, not committed to source.

## Constraints

- Sync is deterministic and idempotent where possible.
- Webhook failures are logged but do not block the lead pipeline.
- No automatic retry is implemented (scheduled retry via B11-05 automations if
  needed).
