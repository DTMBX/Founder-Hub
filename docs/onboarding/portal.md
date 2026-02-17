# Customer Portal — Handoff Packages

## Overview

When an engagement reaches a deliverable milestone, the handoff package system
bundles all relevant files, generates a manifest with per-file SHA-256 hashes,
and creates a bundle-level integrity hash.

## Lifecycle

```
assemble → finalize → deliver
```

1. **Assemble** — Files are added and hashed. An audit extract can be attached.
2. **Finalize** — Package is sealed. No further modifications.
3. **Deliver** — Delivery event recorded with recipient and timestamp.

## Manifest

Each package includes a `PackageManifest`:

| Field        | Description                        |
| ------------ | ---------------------------------- |
| packageId    | Unique identifier (PKG-xxx-xxx)    |
| clientId     | Target client                      |
| engagementId | Related engagement or matter       |
| files[]      | Array of {path, size, sha256}      |
| totalSize    | Sum of all file sizes              |
| fileCount    | Number of files                    |
| manifestHash | SHA-256 over packageId + files     |
| createdAt    | When the manifest was generated    |

The `manifestHash` is computed over `JSON.stringify({ packageId, files })`,
enabling third-party verification without access to original file content.

## Verification

Call `verifyManifest(packageId)` to recompute the manifest hash and confirm
integrity. Returns `{ valid: true }` or `{ valid: false, reason }`.

## Audit Extract

An optional array of `AuditExtractEntry` objects can be attached during assembly
to provide engagement timeline context:

```ts
{ timestamp: string; action: string; actor: string; detail?: string }
```

## Schema

See `ops/portal/package.schema.json` for the JSON Schema definition.

## Files

| File | Purpose |
| ---- | ------- |
| `ops/portal/HandoffPackageService.ts` | Core service |
| `ops/portal/package.schema.json` | Manifest schema |
| `docs/onboarding/portal.md` | This document |
