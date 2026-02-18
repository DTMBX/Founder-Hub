# Security Packet Delivery Tracking — Specification

> Last updated: 2026-02-17
> Classification: Internal — Operations
> Version: 1.0

---

## Purpose

Define the audit events, lead scoring model, and tracking
infrastructure for security packet delivery. Every packet download
and delivery interaction is logged, scored, and fed into the CRM
pipeline for lead qualification.

---

## 1. Audit Events

### Packet Download Event

Triggered when a security packet is downloaded from the trust
download portal or delivered to a prospect via email.

```
{
  eventType: "security_packet_download",
  timestamp: "<ISO 8601 UTC>",
  actor: {
    leadId: "<lead UUID>",
    email: "<lead email>",
    ipHash: "<SHA-256 of request IP>",
    deliveryMethod: "portal" | "email" | "manual"
  },
  resource: {
    packetVersion: "<content hash of packet bundle>",
    documentsIncluded: [
      "law_firm_executive_brief",
      "architecture_diagrams",
      "control_evidence_matrix",
      "compliance_roadmap",
      "security_questionnaire"
    ],
    ndaSigned: <boolean>,
    ndaReference: "<NDA document ID, if applicable>"
  },
  metadata: {
    pipelineStage: "<current pipeline stage>",
    requestedBy: "<operator ID, if manual delivery>",
    expiresAt: "<ISO 8601 UTC, 24-hour expiry>"
  }
}
```

### Packet Opened Event

Triggered when a prospect accesses a delivered packet (via tracked
link, if enabled).

```
{
  eventType: "security_packet_opened",
  timestamp: "<ISO 8601 UTC>",
  actor: {
    leadId: "<lead UUID>",
    ipHash: "<SHA-256 of access IP>"
  },
  resource: {
    packetVersion: "<content hash>",
    documentsAccessed: ["<document slugs>"],
    timeSpentSeconds: <number>
  }
}
```

### Follow-Up Response Event

Triggered when a lead replies to a follow-up communication
after receiving a packet.

```
{
  eventType: "packet_followup_response",
  timestamp: "<ISO 8601 UTC>",
  actor: {
    leadId: "<lead UUID>"
  },
  resource: {
    responseType: "email_reply" | "form_submission" | "phone_call",
    sentiment: "positive" | "neutral" | "negative" | "unclassified"
  },
  metadata: {
    sequenceEmail: <number>,
    daysSincePacketDelivery: <number>
  }
}
```

### Meeting Scheduled Event

Triggered when a technical walkthrough is scheduled.

```
{
  eventType: "technical_walkthrough_scheduled",
  timestamp: "<ISO 8601 UTC>",
  actor: {
    leadId: "<lead UUID>",
    scheduledBy: "<operator ID>"
  },
  resource: {
    meetingDate: "<ISO 8601 UTC>",
    attendeeRoles: ["<role descriptions>"],
    agendaItems: ["architecture", "isolation", "exports", "audit", "recovery"]
  }
}
```

---

## 2. Lead Scoring Model

### Score Components

| Signal | Points | Condition |
|---|---|---|
| Trust portal page view | +2 | Per unique visit (max 5) |
| Trust document download | +5 | Per document downloaded |
| Security packet requested | +15 | First request |
| Security packet downloaded | +20 | First download |
| Security packet opened | +10 | First access |
| Individual document accessed | +3 | Per document in packet |
| Follow-up email reply (positive) | +15 | Any positive reply |
| Follow-up email reply (neutral) | +5 | Any neutral reply |
| Follow-up email reply (negative) | -10 | Negative/unsubscribe |
| Technical walkthrough scheduled | +30 | Meeting confirmed |
| Technical walkthrough completed | +20 | Meeting attended |
| Procurement review initiated | +25 | Formal evaluation started |
| ICP match — primary segment | +15 | Firm matches primary ICP |
| ICP match — secondary segment | +10 | Firm matches secondary ICP |
| Named buying center contact | +15 | Contact identified in buying center |
| Disqualifier present | -50 | Any disqualifying characteristic |

### Score Thresholds

| Threshold | Classification | Action |
|---|---|---|
| 0–19 | Cold | Monitor only |
| 20–39 | Warm | Add to outbound sequence |
| 40–59 | Engaged | Prioritize follow-up |
| 60–79 | Sales Qualified Lead (SQL) | Assign to account executive |
| 80+ | High Intent | Expedite procurement review |

### Score Decay

- Scores decay by 5 points per 30-day period of inactivity
- Decay stops at 0 (scores do not go negative from decay)
- Any new activity resets the decay timer
- Closed Lost leads retain their score for re-engagement analysis

---

## 3. Tracking Infrastructure

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Trust Portal   │───►│  OpsAuditLogger  │───►│  Audit Store    │
│  (download)     │    │  (B11)           │    │  (append-only)  │
└─────────────────┘    └────────┬─────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  LeadModel (B11) │
                       │  Score update    │
                       │  Stage check     │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ AutomationEngine │
                       │ (B11)            │
                       │ Rule evaluation  │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ RetentionEngine  │
                       │ (B14)            │
                       │ Follow-up trigger│
                       └──────────────────┘
```

### Automation Rules

| Rule | Trigger | Action |
|---|---|---|
| score_threshold_sql | Score reaches 60 | Notify account executive, move to SQL queue |
| packet_no_open_7d | Packet sent but not opened in 7 days | Send reminder email |
| walkthrough_no_show | Meeting time passed, no attendance | Re-schedule prompt |
| score_decay_warning | Score drops below SQL threshold | Flag for re-engagement review |
| high_intent_alert | Score reaches 80+ | Immediate notification to sales lead |

---

## 4. Privacy and Compliance

| Requirement | Implementation |
|---|---|
| IP addresses | Hashed (SHA-256) before storage — raw IPs not retained |
| Email tracking pixels | Not used — only delivery confirmation via email provider |
| Link tracking | Optional — disabled by default, enabled only with explicit consent |
| Data retention | Lead data retained per privacy policy; deleted on request |
| GDPR/CCPA compliance | Deletion request honored within 30 days |
| Consent verification | Both `consentFollowUp` and `consentDataStorage` required before tracking |

---

*Tracking serves qualification, not surveillance. Every data point
is logged with consent and audit trail.*
