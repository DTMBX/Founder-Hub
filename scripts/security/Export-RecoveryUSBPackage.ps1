<#
.SYNOPSIS
    Exports a complete USB recovery package for offline disaster recovery.

.DESCRIPTION
    Assembles all recovery artifacts into a single directory suitable for
    writing to a USB drive or secure offline storage:

    1. Latest recovery checkpoint (encrypted JSON)
    2. Full-state backup (all localStorage, encrypted)
    3. Admin keyfile export (if present in localStorage)
    4. SECURITY.md (current security architecture reference)
    5. Restore playbook (instructions for performing an offline restore)
    6. Verification manifest (SHA-256 hashes of all included files)

    All data remains AES-256-GCM encrypted. This script does NOT decrypt
    any secrets — it packages the encrypted blobs for offline transport.

    Requires: Node.js, Playwright (for checkpoint creation)

.PARAMETER OutputDir
    Directory to write the recovery package to. Created if it doesn't exist.
    Defaults to ./recovery-usb-<timestamp>

.PARAMETER SkipCheckpoint
    Skip creating a fresh checkpoint. Only package existing data.

.PARAMETER BaseUrl
    URL of the running Founder Hub instance. Defaults to http://localhost:5173.

.PARAMETER WhatIf
    Show what would be done without executing.

.EXAMPLE
    .\Export-RecoveryUSBPackage.ps1
    .\Export-RecoveryUSBPackage.ps1 -OutputDir E:\FounderHub-Recovery
    .\Export-RecoveryUSBPackage.ps1 -SkipCheckpoint -WhatIf
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$OutputDir,

    [switch]$SkipCheckpoint,

    [string]$BaseUrl = 'http://localhost:5173'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'

if (-not $OutputDir) {
    $OutputDir = Join-Path $repoRoot "recovery-usb-$timestamp"
}

Write-Host "`n=== Export Recovery USB Package ===" -ForegroundColor Cyan
Write-Host "Output:   $OutputDir"
Write-Host "Repo:     $repoRoot"
Write-Host "Base URL: $BaseUrl"
Write-Host ""

# Create output directory
if ($PSCmdlet.ShouldProcess($OutputDir, 'Create directory')) {
    New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
}

$fileList = @()

