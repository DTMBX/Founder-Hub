# Intake Policy

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P1  
**Status:** Active  
**Effective:** 2026-02-17  

---

## Purpose

Defines requirements for client intake across all engagement types.

## Requirements

1. Every new engagement must begin with a formal intake record
2. All required checklist items must be completed before submission
3. Submissions require review and approval by an authorized reviewer
4. Intake records are hashed at creation and verifiable at any time
5. Records must not be deleted; only archived after engagement concludes

## Checklist Maintenance

- Checklists are versioned (`version` field in each JSON)
- Changes to required items must be reviewed before deployment
- Historical intake records retain their original checklist version

## Review Authority

| Engagement Type | Minimum Reviewer Level |
|----------------|----------------------|
| eDiscovery | Senior counsel or operations lead |
| SMB Consulting | Account manager or operations lead |
| Public Tools | Automated approval (terms + tier check) |

## Data Retention

- Active engagement records: retained indefinitely
- Rejected intake records: retained for 3 years, then archived
- Archived records: retained per organizational retention schedule
