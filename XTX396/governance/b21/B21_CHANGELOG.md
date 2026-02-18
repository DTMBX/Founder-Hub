# B21 Changelog

> All changes introduced by the B21 implementation branch.

---

## [B21] — 2025

### Added

#### Phase 0: Inventory + Baseline
- `docs/b21/B21_PLAN.md` — Implementation plan with 10 phases
- `docs/b21/B21_FILEMAP.md` — Complete file inventory
- `docs/b21/B21_GATES.md` — Gate check definitions
- `docs/b21/B21_BASELINE_FINDINGS.md` — Pre-existing state documentation

#### Phase 1: Operator Mode
- `ops/auth/roles.ts` — Extended role system (operator, reviewer roles)
- `ops/auth/__tests__/roles.test.ts` — 32 tests
- `governance/admin/capabilities_registry.json` — Updated with new roles
- `docs/b21/OPERATOR_MODE.md` — Role documentation

#### Phase 2: Blueprint Catalog
- `apps/sitegen/blueprints/Blueprint.schema.json` — JSON Schema (draft 2020-12)
- `apps/sitegen/blueprints/law_firm.json` — Law firm blueprint
- `apps/sitegen/blueprints/agency.json` — Agency blueprint
- `apps/sitegen/blueprints/contractor.json` — Contractor blueprint
- `apps/sitegen/blueprints/nonprofit.json` — Nonprofit blueprint
- `apps/sitegen/blueprints/professional_services.json` — Professional services blueprint
- `apps/sitegen/blueprints/catalog.json` — Master catalog
- `apps/sitegen/blueprints/__tests__/blueprint.test.ts` — 184 tests
- `docs/b21/BLUEPRINT_CONTRACT.md` — Blueprint documentation

#### Phase 3: Component Library
- `apps/ui/components/registry.schema.json` — Component registry schema
- `apps/ui/components/registry.json` — 37 components, 10 categories
- `apps/ui/components/ComponentRegistry.ts` — Registry class with O(1) lookup
- `apps/ui/components/__tests__/registry.test.ts` — 274 tests
- `docs/b21/COMPONENT_LIBRARY.md` — Component library documentation

#### Phase 4: Site Generation Pipeline
- `apps/sitegen/pipeline/types.ts` — Pipeline type system
- `apps/sitegen/pipeline/validate.ts` — Fail-closed input validation
- `apps/sitegen/pipeline/scaffold.ts` — Page/section scaffolding
- `apps/sitegen/pipeline/render.ts` — Deterministic HTML rendering
- `apps/sitegen/pipeline/watermark.ts` — Watermark overlay injection
- `apps/sitegen/pipeline/hash.ts` — SHA-256 hashing (Web Crypto API)
- `apps/sitegen/pipeline/store.ts` — Storage adapter + persistence
- `apps/sitegen/pipeline/pipeline.ts` — Pipeline orchestrator
- `apps/sitegen/pipeline/__tests__/pipeline.test.ts` — 39 tests
- `docs/b21/NEW_SITE_ARTIFACTS.md` — Pipeline documentation

#### Phase 5: Visitor Preview Panel
- `apps/sitegen/preview/types.ts` — Preview type definitions
- `apps/sitegen/preview/token.ts` — HMAC-SHA256 token create/verify
- `apps/sitegen/preview/rate-limit.ts` — Fixed-window rate limiter
- `apps/sitegen/preview/preview-service.ts` — Preview orchestrator
- `apps/sitegen/preview/__tests__/preview.test.ts` — 25 tests
- `docs/b21/PREVIEW_PANEL.md` — Preview panel documentation

#### Phase 6: Case Jacket System
- `apps/tools/case-jacket/tool.manifest.json` — Tool manifest
- `apps/tools/case-jacket/types.ts` — Case jacket type definitions
- `apps/tools/case-jacket/CaseJacketService.ts` — Service logic
- `apps/tools/case-jacket/AISummaryAdapter.ts` — AI adapter (mock default)
- `apps/tools/case-jacket/__tests__/case-jacket.test.ts` — 39 tests
- `docs/b21/CASE_JACKET_TOOL.md` — Case jacket documentation

#### Phase 7: OpenAPI Integration
- `ops/integrations/openapi/OpenApiRegistry.schema.json` — Registry schema
- `ops/integrations/openapi/registry.json` — 5 allowlisted endpoints
- `ops/integrations/openapi/MockAdapter.ts` — Mock API adapter
- `ops/integrations/openapi/OpenApiClient.ts` — Safe client wrapper
- `ops/integrations/openapi/__tests__/openapi.test.ts` — 26 tests
- `docs/b21/OPENAPI_INTEGRATION.md` — OpenAPI documentation

#### Phase 8: Operator Training
- `docs/b21/OPERATOR_PLAYBOOK.md` — Step-by-step operator guide
- `docs/b21/1PAGE_QUICKSTART.md` — 1-page quickstart
- `docs/b21/TRAINING.md` — Comprehensive training guide

#### Phase 9: Final Posture
- `docs/b21/B21_FINAL_POSTURE.md` — Implementation summary
- `docs/b21/DEMO_SCRIPT.md` — Demo walk-through script
- `governance/b21/B21_CHANGELOG.md` — This changelog

### Changed
- `vitest.config.ts` — Added `apps/**/*.test.ts` to include patterns
- `governance/admin/capabilities_registry.json` — Added operator (level 40) and reviewer (level 35) roles

### Test Summary
- **New B21 tests: 619** across 13 test suites
- **All B21 tests passing: 0 failures**
- **Pre-existing failures: 11 (unchanged — no regressions)**
  - `feature-flags.test.ts` — 7 failures (pre-existing)
  - `policy-engine.test.ts` — 4 failures (pre-existing)

### Security Notes
- No secrets stored in configuration files
- All external API URLs require HTTPS
- Mock adapters are the default (no real network calls)
- AI summaries include mandatory disclaimer
- Preview tokens use HMAC-SHA256 with configurable TTL
- All evidence items are immutable after submission
- Audit logs are append-only
