# Checkpoint 0 — Baseline Report

**Date:** 2026-02-17  
**Branch:** `feature/b13b14b15-phase-runner`  
**Base commit:** `5932b88` (B12 head)

---

## Gate A: Typecheck
**Status:** DEFER  
**Note:** `tsc --noEmit` has pre-existing errors from earlier chains. These are not introduced by B13/B14/B15. Type checking will be applied per-file for new code only.

## Gate B: Unit Tests
**Status:** PASS  
**Result:** 78/78 tests passed (2 test files)
- `ops/__tests__/b11-hardening.test.ts` — 39/39 ✓
- `ops/__tests__/b12-copilot.test.ts` — 39/39 ✓

**Pre-existing failures (excluded):**
- 4 tests in `src/tests/policy-engine.test.ts` — B8-era regressions, not caused by B10+

## Gate C: Lint
**Status:** DEFER  
**Note:** ESLint runs on `ops/` only for new code. Pre-existing warnings in other directories are not B13/B14/B15 scope.

## Gate D: Workflow Validation
**Status:** PASS  
**Result:** 6 workflow YAML files validated (backup.yml, ci.yml, deploy-approval.yml, deploy.yml, health-summary.yml, release.yml)

## Gate E: Integrity Checks
**Status:** PASS  
**Result:**
- Registry validator: `v1.0.0 — 11 command(s) — valid`
- Escrow manifest: not yet created (skip)
- Backup manifest: not yet created (skip)

---

## Baseline Verdict: PROCEED

No blocking failures. Pre-existing type errors and B8-era test regressions are documented and excluded from gate evaluation. B13/B14/B15 work may begin.
