# B21 File Map

> Complete listing of files created or modified by B21.

## New Files

### Phase 0 — Planning
```
docs/b21/B21_PLAN.md
docs/b21/B21_FILEMAP.md
docs/b21/B21_GATES.md
docs/b21/B21_BASELINE_FINDINGS.md
```

### Phase 1 — Operator Mode
```
ops/auth/roles.ts                              # Role definitions: operator, reviewer, admin
ops/auth/__tests__/roles.test.ts               # Role enforcement tests
governance/admin/capabilities_registry.json     # Updated: operator/reviewer/admin caps
docs/b21/OPERATOR_MODE.md
```

### Phase 2 — Blueprint Catalog
```
apps/sitegen/blueprints/Blueprint.schema.json  # JSON Schema for blueprints
apps/sitegen/blueprints/catalog.json           # Master catalog index
apps/sitegen/blueprints/law_firm.json
apps/sitegen/blueprints/agency.json
apps/sitegen/blueprints/contractor.json
apps/sitegen/blueprints/nonprofit.json
apps/sitegen/blueprints/professional_services.json
apps/sitegen/blueprints/__tests__/blueprint.test.ts
docs/b21/BLUEPRINT_CONTRACT.md
```

### Phase 3 — Component Library
```
apps/ui/components/ComponentRegistry.ts        # Registry class + types
apps/ui/components/registry.schema.json        # JSON Schema for components
apps/ui/components/registry.json               # Component definitions
apps/ui/components/__tests__/registry.test.ts
docs/b21/COMPONENT_LIBRARY.md
```

### Phase 4 — Site Generation Output
```
apps/sitegen/pipeline/types.ts                 # Pipeline types
apps/sitegen/pipeline/validate.ts              # Input validation step
apps/sitegen/pipeline/scaffold.ts              # Scaffold step
apps/sitegen/pipeline/render.ts                # Render step
apps/sitegen/pipeline/watermark.ts             # Watermark injection
apps/sitegen/pipeline/hash.ts                  # SHA-256 hashing
apps/sitegen/pipeline/store.ts                 # KV storage
apps/sitegen/pipeline/pipeline.ts              # Orchestrator
apps/sitegen/pipeline/__tests__/pipeline.test.ts
docs/b21/NEW_SITE_ARTIFACTS.md
```

### Phase 5 — Visitor Preview Panel
```
apps/sitegen/preview/types.ts                  # Preview types
apps/sitegen/preview/token.ts                  # HMAC token signing
apps/sitegen/preview/rate-limit.ts             # Rate limiting
apps/sitegen/preview/preview-service.ts        # Preview orchestrator
apps/sitegen/preview/__tests__/preview.test.ts
docs/b21/PREVIEW_PANEL.md
```

### Phase 6 — Case Jacket System
```
apps/tools/case-jacket/tool.manifest.json      # Tool manifest
apps/tools/case-jacket/types.ts                # Case jacket types
apps/tools/case-jacket/CaseJacketService.ts    # Service logic
apps/tools/case-jacket/AISummaryAdapter.ts     # AI adapter (mock default)
apps/tools/case-jacket/__tests__/case-jacket.test.ts
docs/b21/CASE_JACKET_TOOL.md
```

### Phase 7 — OpenAPI Integration
```
ops/integrations/openapi/OpenApiRegistry.schema.json
ops/integrations/openapi/registry.json         # Allowlisted endpoints
ops/integrations/openapi/OpenApiClient.ts      # Safe client wrapper
ops/integrations/openapi/MockAdapter.ts        # Default mock
ops/integrations/openapi/__tests__/openapi.test.ts
docs/b21/OPENAPI_INTEGRATION.md
```

### Phase 8 — Operator Training
```
docs/b21/OPERATOR_PLAYBOOK.md
docs/b21/1PAGE_QUICKSTART.md
docs/b21/TRAINING.md
```

### Phase 9 — Final Posture
```
docs/b21/B21_FINAL_POSTURE.md
docs/b21/DEMO_SCRIPT.md
governance/b21/B21_CHANGELOG.md
```
