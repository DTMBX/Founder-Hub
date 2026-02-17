# B14 Changelog — Client Onboarding + Billing Operations

All changes are on branch `feature/b13b14b15-phase-runner`.

## [B14-P1] — Intake Models + Checklists

- **Added** `ops/onboarding/intake/IntakeModel.ts` — IntakeService with
  createIntake, completeItem, submit, review, verify, list, loadChecklist
- **Added** `ops/onboarding/intake/checklists/ediscovery.json` (10 items)
- **Added** `ops/onboarding/intake/checklists/smb-consulting.json` (8 items)
- **Added** `ops/onboarding/intake/checklists/public-tools.json` (6 items)
- **Added** `docs/onboarding/intake.md`
- **Added** `governance/ops/onboarding/intake_policy.md`
- **Tests** 24 new (b14-onboarding.test.ts)
- **Commit** `a5072f9`

## [B14-P2] — Contract Templates

- **Added** `contracts/templates/MSA_template.md`
- **Added** `contracts/templates/SOW_template.md`
- **Added** `contracts/templates/NDA_lite_template.md`
- **Added** `contracts/policies/template_usage_policy.md`
- **Added** `docs/onboarding/contracts.md`
- **Tests** 9 new placeholder linter tests
- **Commit** `849687c`

## [B14-P3] — Proposal + SOW Generator

- **Added** `ops/onboarding/proposals/ProposalService.ts` — fillTemplate(),
  ProposalService (generate, markReviewed, markSent, recordDecision, verify)
- **Added** `ops/onboarding/proposals/templates/standard_proposal.md`
- **Added** `docs/onboarding/proposals.md`
- **Tests** 14 new (fillTemplate: 3, ProposalService: 11)
- **Commit** `85e7b5c`

## [B14-P4] — Billing Core

- **Added** `ops/billing/models/Invoice.ts` — types, computeLineAmount,
  computeSubtotal, computeTotal, hashInvoice
- **Added** `ops/billing/ledger/BillingLedger.ts` — append-only ledger
- **Added** `ops/billing/adapters/PaymentAdapter.ts` — interface
- **Added** `ops/billing/adapters/LocalManualAdapter.ts` — manual stub
- **Added** `docs/onboarding/billing.md`
- **Added** `governance/ops/onboarding/billing_policy.md`
- **Tests** 17 new (Invoice: 3, BillingLedger: 11, Adapter: 3)
- **Commit** `2f4442c`

## [B14-P5] — Customer Portal Handoff Packages

- **Added** `ops/portal/HandoffPackageService.ts` — assemble, finalize,
  recordDelivery, verifyManifest
- **Added** `ops/portal/package.schema.json` — manifest JSON Schema
- **Added** `docs/onboarding/portal.md`
- **Tests** 13 new (assembly: 3, finalize: 3, deliver: 2, verify: 3, list: 2)
- **Commit** `bd60df0`

## [B14-P6] — Retention + Referrals Automation

- **Added** `ops/automation/retention/RetentionEngine.ts` — RetentionEngine
  (loadRules, evaluate, getFirings) + ReferralService (submit, verify,
  credit, expire, verifyIntegrity)
- **Added** `ops/automation/rules/retention_rules.json` (6 rules)
- **Added** `ops/automation/templates/retention/referral_thank_you.md`
- **Added** `ops/automation/templates/retention/survey_post_engagement.md`
- **Added** `ops/automation/templates/retention/retention_30day.md`
- **Added** `docs/onboarding/retention.md`
- **Tests** 16 new (RetentionEngine: 8, ReferralService: 8)
- **Commit** `d0fd6fc`

## [B14-P7] — Confidence Builder Publishing Hooks

- **Added** `ops/automation/content/ContentPublisher.ts` — ContentPublisher
  (create, submitForReview, approve, publish, archive, verifyIntegrity)
  + validateRequest()
- **Added** `ops/automation/content/templates/case_study.md`
- **Added** `ops/automation/content/templates/testimonial.md`
- **Added** `docs/onboarding/confidence_builders.md`
- **Tests** 14 new (validateRequest: 4, ContentPublisher: 10)
- **Commit** `90ced55`

## [B14-P8] — B14 Packaging

- **Added** `docs/onboarding/PLAYBOOK.md` — full playbook
- **Added** `governance/ops/onboarding/B14_CHANGELOG.md` — this file

---

**Total B14 files:** 30+
**Total B14 tests:** 107
**Chain status:** COMPLETE
