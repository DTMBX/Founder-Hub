# Phase Runner — Gate Definitions

## Gate A: Typecheck

**XTX396:** `npx tsc --noEmit`  
**Evident:** Per-app `tsc --noEmit` in workspace apps (no root tsconfig)

Pass criteria: Zero type errors in new/modified files.

## Gate B: Unit Tests

**XTX396:** `npx vitest run`  
**Evident:** `python -m pytest tests/ -q` (Python), `npx jest` (JS — when wired)

Pass criteria: All new tests pass. Pre-existing failures documented and excluded.

Known pre-existing failures (XTX396):
- 4 tests in `src/tests/policy-engine.test.ts` (B8-era regressions, unrelated to B11+)

## Gate C: Lint/Format

**XTX396:** `npx eslint . --max-warnings=0` (new files only)  
**Evident:** `npm run lint` (stylelint + format check)

Pass criteria: No new lint violations introduced.

## Gate D: Workflow Validation

Validate YAML syntax for any new/modified `.github/workflows/*.yml` files.

**Command:** `npx yaml-lint .github/workflows/*.yml` or PowerShell YAML parse.

Pass criteria: All workflow YAML files parse without syntax errors.

## Gate E: Integrity Checks

Run any applicable integrity verifiers:
- Registry schema validator: `npx tsx ops/runner/commands/validateRegistry.ts`
- Audit verifier: via `audit.verify` internal handler
- Escrow verifier: `ops/escrow` verification (when created in B13-P4)
- Backup manifest verifier: `scripts/security/backup-verify.ps1` (when created in B13-P2)

Pass criteria: All verifiers return success.

---

## Running Gates

All gates are orchestrated by `/scripts/verify.ps1`.

Usage:
```powershell
.\scripts\verify.ps1              # Run all gates
.\scripts\verify.ps1 -Gate A      # Run specific gate
.\scripts\verify.ps1 -Verbose     # Detailed output
```
