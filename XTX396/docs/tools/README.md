# ToolHub — Shared Tools Platform

> Chain B15 | Branch: `feature/b13b14b15-phase-runner`

## Overview

ToolHub is the shared tools platform for Evident Technologies and
XTX396. It provides:

- **Tool registration** via typed, validated manifests
- **Discovery** by text search or structured filters
- **Launch tracking** with SHA-256 session hashing
- **Access control** via capability-gated checks
- **Health monitoring** per tool
- **Brand theming** through brand profile configurations
- **Risk scoring** and acceptance criteria evaluation
- **Policy generation** from manifests and brand profiles

## Quick Start

```ts
import {
  ToolHub,
  ManifestRegistry,
  validateManifest,
  BrandRegistry,
  evaluateRisk,
} from '../../apps/toolhub';

// Register a tool
const registry = new ManifestRegistry();
registry.register({
  id: 'my-tool',
  name: 'My Tool',
  description: 'Does useful things',
  version: '1.0.0',
  category: 'app',
  status: 'active',
  brand: 'evident',
  entryPoint: '/tools/my-tool',
});

// Create hub and search
const hub = new ToolHub(registry);
const results = hub.search('useful');
console.log(results.totalCount); // 1

// Launch with access check
const access = hub.checkAccess('my-tool', ['read', 'write']);
if (access.allowed) {
  const launch = hub.launch('my-tool', 'user-123');
  console.log(launch.sessionHash); // SHA-256
}
```

## Architecture

See [SHELL_INTEGRATION.md](SHELL_INTEGRATION.md) for the full
integration plan, routing conventions, and security constraints.

## Testing

```bash
npx vitest run ops/__tests__/b15-toolhub.test.ts
```

101 tests covering all 7 implementation phases (P1–P7).

## Governance

- [B15_CHANGELOG.md](../../governance/tools/B15_CHANGELOG.md)
- [POLICY_GUIDE.md](../../governance/tools/POLICY_GUIDE.md)

## References

- [Apps Inventory](../toolhub/INVENTORY.md) — Full tool catalog
- [Tool Manifest Schema](../../apps/tooling/tool-manifest.schema.json)
- Brand profiles: `apps/toolhub/brands/`
