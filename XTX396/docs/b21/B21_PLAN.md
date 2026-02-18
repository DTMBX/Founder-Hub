# B21 Plan — Operator Mode + Blueprint Catalog + Components + Case Jacket + OpenAPI + AI Summary

> Branch: `feature/b21-operator-blueprints-casejacket-openapi-ai`  
> Date: 2026-02-18  
> Status: IN PROGRESS

---

## Objective

Implement a novice-friendly Operator Mode that generates professional sites via
business-type Blueprints. Guarantee every generated site includes required and
complementary components for best-in-class web design. Add Case Jacket review
tooling, OpenAPI adapter model, and governed AI summary.

## Constraints

- Fail-closed defaults. Safe Mode ON for public/demo.
- No secrets in repo. No API keys committed. Adapters mock by default.
- Operators cannot break templates, governance, or security posture.
- Every artifact deterministic and auditable (manifest + hashes + audit events).
- No weakening of B13–B20 security controls.

## Phases

| Phase | Title | Scope |
|-------|-------|-------|
| P0 | Inventory + Baseline | Planning docs, verify baseline |
| P1 | Operator Mode | RBAC operator role, locked wizard-only |
| P2 | Blueprint Catalog | Schema, catalog, 5 blueprint types |
| P3 | Component Library | Registry, 30+ components, a11y rules |
| P4 | Site Generation Output | Pipeline + deterministic manifests |
| P5 | Visitor Preview Panel | Form + live preview + watermark + share |
| P6 | Case Jacket System | Tool module + AI summary (governed) |
| P7 | OpenAPI Integration | Safe adapter model, allowlist, mocks |
| P8 | Operator Training | Playbook, quickstart, safety nets |
| P9 | Final Posture | Changelog, demo script, validation |

## Gate Checks (per phase)

- **Gate A:** TypeCheck — `npx tsc --noEmit` (pre-existing errors allowed, no new)
- **Gate B:** Tests — `npx vitest run` (all pass, no regressions)
- **Gate C:** Secret scan — `npm run scan:secrets`
- **Gate D:** Schema validation — Blueprint/manifest JSON schemas valid
- **Gate E:** UI quality — DOM invariant tests (a11y smoke)

## Allowed Paths

- `/apps/**`
- `/ops/**`
- `/docs/**`
- `/governance/**`
- `/scripts/**`
- `/.github/workflows/**`

## Baseline

- Branch created from: `feature/honorbar-security-admin-upgrade` HEAD (`29d0a9e`)
- Existing tests: ~450 passing
- Pre-existing TS errors: ~15 (in clients/, components/admin/, components/landing/)
- Verify script: PASS
- Secret scan: CLEAN
