# Proposals

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P3  

---

## Overview

The ProposalService generates draft proposals from registered templates,
filling placeholders with engagement-specific values. All proposals are
hashed at creation for integrity verification.

## Workflow

```
generate (draft) → markReviewed → markSent → recordDecision (accepted/declined)
```

1. **Generate:** Fill a template with values, producing a draft
2. **Review:** Human reviews and approves the draft
3. **Send:** Reviewed proposal is delivered to the client
4. **Decision:** Client accepts or declines

## Integrity

- Each proposal's rendered content is SHA-256 hashed at creation
- The `verify()` method confirms the content has not been altered
- Values used to generate the proposal are stored for reproducibility

## Files

| File | Purpose |
|------|---------|
| `ops/onboarding/proposals/ProposalService.ts` | Service + types |
| `ops/onboarding/proposals/templates/standard_proposal.md` | Default template |
