# Backup Policy — B13-P2

**Effective:** 2025-01-01
**Owner:** Engineering / Security
**Classification:** Internal

---

## 1. Purpose

This policy establishes requirements for the creation, verification, storage,
and rotation of source-code and configuration backups for Evident Technologies
repositories.

## 2. Scope

Applies to all repositories classified as Tier 1 or Tier 2 in the
[Critical Assets Inventory](./critical_assets_inventory.md).

## 3. Backup Requirements

### 3.1 Frequency

| Tier | Minimum Frequency | RPO |
|------|--------------------|-----|
| 1 | Daily | 4 hours |
| 2 | Weekly | 24 hours |

### 3.2 Content

Backups must include:

- All source code files
- Configuration files (excluding secrets)
- Governance documents
- CI/CD workflow definitions
- Build configuration
- Environment templates (`.env.template`)

Backups must exclude:

- Runtime secrets (`.env`, `.env.local`)
- Build artifacts (`dist/`, `build/`)
- Dependencies (`node_modules/`, `__pycache__/`)
- Database dumps (handled separately)

### 3.3 Integrity

- Every backup bundle must include a manifest with per-file SHA-256 hashes.
- The manifest itself must be hashed and recorded in metadata.
- A bundle-level hash must be recorded for tamper detection.

### 3.4 Encryption

- All offsite backups must be encrypted using AES-256 or equivalent.
- Local backups should be encrypted; unencrypted local backups are acceptable
  only in controlled environments with physical access controls.

### 3.5 Storage Locations

| Location | Purpose | Retention |
|----------|---------|-----------|
| Local filesystem | Immediate recovery | 30 days rolling |
| Offsite / cloud | Disaster recovery | 90 days minimum |

## 4. Verification

### 4.1 Automated Verification

Every backup must be verified immediately after creation:

- Manifest completeness (all expected files present)
- Hash integrity (all SHA-256 values match)
- Metadata consistency (manifest hash recorded correctly)
- Archive integrity (if tar/gz created)

### 4.2 Periodic Verification

- Weekly: One random backup selected and fully verified
- Monthly: Full restore drill (see B13-P3 Restore Drill policy)

## 5. Restore Testing

Restore drills must be conducted monthly to verify:

- Bundle can be decrypted
- Archive can be extracted
- All files match their manifest hashes
- Application can build from restored source

Results must be logged as audit events.

## 6. Retention and Rotation

- Local backups: 30 days rolling (oldest deleted first)
- Offsite backups: 90 days minimum, 1 year recommended
- Rotation must be logged as audit events
- Deleted backups must have their bundle IDs recorded in an append-only log

## 7. Audit Trail

All backup operations must emit audit events:

| Operation | Event Category |
|-----------|----------------|
| Bundle created | `system.config_changed` |
| Bundle verified | `system.config_changed` |
| Bundle restored | `system.config_changed` |
| Bundle rotated/deleted | `system.config_changed` |

## 8. Responsibilities

| Role | Responsibility |
|------|---------------|
| Engineering Lead | Ensure backup schedule is maintained |
| Security Review | Verify encryption and access controls |
| Operations | Monitor backup health and storage capacity |

## 9. Exceptions

Exceptions to this policy require written approval from the Engineering Lead
and must be time-bound (maximum 30 days).