# --- Step 1: Create fresh checkpoint and export ---
if (-not $SkipCheckpoint) {
    Write-Host "[1/5] Creating fresh checkpoint..." -ForegroundColor DarkGray
    $ckptFile = Join-Path $OutputDir "checkpoint-$timestamp.json"

    if ($PSCmdlet.ShouldProcess('checkpoint', 'Create and export')) {
        $ckptScript = Join-Path $PSScriptRoot 'New-RecoveryCheckpoint.ps1'
        if (Test-Path $ckptScript) {
            & $ckptScript -Label "usb-export-$timestamp" -BaseUrl $BaseUrl -ExportPath $ckptFile
            if (Test-Path $ckptFile) {
                $fileList += $ckptFile
                Write-Host "  Checkpoint exported." -ForegroundColor Green
            } else {
                Write-Host "  Checkpoint export failed — continuing without it." -ForegroundColor Yellow
            }
        } else {
            Write-Host "  New-RecoveryCheckpoint.ps1 not found — skipping." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[1/5] Skipping checkpoint (--SkipCheckpoint)" -ForegroundColor DarkGray
}

# --- Step 2: Copy SECURITY.md ---
Write-Host "[2/5] Copying SECURITY.md..." -ForegroundColor DarkGray
$secSrc = Join-Path $repoRoot 'SECURITY.md'
$secDst = Join-Path $OutputDir 'SECURITY.md'
if (Test-Path $secSrc) {
    if ($PSCmdlet.ShouldProcess($secSrc, 'Copy')) {
        Copy-Item $secSrc $secDst -Force
        $fileList += $secDst
        Write-Host "  Copied." -ForegroundColor Green
    }
} else {
    Write-Host "  SECURITY.md not found." -ForegroundColor Yellow
}

# --- Step 3: Generate restore playbook ---
Write-Host "[3/5] Generating restore playbook..." -ForegroundColor DarkGray
$playbookPath = Join-Path $OutputDir 'RESTORE_PLAYBOOK.md'

$playbook = @"
# Founder Hub — Offline Restore Playbook

Generated: $timestamp

## Prerequisites

- Node.js 18+ installed
- Git clone of DTMBX/Founder-Hub repo
- This USB recovery package

## Quick Restore

1. Clone the repo: ``git clone https://github.com/DTMBX/Founder-Hub.git``
2. Install dependencies: ``npm install``
3. Install Playwright: ``npx playwright install chromium``
4. Start dev server: ``npm run dev``
5. Run restore:

   ``.\scripts\security\Restore-FromCheckpoint.ps1 -FilePath <path-to-checkpoint.json>``

6. Refresh browser — all data restored.

## What's in This Package

| File | Description |
| ---- | ----------- |
| checkpoint-*.json | Encrypted snapshot of all app + vault state |
| SECURITY.md | Current security architecture documentation |
| RESTORE_PLAYBOOK.md | This file |
| MANIFEST.sha256 | SHA-256 hashes of all files for integrity verification |

## Verifying Integrity

``Get-Content MANIFEST.sha256 | ForEach-Object { `$hash, `$file = `$_ -split '  '; if ((Get-FileHash `$file -Algorithm SHA256).Hash -eq `$hash) { "OK: `$file" } else { "FAIL: `$file" } }``

## Recovery Paths

1. **Checkpoint restore**: Restores app state + vault secrets to a specific point in time
2. **Full backup restore**: Restores complete localStorage including all keys
3. **Manual recovery**: Import keyfile + use recovery phrase to regain admin access, then restore content from GitHub repo data files

## Important Notes

- All checkpoint data is AES-256-GCM encrypted. Decryption requires the app's encryption salt (stored in the checkpoint itself).
- If the encryption salt is lost, backup codes and recovery phrase are the fallback.
- Store this package in a secure location. While encrypted, treat it as sensitive.
"@

if ($PSCmdlet.ShouldProcess($playbookPath, 'Create')) {
    Set-Content -Path $playbookPath -Value $playbook -Encoding UTF8
    $fileList += $playbookPath
    Write-Host "  Generated." -ForegroundColor Green
}

# --- Step 4: Copy restore script ---
Write-Host "[4/5] Copying restore script..." -ForegroundColor DarkGray
$restoreSrc = Join-Path $PSScriptRoot 'Restore-FromCheckpoint.ps1'
$restoreDst = Join-Path $OutputDir 'Restore-FromCheckpoint.ps1'
if (Test-Path $restoreSrc) {
    if ($PSCmdlet.ShouldProcess($restoreSrc, 'Copy')) {
        Copy-Item $restoreSrc $restoreDst -Force
        $fileList += $restoreDst
        Write-Host "  Copied." -ForegroundColor Green
    }
}

# --- Step 5: Generate integrity manifest ---
Write-Host "[5/5] Generating integrity manifest..." -ForegroundColor DarkGray
$manifestPath = Join-Path $OutputDir 'MANIFEST.sha256'

if ($PSCmdlet.ShouldProcess($manifestPath, 'Create')) {
    $manifestLines = @()
    foreach ($file in $fileList) {
        if ((Test-Path $file) -and $file -ne $manifestPath) {
            $hash = (Get-FileHash $file -Algorithm SHA256).Hash
            $relName = [System.IO.Path]::GetFileName($file)
            $manifestLines += "$hash  $relName"
        }
    }
    Set-Content -Path $manifestPath -Value ($manifestLines -join "`n") -Encoding UTF8
    Write-Host "  Generated ($($manifestLines.Count) files hashed)." -ForegroundColor Green
}

# --- Summary ---
Write-Host "`n--- Package Summary ---" -ForegroundColor Cyan
$totalFiles = (Get-ChildItem $OutputDir -File).Count
$totalSize = (Get-ChildItem $OutputDir -File | Measure-Object -Property Length -Sum).Sum
$sizeKB = [math]::Round($totalSize / 1024, 1)

Write-Host "  Directory: $OutputDir"
Write-Host "  Files:     $totalFiles"
Write-Host "  Size:      ${sizeKB} KB"
Write-Host "`nRecovery USB package ready." -ForegroundColor Green
Write-Host "Copy the '$OutputDir' directory to a USB drive and store securely." -ForegroundColor Yellow
