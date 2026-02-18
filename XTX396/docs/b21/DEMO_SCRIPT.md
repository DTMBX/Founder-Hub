# B21 Demo Script

> Walk-through for demonstrating the B21 system to stakeholders.

---

## Setup

1. Ensure you are on branch `feature/b21-operator-blueprints-casejacket-openapi-ai`.
2. Run `npm install` (if needed).
3. Run `npx vitest run apps/ ops/` to verify all 1098 B21 tests pass.

## Demo Flow

### Act 1: Operator Mode & Roles (P1)

**Show:** `ops/auth/roles.ts`

- 6 roles with capability-based access control.
- `hasCapability(role, cap)` — fail-closed enforcement.
- `canAccessRoute(role, route)` — route-level restrictions.
- Operator role is level 40 — wizard-only, no admin access.

**Demo command:**
```bash
npx vitest run ops/auth/__tests__/roles.test.ts
# → 32 tests passed
```

### Act 2: Blueprint Catalog (P2)

**Show:** `apps/sitegen/blueprints/`

- Open `Blueprint.schema.json` — full JSON Schema with compliance blocks.
- Open `law_firm.json` — 4 pages, 10 sections, attorney advertising disclaimer.
- Open `catalog.json` — master index of all 5 blueprints.

**Demo command:**
```bash
npx vitest run apps/sitegen/blueprints/__tests__/blueprint.test.ts
# → 184 tests passed
```

### Act 3: Component Library (P3)

**Show:** `apps/ui/components/`

- `registry.json` — 37 components, each with a11y rules.
- `ComponentRegistry.ts` — O(1) lookup, blueprint validation.
- Every component has explicit keyboard_navigable, min_contrast, focus_visible.

**Demo command:**
```bash
npx vitest run apps/ui/components/__tests__/registry.test.ts
# → 274 tests passed
```

### Act 4: Site Generation Pipeline (P4)

**Show:** `apps/sitegen/pipeline/`

- Walk through pipeline.ts: validate → scaffold → render → watermark → hash → store.
- Show `hash.ts` — SHA-256 via Web Crypto, deterministic manifest hash.
- Show `watermark.ts` — aria-hidden watermark injection.

**Key point:** Same input always produces byte-identical output.

**Demo command:**
```bash
npx vitest run apps/sitegen/pipeline/__tests__/pipeline.test.ts
# → 39 tests passed (including determinism invariant test)
```

### Act 5: Visitor Preview Panel (P5)

**Show:** `apps/sitegen/preview/`

- `token.ts` — HMAC-SHA256 token creation and verification.
- `rate-limit.ts` — Fixed-window rate limiter.
- `preview-service.ts` — Token → rate limit → site check → session creation.

**Key point:** Expired tokens are always rejected. Tampered tokens are caught.

**Demo command:**
```bash
npx vitest run apps/sitegen/preview/__tests__/preview.test.ts
# → 25 tests passed
```

### Act 6: Case Jacket System (P6)

**Show:** `apps/tools/case-jacket/`

- `CaseJacketService.ts` — Case profiles, evidence, AI summaries, exports.
- `AISummaryAdapter.ts` — Mock adapter with mandatory disclaimer.
- Evidence is immutable. Audit log is append-only.

**Key point:** AI summaries always include "This is not legal advice."

**Demo command:**
```bash
npx vitest run apps/tools/case-jacket/__tests__/case-jacket.test.ts
# → 39 tests passed
```

### Act 7: OpenAPI Integration (P7)

**Show:** `ops/integrations/openapi/`

- `registry.json` — 5 government/legal API endpoints, all HTTPS.
- `OpenApiClient.ts` — Allowlist enforcement, rate limiting, audit logging.
- `MockAdapter.ts` — Default adapter, no real network calls.

**Key point:** No secrets in config. Unknown endpoints throw `OpenApiError`.

**Demo command:**
```bash
npx vitest run ops/integrations/openapi/__tests__/openapi.test.ts
# → 26 tests passed
```

### Act 8: Full Suite

**Demo command:**
```bash
npx vitest run apps/ ops/
# → 13 suites, 1098 tests, 0 failures
```

## Talking Points

1. **Deterministic by design** — No randomness anywhere in the pipeline.
2. **Fail-closed everywhere** — Missing fields, bad tokens, unknown APIs all rejected.
3. **Audit everything** — Every action logged, every artifact hashed.
4. **No real API calls by default** — Mock adapters prevent accidental external access.
5. **Accessibility-first** — 37 components with explicit a11y rules.
6. **Pluggable architecture** — AI adapters, storage adapters, API adapters all swappable.
7. **Zero regressions** — Pre-existing 11 failures unchanged.
