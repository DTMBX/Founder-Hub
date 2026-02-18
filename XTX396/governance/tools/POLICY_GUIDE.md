# ToolHub Governance — Policy Generation Guide

> B15-P7 | Last Updated: 2025-01-20

## Purpose

This directory contains governance policy documents generated from
ToolManifest entries and BrandProfile configurations. Policies are
deterministic, reproducible, and integrity-hashed.

## Generation

Policies are generated using `apps/tooling/generatePolicies.ts`:

```ts
import { generateAllPolicies } from '../apps/tooling/generatePolicies';
import { BrandProfile } from '../apps/toolhub/BrandProfile';
import { ToolManifest } from '../apps/tooling/ToolManifest';

const brands: BrandProfile[] = [/* loaded from JSON */];
const tools: ToolManifest[] = [/* loaded from manifests */];

const policies = generateAllPolicies(brands, tools);

for (const policy of policies) {
  // Write policy.body to governance/tools/{policy.policyId}.md
}
```

## Integrity Verification

Each policy includes a SHA-256 hash of its body:

```ts
import { verifyPolicyIntegrity } from '../apps/tooling/generatePolicies';

const valid = verifyPolicyIntegrity(policyDocument);
// true if body has not been modified
```

## Policy Scope

Policies are generated per brand + category combination:

| Brand   | Category   | Policy ID              |
|---------|-----------|------------------------|
| evident | app       | pol-evident-app        |
| evident | algorithm | pol-evident-algorithm  |
| evident | chat-tool | pol-evident-chat-tool  |
| xtx396  | dev-tool  | pol-xtx396-dev-tool    |

## Requirements Matrix

Each policy inherits requirements from its brand profile:

- **Audit logging** — All state changes logged
- **Integrity hashing** — SHA-256 on all artifacts
- **Immutable originals** — Original data never overwritten
- **Append-only logs** — Logs cannot be deleted or modified

## File Naming

Policy files follow the pattern: `{policy-id}.md`

Example: `pol-evident-app.md`

---

*See also: [SHELL_INTEGRATION.md](../../docs/tools/SHELL_INTEGRATION.md)*
