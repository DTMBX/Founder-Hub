# Shell Integration Plan — ToolHub ↔ Founder-Hub

> B15-P6 | Status: Plan Approved | Last Updated: 2025-01-20

## Purpose

This document describes how the ToolHub platform integrates into the
Founder-Hub application shell and how external consumers (Evident tools,
third-party launchers) connect to ToolHub services.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Founder-Hub App Shell (React / Vite)                │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Navigation   │  │  ToolHub Panel           │ │
│  │  (sidebar /   │  │  ┌────────────────────┐  │ │
│  │   top bar)    │  │  │  Search / Filter    │  │ │
│  │              │  │  ├────────────────────┤  │ │
│  │  • Tools →   │──│  │  Tool Grid          │  │ │
│  │              │  │  │  (cards per brand)   │  │ │
│  │              │  │  ├────────────────────┤  │ │
│  │              │  │  │  Launch Drawer      │  │ │
│  │              │  │  │  (detail + launch)  │  │ │
│  │              │  │  └────────────────────┘  │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  ToolHub Service Layer                    │   │
│  │  (ManifestRegistry, BrandRegistry,        │   │
│  │   ToolHub, HighlightTools)                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Barrel Export (`apps/toolhub/index.ts`)

All public APIs are re-exported through a single entry point:

```ts
import {
  ToolHub,
  ManifestRegistry,
  BrandRegistry,
  validateManifest,
  hashManifest,
  evaluateRisk,
  evaluateAcceptance,
} from '../../apps/toolhub';
```

This keeps import paths stable if internal files are refactored.

### 2. Manifest Registration (Boot Sequence)

At application startup, manifests from `apps/manifests/*.manifest.json`
are loaded and registered:

```ts
import manifests from '../manifests/*.manifest.json';
import { ToolHub, ManifestRegistry } from '../toolhub';

const registry = new ManifestRegistry();
for (const m of manifests) {
  registry.register(m);
}
const hub = new ToolHub(registry);
```

### 3. Brand Theming

Brand profiles (`apps/toolhub/brands/*.json`) drive visual theming
in the shell:

| Brand Profile Field | Shell Usage                     |
|---------------------|---------------------------------|
| `primaryColor`      | Card header, sidebar accent     |
| `accentColor`       | Action buttons, highlights      |
| `logoPath`          | Tool card logo                  |
| `tagline`           | Brand section subtitle          |
| `toolCategories`    | Filter menu options             |

### 4. Search & Discovery

The shell search bar delegates to `ToolHub.search(query)` and
`ToolHub.discover(filter)`. Results render as filterable tool cards.

Filter controls map directly to `discover()` parameters:

- Category dropdown → `{ category }`
- Brand selector → `{ brand }`
- Status toggle → `{ status }`
- Tag chips → `{ tag }`

### 5. Launch Flow

```
User clicks "Launch" on tool card
  → ToolHub.checkAccess(toolId, userCapabilities)
    → If denied, show missing capability list
    → If allowed:
      → ToolHub.launch(toolId, userId) → LaunchRecord
      → Navigate to tool entryPoint (iframe or route)
      → LaunchRecord logged to audit trail
```

### 6. Health Monitoring

The shell dashboard can poll health status:

```ts
hub.recordHealth('search-legal-documents', true);
const status = hub.getHealth('search-legal-documents');
// { toolId, healthy, checkedAt, detail? }
```

Health badges render as green/red indicators on tool cards.

### 7. Risk & Acceptance Hooks

Before launching tools in sensitive contexts, the shell can invoke
Highlight Tools:

```ts
import { evaluateRisk, evaluateAcceptance } from '../../apps/toolhub';

const risk = evaluateRisk('tool-123', 'tool-launch', factors);
if (risk.level === 'critical') {
  showRiskWarning(risk);
}
```

---

## Directory Map

```
apps/
├── toolhub/
│   ├── index.ts                 ← Barrel export (P6)
│   ├── ToolHub.ts               ← Core service (P2)
│   ├── BrandProfile.ts          ← Brand loader (P3)
│   └── brands/
│       ├── evident.json         ← Brand config (P3)
│       └── founder-hub.json          ← Brand config (P3)
├── tooling/
│   ├── ToolManifest.ts          ← Schema + registry (P1)
│   ├── HighlightTools.ts        ← Risk + acceptance (P5)
│   └── tool-manifest.schema.json
└── manifests/
    ├── civics-hierarchy.manifest.json
    ├── epstein-library-evid.manifest.json
    └── ... (8 total, P4)
```

---

## Routing Convention

Tools are routed under `/tools/:toolId`:

| Route                          | Description            |
|--------------------------------|------------------------|
| `/tools`                       | ToolHub grid view      |
| `/tools?q=search`             | Search results         |
| `/tools?category=algorithm`   | Filtered by category   |
| `/tools/:toolId`              | Tool detail + launch   |
| `/tools/:toolId/health`       | Health status panel    |

---

## Security Constraints

1. **Capability-gated launch** — Every launch checks `ToolHub.checkAccess()`.
   Missing capabilities block launch and are logged.
2. **Archived tools rejected** — `ToolHub.launch()` throws for archived tools.
3. **Session hashing** — Each `LaunchRecord` includes a SHA-256 session hash
   for tamper detection.
4. **Brand policy enforcement** — Brand `policies` flags
   (`requireAuditLog`, `requireIntegrityHash`, `immutableOriginals`,
   `appendOnlyLogs`) are checked at the service layer.
5. **No inline scripts** — Tool entry points load via controlled routes,
   never via `eval()` or `innerHTML`.

---

## Future Work

- **P7:** Policy generator will produce governance docs from manifests.
- **P8:** Changelog and packaging.
- **Post-B15:** React component library for ToolHub UI panel.
- **Post-B15:** WebSocket health polling for real-time status.

---

## References

- [INVENTORY.md](../toolhub/INVENTORY.md) — Full tools inventory (P0)
- [ToolManifest schema](../../apps/tooling/tool-manifest.schema.json)
- Brand profiles: `apps/toolhub/brands/`
