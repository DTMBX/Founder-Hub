# Contract Templates

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P2  

---

## Overview

Standardized contract templates for client engagements. All templates use
`{{PLACEHOLDER}}` syntax for customizable fields and require legal review
before execution.

## Templates

### Master Service Agreement (MSA)

Establishes the general terms and conditions for an ongoing client relationship.
Covers confidentiality, intellectual property, data handling, warranties,
liability, and termination.

**File:** `contracts/templates/MSA_template.md`

### Statement of Work (SOW)

Defines a specific project engagement under an existing MSA. Includes scope,
deliverables, timeline, fees, and acceptance criteria.

**File:** `contracts/templates/SOW_template.md`

### Non-Disclosure Agreement (NDA Lite)

Mutual NDA for protecting confidential information during preliminary
discussions or consulting engagements.

**File:** `contracts/templates/NDA_lite_template.md`

## Placeholder Convention

All templates use `{{UPPER_SNAKE_CASE}}` for customizable fields:

| Category | Examples |
|----------|---------|
| Parties | `{{CLIENT_LEGAL_NAME}}`, `{{PROVIDER_ADDRESS}}` |
| Dates | `{{EFFECTIVE_DATE}}`, `{{START_DATE}}` |
| Terms | `{{INITIAL_TERM}}`, `{{PAYMENT_TERMS_DAYS}}` |
| Jurisdiction | `{{GOVERNING_JURISDICTION}}`, `{{DISPUTE_VENUE}}` |
| Project | `{{PROJECT_NAME}}`, `{{ENGAGEMENT_TYPE}}` |

## Policy

See `contracts/policies/template_usage_policy.md` for usage rules.
