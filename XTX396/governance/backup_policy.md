# Backup Policy

> Version 1.0 | Last Updated: 2026-02-17 | Chain B5

This document defines the backup strategy, retention policy, and recovery
objectives for XTX396 and related repositories.

---

## Overview

### Purpose

Ensure data integrity, business continuity, and compliance through:
- Regular automated backups
- Secure encrypted storage
- Tested restore procedures
- Clear recovery objectives

### Scope

This policy covers:
- **Source code repositories** (XTX396, Evident)
- **GitHub Actions workflow history**
- **Release artifacts and provenance records**
- **Configuration and secrets metadata**

---

## Backup Schedule

### Nightly Backups

| Item | Schedule | Retention | Method |
|------|----------|-----------|--------|
| Repository (full clone) | Daily 02:00 UTC | 30 days | Git mirror + archive |
| GitHub metadata | Daily 02:00 UTC | 30 days | API export |
| Release artifacts | On release | 365 days | S3/archive |

### Monthly Archives

| Item | Schedule | Retention | Method |
|------|----------|-----------|--------|
| Full repo snapshot | 1st of month | 12 months | Git bundle |
| Configuration audit | 1st of month | 12 months | JSON export |

---

## Retention Policy

### Daily Backups (Hot)

- **Retention:** 30 days rolling
- **Storage:** Primary backup location
- **Access:** Immediate (< 1 minute)
- **Purpose:** Rapid recovery from recent incidents

### Monthly Archives (Warm)

- **Retention:** 12 months
- **Storage:** Secondary backup location
- **Access:** Moderate (< 1 hour)
- **Purpose:** Historical recovery, compliance

### Annual Archives (Cold)

- **Retention:** 7 years (legal hold)
- **Storage:** Cold storage (Glacier-class)
- **Access:** Slow (< 24 hours)
- **Purpose:** Legal/regulatory compliance

---

## Recovery Objectives

### Recovery Time Objective (RTO)

| Scenario | RTO | Notes |
|----------|-----|-------|
| Code corruption | 15 minutes | Restore from nightly backup |
| Accidental deletion | 30 minutes | Restore from backup + verify |
| Repository compromise | 1 hour | Full restore + credential rotation |
| Complete infrastructure loss | 4 hours | DR activation + full restore |

### Recovery Point Objective (RPO)

| Data Type | RPO | Justification |
|-----------|-----|---------------|
| Source code | 24 hours | Nightly backup cycle |
| GitHub metadata | 24 hours | Nightly backup cycle |
| Production builds | 0 hours | Immutable artifacts |
| Release provenance | 0 hours | Immutable records |

---

## Encryption Requirements

### At Rest

All backups MUST be encrypted at rest using:
- **Algorithm:** AES-256-GCM
- **Key Management:** AWS KMS or compatible HSM
- **Key Rotation:** Annual minimum, immediate on compromise

### In Transit

- **Protocol:** TLS 1.3 minimum
- **Certificate Validation:** Required
- **mTLS:** Recommended for backup transfers

### Archive Format

```
backup-YYYYMMDD-HHMM.tar.gz.enc
├── checksum.sha256
├── manifest.json
└── encrypted payload
```

---

## Backup Storage Locations

### Primary: S3-Compatible Storage

- **Service:** AWS S3 / Backblaze B2 / MinIO
- **Bucket:** `xtx396-backups-primary`
- **Region:** US East (primary)
- **Versioning:** Enabled
- **Lifecycle:** Auto-transition after retention period

### Secondary: Geographic Redundancy

- **Service:** Separate provider/region
- **Purpose:** DR if primary provider unavailable
- **Sync:** Daily replication from primary

### Local (Development Only)

- **Path:** `~/.xtx396-backups/` (gitignored)
- **Purpose:** Testing restore procedures
- **Retention:** 7 days

---

## Access Control

### Backup Service Account

- **Permission Scope:** Read-only repository access
- **Token Type:** GitHub App installation token (Chain B2)
- **Rotation:** Automatic (1-hour expiry)

### Storage Access

| Role | Access Level |
|------|--------------|
| Backup Service | Write to backup bucket |
| SRE/Admin | Read + download |
| Dev Team | No direct access |
| Auditor | Read manifest only |

---

## Monitoring & Alerting

### Backup Job Monitoring

| Metric | Alert Threshold | Notification |
|--------|-----------------|--------------|
| Backup completion | Not completed by 04:00 UTC | Slack + Email |
| Backup size anomaly | ±50% from baseline | Slack |
| Encryption failure | Any | Slack + PagerDuty |
| Storage quota | > 80% utilized | Slack |

### Health Checks

- Daily: Verify backup exists and checksum valid
- Weekly: Sample restore test (automated)
- Quarterly: Full restore drill (manual)

---

## Compliance

### Audit Requirements

- Backup logs retained for 2 years
- Access logs retained for 2 years
- Restore attempts logged with actor identity

### Regulatory Alignment

- **SOC 2:** Backup and recovery controls documented
- **GDPR:** Personal data backups follow same retention
- **Legal Hold:** Suspend deletion when litigation hold active

---

## Exclusions

The following are NOT backed up:

- **Secrets/credentials** - Stored separately in secret manager
- **Build caches** - Reconstructible from source
- **Node modules** - Reconstructible from lockfile
- **Preview deployments** - Ephemeral by design

---

## Related Documents

- [DR Runbook](./dr_runbook.md)
- [Release Process](./release_process.md)
- [Rollback Runbook](./rollback_runbook.md)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-17 | 1.0 | System | Initial policy (Chain B5) |
