# Restore Drill — B13-P3

## Overview

Restore drills verify that backup bundles can be successfully restored and that
all file hashes match their manifest entries. Drills are required monthly per
the [Backup Policy](../../governance/security/backup_policy.md).

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| RestoreService | `ops/backup/RestoreService.ts` | Programmatic restore + drill API |
| restore-drill.ps1 | `scripts/security/restore-drill.ps1` | PowerShell drill script |

## Drill Process

1. Load `manifest.json` and `metadata.json` from bundle
2. Verify manifest hash matches `metadata.manifestHash`
3. Verify `bundle.sha256` exists
4. (If repo path provided) Verify per-file SHA-256 hashes
5. Simulate build check
6. Generate drill report JSON

## Usage

### PowerShell Script

```powershell
# Basic drill (manifest/metadata verification only)
.\scripts\security\restore-drill.ps1 -BundlePath "D:\backups\20250101-120000"

# Full drill with file-level verification
.\scripts\security\restore-drill.ps1 `
  -BundlePath "D:\backups\20250101-120000" `
  -RepoPath "C:\repos\XTX396" `
  -ConductedBy "monthly-review"
```

### Programmatic (TypeScript)

```typescript
import { RestoreService } from './ops/backup/RestoreService';
import { BackupService } from './ops/backup/BackupService';

const restoreService = new RestoreService();
const bundle = /* loaded from provider */;
const files = /* loaded from archive or filesystem */;

// Quick verification
const verification = restoreService.verifyBundle(bundle);

// Full restore drill
const report = await restoreService.conductDrill(bundle, files, 'ci-pipeline');
```

## Drill Report

Each drill generates a JSON report saved alongside the bundle:

```json
{
  "drillId": "drill_20250101-120000",
  "bundlePath": "D:\\backups\\20250101-120000",
  "conductedBy": "monthly-review",
  "conductedAt": "2025-01-01T12:00:00.000Z",
  "passed": 8,
  "failed": 0,
  "verdict": "PASS"
}
```

## Schedule

| Frequency | Type | Scope |
|-----------|------|-------|
| Weekly | Quick verify | Manifest + metadata integrity |
| Monthly | Full drill | File-level verification + build simulation |
| Quarterly | Cross-repo | Both XTX396 and Evident repos |

## Audit Integration

Both `RestoreService.restore()` and `RestoreService.conductDrill()` emit audit
events of category `system.config_changed` recording drill ID, bundle ID,
status, verification counts, and duration.
