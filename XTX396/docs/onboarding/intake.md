# Client Intake Process

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P1 — Intake Models + Checklists  

---

## Overview

The intake system manages the initial onboarding of clients across three
engagement types. Each type has a structured checklist that must be completed
before the engagement proceeds.

## Engagement Types

### eDiscovery

Full-service electronic discovery support. Requires legal hold confirmation,
data transfer protocols, and conflict checks.

**Checklist:** 10 items (7 required)

### SMB Consulting

Small-to-medium business technology consulting. Requires entity verification,
scope definition, and service agreement.

**Checklist:** 8 items (5 required)

### Public Tools

Self-service access to the public tool platform. Requires registration, terms
acceptance, and tier selection.

**Checklist:** 6 items (4 required)

## Intake Lifecycle

```
draft → submitted → under-review → approved / rejected → archived
```

1. **Draft:** Intake created, checklist items being completed
2. **Submitted:** All required items complete, awaiting review
3. **Under Review:** Reviewer examining the intake
4. **Approved/Rejected:** Decision recorded with reviewer identity
5. **Archived:** Engagement concluded, record retained per policy

## Integrity

- Each intake record is hashed at creation (SHA-256)
- Hashes cover: intakeId, engagement type, client info, checklist, timestamp
- Verification confirms record has not been tampered with

## Files

| File | Purpose |
|------|---------|
| `ops/onboarding/intake/IntakeModel.ts` | Model, types, service |
| `ops/onboarding/intake/checklists/ediscovery.json` | eDiscovery checklist |
| `ops/onboarding/intake/checklists/smb-consulting.json` | SMB checklist |
| `ops/onboarding/intake/checklists/public-tools.json` | Public tools checklist |

## Usage

```typescript
import { IntakeService } from '../ops/onboarding/intake/IntakeModel';
import ediscoveryChecklist from '../ops/onboarding/intake/checklists/ediscovery.json';

const svc = new IntakeService();
svc.loadChecklist(ediscoveryChecklist);

const intake = svc.createIntake('ediscovery', 'Acme Corp', 'legal@acme.com');
svc.completeItem(intake.intakeId, 'ed-001', 'operator@evident.tech');
// ... complete remaining required items
svc.submit(intake.intakeId);
svc.review(intake.intakeId, 'approved', 'senior@evident.tech');
```
