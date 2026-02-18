# B14 Onboarding Playbook

## Overview

B14 delivers the complete client onboarding and billing operations
framework for Evident Technologies. Each phase builds on the previous,
creating a unified pipeline from intake to retention.

## Onboarding Pipeline

```
Intake → Contract → Proposal → Billing → Handoff → Retention → Confidence
 P1        P2         P3         P4        P5         P6          P7
```

## Phase Summary

### P1 — Intake Models + Checklists

Engagement intake with typed checklists (eDiscovery, SMB consulting,
public tools). SHA-256 integrity hashing. Status lifecycle:
`draft → submitted → approved/rejected → verified`.

**Key files:** `ops/onboarding/intake/IntakeModel.ts`,
`ops/onboarding/intake/checklists/*.json`

### P2 — Contract Templates

Three reusable contract templates (MSA, SOW, NDA-lite) with
`{{PLACEHOLDER}}` syntax. Placeholder linter enforces UPPER_SNAKE_CASE
and requires legal review warnings.

**Key files:** `contracts/templates/*.md`,
`contracts/policies/template_usage_policy.md`

### P3 — Proposal + SOW Generator

Template-based proposal generation with `fillTemplate()` utility.
Lifecycle: `draft → reviewed → sent → accepted/declined`.
SHA-256 content hash for integrity verification.

**Key files:** `ops/onboarding/proposals/ProposalService.ts`,
`ops/onboarding/proposals/templates/standard_proposal.md`

### P4 — Billing Core

Invoice model with line-item computation (quantity × rate, subtotal, tax).
Append-only billing ledger with individually-hashed entries.
Lifecycle: `draft → issued → paid/overdue/void/disputed`.

**Key files:** `ops/billing/models/Invoice.ts`,
`ops/billing/ledger/BillingLedger.ts`,
`ops/billing/adapters/LocalManualAdapter.ts`

### P5 — Customer Portal Handoff Packages

Deliverable packaging with per-file SHA-256 hashes and bundle-level
manifest integrity. Lifecycle: `assembling → finalized → delivered`.

**Key files:** `ops/portal/HandoffPackageService.ts`,
`ops/portal/package.schema.json`

### P6 — Retention + Referrals Automation

Deterministic rule engine for post-engagement touchpoints. Referral
tracking with integrity hashing. Rules loaded from JSON, all firings
logged for audit.

**Key files:** `ops/automation/retention/RetentionEngine.ts`,
`ops/automation/rules/retention_rules.json`

### P7 — Confidence Builder Publishing Hooks

Content publishing for trust artifacts (case studies, testimonials,
capability briefs). Review-gated lifecycle:
`draft → in_review → approved → published → archived`.

**Key files:** `ops/automation/content/ContentPublisher.ts`,
`ops/automation/content/templates/*.md`

### P8 — B14 Packaging

This playbook, changelog, and final documentation.

## Test Coverage

All 107 tests in `ops/__tests__/b14-onboarding.test.ts`:

| Phase | Tests | Scope |
| ----- | ----- | ----- |
| P1    | 24    | Intake lifecycle, checklist validation |
| P2    | 9     | Placeholder linting |
| P3    | 14    | Template filling, proposal lifecycle |
| P4    | 17    | Invoice math, ledger, adapter |
| P5    | 13    | Package assembly, manifest verification |
| P6    | 16    | Rule evaluation, referral lifecycle |
| P7    | 14    | Content validation, publishing lifecycle |
| **Total** | **107** | |

## Directory Map

```
ops/
  onboarding/
    intake/
      IntakeModel.ts
      checklists/
        ediscovery.json
        smb-consulting.json
        public-tools.json
    proposals/
      ProposalService.ts
      templates/
        standard_proposal.md
  billing/
    models/Invoice.ts
    ledger/BillingLedger.ts
    adapters/
      PaymentAdapter.ts
      LocalManualAdapter.ts
  portal/
    HandoffPackageService.ts
    package.schema.json
  automation/
    retention/RetentionEngine.ts
    rules/retention_rules.json
    templates/retention/
      referral_thank_you.md
      survey_post_engagement.md
      retention_30day.md
    content/
      ContentPublisher.ts
      templates/
        case_study.md
        testimonial.md
  __tests__/
    b14-onboarding.test.ts
contracts/
  templates/
    MSA_template.md
    SOW_template.md
    NDA_lite_template.md
  policies/
    template_usage_policy.md
docs/onboarding/
  intake.md
  contracts.md
  proposals.md
  billing.md
  portal.md
  retention.md
  confidence_builders.md
  PLAYBOOK.md
governance/ops/onboarding/
  intake_policy.md
  billing_policy.md
```
