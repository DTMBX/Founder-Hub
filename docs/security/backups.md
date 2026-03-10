# Backup System — B13-P2

## Overview

The backup system creates immutable, deterministic bundles of repository
contents with per-file SHA-256 hashing and optional AES-256 encryption.

## Bundle Structure

```
<bundle-dir>/
  manifest.json      File list with SHA-256 hashes
  metadata.json      Timestamp, repo, commit, encryption info
  bundle.sha256      Integrity digest of manifest + metadata
  files.tar.gz       Compressed archive
  files.tar.gz.age   Encrypted archive (requires age CLI)
```

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| BackupService | `ops/backup/BackupService.ts` | Core service — manifest generation, hash verification |
| LocalProvider | `ops/backup/providers/LocalProvider.ts` | Local filesystem storage |
| OffsiteProviderStub | `ops/backup/providers/OffsiteProviderStub.ts` | Placeholder for remote storage |
| backup.ps1 | `scripts/security/backup.ps1` | PowerShell script for creating backups |
| backup-verify.ps1 | `scripts/security/backup-verify.ps1` | PowerShell script for verifying bundles |

## Usage

### Create a backup

```powershell
.\scripts\security\backup.ps1 -RepoPath "C:\repos\Founder-Hub"
.\scripts\security\backup.ps1 -RepoPath "C:\repos\Founder-Hub" -OutputDir "D:\backups" -NoEncrypt
```

### Verify a backup

```powershell
.\scripts\security\backup-verify.ps1 -BundlePath "D:\backups\20250101-120000"
.\scripts\security\backup-verify.ps1 -BundlePath "D:\backups\20250101-120000" -RepoPath "C:\repos\Founder-Hub"
```

## Exclusions

The following paths are excluded from backups:

- `node_modules/`
- `dist/`, `build/`, `.next/`, `_site/`
- `.git/`
- `__pycache__/`, `*.pyc`
- `.env`, `.env.local`, `.env.*` (secrets)
- `dump.rdb`, `*.log`, `.cache/`

**Explicitly included:** `.env.template`, `.env.example`

## Encryption

Backups are encrypted using [age](https://github.com/FiloSottile/age) with
AES-256. The `age` CLI must be installed and available on PATH.

If `age` is not available, the backup is created unencrypted with a warning.
The `-NoEncrypt` flag skips encryption intentionally.

## Determinism

- Manifest entries sorted alphabetically by path
- SHA-256 hashes computed from raw file bytes
- Bundle hash derived from manifest + metadata JSON
- All timestamps use ISO 8601 format

## Audit Integration

`BackupService.createBundle()` emits an audit event of category
`system.config_changed` recording the bundle ID, repo, commit hash, file count,
and bundle hash.

## Recovery

See [B13-P3 Restore Drill](./restore-drill.md) for restore procedures.
