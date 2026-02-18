# CRM Pipeline Structure

> Last updated: 2026-02-17
> Classification: Internal — Operations
> Version: 1.0

---

## Purpose

Define the sales pipeline stages, transition rules, and integration
points with the existing ops automation system. This structure is
designed for law firm sales cycles — longer, security-scrutinized,
and procurement-heavy.

---

## Pipeline Stages

```
┌─────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Lead   │──►│ Security     │──►│ Technical    │──►│ Technical    │
│         │   │ Packet Sent  │   │ Call         │   │ Review       │
│         │   │              │   │ Scheduled    │   │ Completed    │
└─────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                                                           │
                                                           ▼
                                 ┌──────────────┐   ┌──────────────┐
                                 │ Pilot        │◄──│ Procurement  │
                                 │ Deployment   │   │ Review       │
                                 └──────┬───────┘   └──────────────┘
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                       ┌────────────┐      ┌────────────┐
                       │ Closed Won │      │ Closed Lost│
                       └────────────┘      └────────────┘
```

---

## Stage Definitions

### 1. Lead

| Attribute | Value |
|---|---|
| Entry criteria | Contact identified via inbound or outbound channel |
| LeadStatus mapping | `new` or `contacted` |
| Owner | Marketing / SDR |
| Max age before review | 14 days |
| Exit to | Security Packet Sent, Closed Lost |

Actions:
- Lead created in `LeadModel` (B11)
- Tags applied: source channel, ICP match level
- Lead scoring initialized

### 2. Security Packet Sent

| Attribute | Value |
|---|---|
| Entry criteria | Security overview packet delivered (under NDA) |
| LeadStatus mapping | `contacted` |
| Owner | Sales Engineer |
| Max age before follow-up | 7 days |
| Exit to | Technical Call Scheduled, Closed Lost |

Actions:
- Packet delivery audit event logged
- Lead score: +20 (packet sent), +10 (packet opened)
- Follow-up reminder triggered via `RetentionEngine` (B14)

### 3. Technical Call Scheduled

| Attribute | Value |
|---|---|
| Entry criteria | Walkthrough meeting confirmed |
| LeadStatus mapping | `qualified` |
| Owner | Sales Engineer |
| Max age before call | 10 days |
| Exit to | Technical Review Completed, Closed Lost |

Actions:
- Calendar event created
- Pre-call preparation checklist generated
- Lead score: +30

### 4. Technical Review Completed

| Attribute | Value |
|---|---|
| Entry criteria | Walkthrough completed, attendee feedback captured |
| LeadStatus mapping | `qualified` |
| Owner | Sales Engineer + Account Executive |
| Max age before next step | 14 days |
| Exit to | Procurement Review, Closed Lost |

Actions:
- Post-call summary documented
- Attendee roles and feedback recorded
- Security concerns flagged (if any)
- Lead score: adjusted based on engagement quality

### 5. Procurement Review

| Attribute | Value |
|---|---|
| Entry criteria | Firm initiates formal vendor evaluation |
| LeadStatus mapping | `qualified` |
| Owner | Account Executive |
| Max age before update | 30 days |
| Exit to | Pilot Deployment, Closed Lost |

Actions:
- Security questionnaire responses sent
- Architecture diagrams provided
- Compliance roadmap shared
- Legal team engaged for contract review

### 6. Pilot Deployment

| Attribute | Value |
|---|---|
| Entry criteria | Time-limited pilot agreed upon |
| LeadStatus mapping | `qualified` |
| Owner | Sales Engineer + Customer Success |
| Max age before evaluation | 60 days |
| Exit to | Closed Won, Closed Lost |

Actions:
- Pilot tenant provisioned
- Success criteria documented
- Weekly check-in cadence established
- Pilot audit events tracked

### 7. Closed Won

| Attribute | Value |
|---|---|
| Entry criteria | Contract signed |
| LeadStatus mapping | `converted` |
| Owner | Account Executive |

Actions:
- Lead converted to active client
- Onboarding sequence initiated via `IntakeService` (B14)
- Handoff package generated
- Revenue recorded

### 8. Closed Lost

| Attribute | Value |
|---|---|
| Entry criteria | Prospect declines or disqualified |
| LeadStatus mapping | `closed` |
| Owner | Assigned owner at stage of loss |

Actions:
- Loss reason documented (required field)
- Loss stage recorded
- Lead tagged for future re-engagement (if appropriate)
- No further automated contact unless re-engaged

---

## Integration with Existing Systems

### LeadModel (B11)

The CRM pipeline maps to the existing `LeadStatus` values:

| Pipeline Stage | LeadStatus |
|---|---|
| Lead | `new` |
| Security Packet Sent | `contacted` |
| Technical Call Scheduled | `qualified` |
| Technical Review Completed | `qualified` |
| Procurement Review | `qualified` |
| Pilot Deployment | `qualified` |
| Closed Won | `converted` |
| Closed Lost | `closed` |

The pipeline stage provides finer granularity than `LeadStatus`.
A new `pipelineStage` field should be added to the `Lead` interface.

### AutomationEngine (B11)

Pipeline stage transitions trigger automation rules:

| Trigger | Action |
|---|---|
| Lead → Security Packet Sent | Send packet delivery confirmation email |
| Security Packet Sent (7 days, no response) | Send follow-up reminder |
| Technical Call Scheduled | Generate pre-call checklist |
| Technical Review Completed | Send post-call thank-you email |
| Closed Lost | Log loss reason, tag for potential re-engagement |

### RetentionEngine (B14)

- Follow-up sequences triggered by stage age thresholds
- Re-engagement sequences for Closed Lost leads (after 90 days)
- Win-back sequences for lapsed pilots

### OpsAuditLogger (B11)

All stage transitions are logged as audit events:

```
{
  eventType: "pipeline_stage_transition",
  timestamp: "<ISO 8601 UTC>",
  actor: "<operator ID>",
  leadId: "<lead UUID>",
  fromStage: "<previous stage>",
  toStage: "<new stage>",
  metadata: {
    reason: "<transition reason>",
    notes: "<operator notes>"
  }
}
```

---

## Stage Velocity Targets

| Stage | Target Duration |
|---|---|
| Lead → Security Packet Sent | 3 days |
| Security Packet Sent → Technical Call | 7 days |
| Technical Call → Review Completed | 1 day |
| Review Completed → Procurement | 14 days |
| Procurement → Pilot | 30 days |
| Pilot → Closed Won | 45 days |
| **Total (Lead → Closed Won)** | **100 days** |

These are targets, not commitments. Law firm procurement cycles
are variable and often longer.

---

*Pipeline designed for security-led sales cycles. No shortcuts.
No pressure tactics.*
