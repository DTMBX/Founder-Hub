# B21 Phase Gates

> Run after each phase to verify no regressions.

## Gate Definitions

### Gate A — TypeCheck
```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object
```
**Criteria:** No NEW type errors introduced. Pre-existing count: ~15.

### Gate B — Tests
```powershell
npx vitest run
```
**Criteria:** All tests pass. Zero regressions. New tests for new code.

### Gate C — Secret Scan
```powershell
npm run scan:secrets
```
**Criteria:** CLEAN. Zero secrets detected.

### Gate D — Schema Validation
```powershell
# Validate blueprint schemas
npx vitest run apps/sitegen/blueprints/__tests__/blueprint.test.ts
# Validate component registry schema
npx vitest run apps/ui/components/__tests__/registry.test.ts
# Validate tool manifests
npx vitest run apps/tools/case-jacket/__tests__/case-jacket.test.ts
```
**Criteria:** All schema validation tests pass.

### Gate E — UI Quality (DOM Invariants)
```powershell
npx vitest run --grep "a11y|accessibility|dom-invariant"
```
**Criteria:** Accessibility smoke tests pass. No broken aria labels.

## Gate Results Log

| Phase | Gate A | Gate B | Gate C | Gate D | Gate E |
|-------|--------|--------|--------|--------|--------|
| P0 | ~15 pre-existing | ~450 pass | CLEAN | n/a | n/a |
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |
| P4 | | | | | |
| P5 | | | | | |
| P6 | | | | | |
| P7 | | | | | |
| P8 | | | | | |
| P9 | | | | | |
