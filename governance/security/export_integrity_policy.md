# Export Integrity Policy

> Governance | B16-P7 | Classification: Security-Critical

## Purpose

All exports from the Evident platform must be forensically defensible —
deterministic, watermarked, hashable, and verifiable.

## Requirements

### 1. Deterministic Ordering

All exported records MUST be sorted by a stable, deterministic key (record ID,
lexicographic ascending) before any hash computation or delivery.

### 2. Watermarking

Every export MUST include a watermark containing:

- Tenant identifier
- Export timestamp (ISO-8601)
- Unique export batch identifier
- System identifier
- Format version

### 3. Integrity Hashing

A SHA-256 hash MUST be computed over the canonical representation of the sorted
records and included in the export manifest.

### 4. Tenant Scope Enforcement

Exports MUST NOT include records belonging to another tenant. Cross-tenant
inclusion MUST be rejected at creation time.

### 5. Verification on Consumption

Any system consuming an export MUST re-verify the integrity hash before
processing the data. Mismatched hashes MUST result in rejection.

### 6. Audit Trail

All export operations MUST be logged:

- `export_created` — new export generated
- `export_verified` — successful integrity verification
- `export_tampered` — integrity mismatch detected
- `export_rejected` — structural validation failure

### 7. Reproducibility

Given the same records, timestamp, and export ID, two independent export
operations MUST produce identical integrity hashes.

## Prohibited Actions

- Exporting without watermark
- Exporting cross-tenant data
- Delivering exports without integrity hash
- Modifying export records after hash computation
- Suppressing tamper detection events

---

*Effective with B16-P7 implementation.*
