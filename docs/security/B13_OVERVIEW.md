# B13 — Source Code Protection + Anti-Deletion + Recovery

## Overview

B13 establishes layered defences for source code, configuration, and governance
assets. The objective is to ensure that even under catastrophic scenarios —
repository deletion, credential compromise, ransomware, or supply chain attack —
the organization can verify integrity, restore operations, and maintain an
auditable recovery trail.

## Design Principles

1. **Defence in depth:** No single control is sufficient. Backup, escrow,
   hooks, and verification compose together.
2. **Fail-closed:** All verification scripts return explicit PASS/FAIL. Ambiguity
   is treated as failure.
3. **Append-only audit:** Break-glass invocations and restore drills emit audit
   events to the existing ops audit stream.
4. **Local-first:** Encryption uses age/AES-256. No cloud dependency in the
   default path.
5. **Deterministic verification:** Manifests contain per-file SHA-256 hashes.
   Verification is reproducible.

## Scope

| Asset Category | Examples | Protection |
|----------------|----------|------------|
| Governance | `/governance/**`, policies, changelogs | Backup, anti-deletion hooks, escrow |
| Workflows | `/.github/workflows/**` | Backup, anti-deletion hooks |
| Ops infrastructure | `/ops/**` | Backup, escrow |
| Applications | `/apps/**` | Backup, escrow, manifests |
| Contracts | `/contracts/**` | Backup (when created) |
| Secrets metadata | `.env.template`, key inventory | Backup (templates only, never actual secrets) |

## Ruin Scenarios

1. **Repository deletion** — Accidental or malicious `git push --force` or GitHub admin deletion
2. **Ransomware** — Local machine encryption of workspace
3. **Credential compromise** — GitHub PAT or SSH key leaked
4. **Supply chain attack** — Malicious dependency introduced
5. **Machine compromise** — Developer workstation compromised

Each scenario has a dedicated break-glass checklist (B13-P5).

## Components

| Component | Phase | Purpose |
|-----------|-------|---------|
| Critical Assets Inventory | P1 | Catalog what matters and RPO/RTO |
| Encrypted Backup System | P2 | Immutable bundles with manifests |
| Restore Drill | P3 | Quarterly verification |
| Artifact Escrow | P4 | Release provenance |
| Break-Glass Protocol | P5 | Incident response |
| Package Registry Strategy | P6 | Internal distribution |
| Workstation Hardening | P7 | Endpoint security |
| Anti-Deletion Guardrails | P8 | Git hooks for protected paths |
| Verify Workflow | P9 | CI validation |
