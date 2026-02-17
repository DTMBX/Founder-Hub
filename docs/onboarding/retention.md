# Retention & Referrals Automation

## Overview

Post-engagement retention touchpoints and referral tracking, driven by a
deterministic rule engine. No opaque inference — every rule firing is logged
and auditable.

## Retention Engine

### Rule Format

Rules are stored in `ops/automation/rules/retention_rules.json`:

```json
{
  "ruleId": "RET-001",
  "trigger": "engagement_complete",
  "condition": { "daysSince": 30 },
  "action": "send_retention_email",
  "templateId": "retention_30day",
  "enabled": true
}
```

### Triggers

| Trigger                 | Fires When                        |
| ----------------------- | --------------------------------- |
| `engagement_complete`   | Matter/engagement closed          |
| `days_since_delivery`   | N days after package delivery     |
| `referral_submitted`    | New referral submitted            |
| `invoice_paid`          | Payment recorded on invoice       |

### Actions

| Action                     | Effect                          |
| -------------------------- | ------------------------------- |
| `send_satisfaction_survey` | Queue post-engagement survey    |
| `send_retention_email`     | Queue retention follow-up       |
| `schedule_check_in`        | Create check-in reminder        |
| `create_referral_credit`   | Issue referral credit           |
| `send_thank_you`           | Queue thank-you message         |

### Evaluation

Call `engine.evaluate({ clientId, trigger, daysSince?, engagementCount? })` to
get matching rules. Only enabled rules with satisfied conditions fire.

## Referral Service

### Lifecycle

```
submitted → verified → credited
              ↓
            expired
```

- **submit** — Record a new referral (referrerId, referredName, referredEmail)
- **verify** — Mark as verified after contact
- **credit** — Issue credit (amount must be positive)
- **expire** — Expire unprocessed referrals

### Integrity

Each referral is hashed at creation (SHA-256 over referralId, referrerId,
referredEmail, submittedAt). Call `verifyIntegrity(referralId)` to confirm.

## Files

| File | Purpose |
| ---- | ------- |
| `ops/automation/retention/RetentionEngine.ts` | Engine + ReferralService |
| `ops/automation/rules/retention_rules.json` | Default rule set |
| `ops/automation/templates/retention/*.md` | Email templates |
| `docs/onboarding/retention.md` | This document |
