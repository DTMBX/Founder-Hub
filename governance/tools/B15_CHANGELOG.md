# B15 Changelog — Shared Tools Platform + ToolHub

All changes for Chain B15 (Shared Tools Platform + ToolHub).

Branch: `feature/b13b14b15-phase-runner`

---

## P0 — Apps Inventory (b0bfef6)
- Inventoried ~126 tool-like assets across the Evident repository
- Categorized: 4 standalone apps, 36 dev tools, 12 chat tools,
  13 algorithms, 34 services, 12 AI modules, 11 templates, 4 gov services
- Created `docs/toolhub/INVENTORY.md`

## P1 — ToolManifest Schema + Validation (3704e2c)
- Defined `ToolManifest` type with 13 fields
- `validateManifest()` — 8 field-level checks + semver regex
- `hashManifest()` — SHA-256 over canonical manifest fields
- `ManifestRegistry` class — register, get, list (filtered), unregister
- JSON Schema: `apps/tooling/tool-manifest.schema.json`
- 25 tests

## P2 — ToolHub Host App (e8399cc)
- `ToolHub` class wrapping ManifestRegistry
- `search()` — text search across name, description, tags
- `discover()` — structured filter by category/brand/status/tag
- `launch()` — creates LaunchRecord with SHA-256 session hash
- `checkAccess()` — capability-gated access control
- `recordHealth()` / `getHealth()` — health monitoring cache
- `getLaunches()` — filtered launch history
- 13 tests

## P3 — Brand Profiles (dde36f3)
- `BrandProfile` type with policies, colors, capabilities
- `validateBrandProfile()` — hex color regex, required fields
- `BrandRegistry` class
- Brand JSON configs: `evident.json`, `xtx396.json`
- 12 tests

## P4 — Convert Existing Tools (5df1aea)
- 8 manifest JSON files in `apps/manifests/`:
  - civics-hierarchy, epstein-library-evid, essential-goods-ledg,
    geneva-bible-study-t (apps)
  - search-legal-documents, analyze-document (chat-tools)
  - bates-generator, integrity-sweep (algorithms)
- All manifests pass `validateManifest()`
- 17 tests

## P5 — Highlight Tools Integration (30789c8)
- `evaluateRisk()` — weighted risk scoring (low/medium/high/critical)
- `evaluateAcceptance()` — pass/fail/skip criteria evaluation
- Both produce SHA-256-hashed reports
- 11 tests

## P6 — Shell Integration Plan (aa193a8)
- `docs/tools/SHELL_INTEGRATION.md` — architecture, routing,
  security constraints, directory map
- `apps/toolhub/index.ts` — barrel export for all public APIs
- 9 tests (barrel export resolution)

## P7 — Policy Generator (3913812)
- `generatePolicy()` — single brand+category policy document
- `generateAllPolicies()` — batch generation across all combos
- `verifyPolicyIntegrity()` — SHA-256 body hash verification
- `governance/tools/POLICY_GUIDE.md` — generation guide
- 14 tests

## P8 — B15 Packaging (this commit)
- This changelog
- `docs/tools/README.md` — ToolHub platform overview
- B15 chain complete

---

## Test Summary

| Phase | Tests | Cumulative |
|-------|-------|------------|
| P1    | 25    | 25         |
| P2    | 13    | 38         |
| P3    | 12    | 50         |
| P4    | 17    | 67         |
| P5    | 11    | 78         |
| P6    | 9     | 87         |
| P7    | 14    | 101        |
| **Total** | **101** | — |

## Directory Map

```
apps/
├── toolhub/
│   ├── index.ts                    ← Barrel export (P6)
│   ├── ToolHub.ts                  ← Core service (P2)
│   ├── BrandProfile.ts            ← Brand loader (P3)
│   └── brands/
│       ├── evident.json            ← Brand config (P3)
│       └── xtx396.json            ← Brand config (P3)
├── tooling/
│   ├── ToolManifest.ts            ← Schema + registry (P1)
│   ├── HighlightTools.ts          ← Risk + acceptance (P5)
│   ├── generatePolicies.ts        ← Policy generator (P7)
│   └── tool-manifest.schema.json  ← JSON Schema (P1)
└── manifests/
    └── *.manifest.json             ← 8 tool manifests (P4)

docs/
├── toolhub/
│   └── INVENTORY.md               ← Apps inventory (P0)
└── tools/
    ├── README.md                   ← Platform overview (P8)
    └── SHELL_INTEGRATION.md       ← Integration plan (P6)

governance/
└── tools/
    ├── B15_CHANGELOG.md           ← This file (P8)
    └── POLICY_GUIDE.md            ← Policy generation guide (P7)

ops/__tests__/
└── b15-toolhub.test.ts            ← 101 tests (P1–P7)
```
