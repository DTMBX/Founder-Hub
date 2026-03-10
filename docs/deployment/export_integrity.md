# Export Integrity — Law Firm Export Hardening

> B16-P7 | Deployment Documentation | Classification: Security-Critical

## Overview

The ExportIntegrity module ensures that all data exports from the platform are:

- **Deterministic** — records are sorted by ID before export
- **Watermarked** — every export contains tenant, timestamp, and system metadata
- **Hashable** — SHA-256 integrity hash computed over canonical record content
- **Verifiable** — any consumer can re-verify the export has not been tampered with
- **Tenant-scoped** — cross-tenant records are rejected at export time
- **Audited** — every create, verify, and tamper event is logged

## Components

| Component | Purpose |
|---|---|
| `sortRecords()` | Deterministic lexicographic sort by record ID |
| `hashRecords()` | SHA-256 hash of canonical record representation |
| `ExportIntegrity.createExport()` | Generate watermarked, hashed export manifest |
| `ExportIntegrity.verifyExport()` | Re-verify manifest integrity on consumption |
| `ExportIntegrity.getAuditLog()` | Retrieve append-only export audit trail |

## Watermark Fields

| Field | Description |
|---|---|
| `tenantId` | Tenant who requested the export |
| `exportedAt` | ISO-8601 timestamp of export generation |
| `exportId` | Unique batch identifier |
| `system` | Always `evident-founder-hub` |
| `version` | Export format version (currently `1`) |

## Reproducibility

Two exports of the same records with the same timestamp and export ID produce
bit-identical integrity hashes. This is achieved through:

1. Deterministic record sorting (lexicographic by ID)
2. Canonical JSON serialisation (sorted keys)
3. Fixed watermark values

## Tamper Detection

On verification, the module:

1. Checks structural integrity (record count, watermark presence)
2. Re-sorts and re-hashes the records
3. Compares the recomputed hash against the stored integrity hash
4. Verifies sort order has been preserved

Any mismatch triggers a `export_tampered` audit event.

## Usage

```ts
import { ExportIntegrity } from '../../ops/export/ExportIntegrity';

const ei = new ExportIntegrity();

// Create export
const manifest = ei.createExport(tenantId, records);

// Later: verify
const result = ei.verifyExport(manifest);
if (!result.valid) {
  console.error('Export tampered:', result.reason);
}
```

## Security Constraints

- Empty tenant ID rejected
- Cross-tenant record inclusion rejected
- Watermark cannot be omitted
- All operations logged to append-only audit trail

---

*Implemented in B16-P7. Source: `ops/export/ExportIntegrity.ts`*
