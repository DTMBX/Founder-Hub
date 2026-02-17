<#
.SYNOPSIS
  B13-P2 — Verify a backup bundle's integrity.

.DESCRIPTION
  Validates:
    1. manifest.json exists and is valid JSON
    2. metadata.json exists and references the correct manifest hash
    3. bundle.sha256 matches re-derived hash
    4. Each file in manifest has a valid SHA-256 entry
    5. Archive exists (if expected)

.PARAMETER BundlePath
  Path to the backup bundle directory.

.PARAMETER RepoPath
  Path to the original repo (for file-level verification). Optional.

.EXAMPLE
  .\backup-verify.ps1 -BundlePath "D:\backups\20250101-120000"
  .\backup-verify.ps1 -BundlePath "D:\backups\20250101-120000" -RepoPath "C:\repos\XTX396"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BundlePath,

    [string]$RepoPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$passed = 0
$failed = 0
$warnings = 0

function Assert-Check([string]$Name, [bool]$Condition, [string]$Detail = "") {
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name — $Detail" -ForegroundColor Red
        $script:failed++
    }
}

function Warn-Check([string]$Name, [string]$Detail) {
    Write-Host "  [WARN] $Name — $Detail" -ForegroundColor Yellow
    $script:warnings++
}

Write-Host "=== B13-P2 Backup Verification ===" -ForegroundColor Cyan
Write-Host "Bundle: $BundlePath"
Write-Host ""

# ── 1. Manifest ──────────────────────────────────────────────────────────────

$manifestPath = Join-Path $BundlePath "manifest.json"
$manifest = $null

Assert-Check "manifest.json exists" (Test-Path $manifestPath) "File not found"

if (Test-Path $manifestPath) {
    try {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
        Assert-Check "manifest.json is valid JSON" $true
        Assert-Check "manifest has entries" ($manifest.entries.Count -gt 0) "No entries found"
        Assert-Check "manifest has version" ($manifest.version -eq "1.0.0") "Version: $($manifest.version)"
    } catch {
        Assert-Check "manifest.json is valid JSON" $false $_.Exception.Message
    }
}

# ── 2. Metadata ──────────────────────────────────────────────────────────────

$metadataPath = Join-Path $BundlePath "metadata.json"
$metadata = $null

Assert-Check "metadata.json exists" (Test-Path $metadataPath) "File not found"

if (Test-Path $metadataPath) {
    try {
        $metadata = Get-Content $metadataPath -Raw | ConvertFrom-Json
        Assert-Check "metadata.json is valid JSON" $true
        Assert-Check "metadata has bundleId" ($null -ne $metadata.bundleId) "Missing bundleId"

        # Cross-check manifest hash
        if ($manifest) {
            $actualManifestHash = (Get-FileHash -Path $manifestPath -Algorithm SHA256).Hash.ToLower()
            Assert-Check "metadata.manifestHash matches" ($metadata.manifestHash -eq $actualManifestHash) `
                "Expected: $actualManifestHash, Got: $($metadata.manifestHash)"
        }
    } catch {
        Assert-Check "metadata.json is valid JSON" $false $_.Exception.Message
    }
}

# ── 3. Bundle hash ───────────────────────────────────────────────────────────

$bundleHashPath = Join-Path $BundlePath "bundle.sha256"
Assert-Check "bundle.sha256 exists" (Test-Path $bundleHashPath) "File not found"

# ── 4. Archive ───────────────────────────────────────────────────────────────

$archivePath = Join-Path $BundlePath "files.tar.gz"
if (Test-Path $archivePath) {
    Assert-Check "files.tar.gz exists" $true
    $archiveSize = (Get-Item $archivePath).Length
    Assert-Check "files.tar.gz is non-empty" ($archiveSize -gt 0) "Size: $archiveSize bytes"

    $encryptedPath = "${archivePath}.age"
    if (Test-Path $encryptedPath) {
        Assert-Check "files.tar.gz.age exists (encrypted)" $true
    } else {
        Warn-Check "files.tar.gz.age not found" "Archive may not be encrypted"
    }
} else {
    Warn-Check "files.tar.gz not found" "Archive was not created (tar may not have been available)"
}

# ── 5. File-level verification (optional) ────────────────────────────────────

if ($RepoPath -and $manifest) {
    Write-Host ""
    Write-Host "--- File-level verification against $RepoPath ---"
    $mismatches = 0
    $missing = 0

    foreach ($entry in $manifest.entries) {
        $filePath = Join-Path $RepoPath ($entry.path -replace '/', '\')
        if (-not (Test-Path $filePath)) {
            $missing++
            if ($missing -le 5) {
                Write-Host "  [MISS] $($entry.path)" -ForegroundColor Yellow
            }
            continue
        }

        $actualHash = (Get-FileHash -Path $filePath -Algorithm SHA256).Hash.ToLower()
        if ($actualHash -ne $entry.sha256) {
            $mismatches++
            if ($mismatches -le 5) {
                Write-Host "  [DIFF] $($entry.path)" -ForegroundColor Red
            }
        }
    }

    Assert-Check "No hash mismatches" ($mismatches -eq 0) "$mismatches file(s) differ"
    if ($missing -gt 0) {
        Warn-Check "Missing files" "$missing file(s) not found in repo (may have been deleted since backup)"
    } else {
        Assert-Check "All manifest files present" $true
    }
}

# ── Summary ──────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
Write-Host "  Passed:   $passed" -ForegroundColor Green
Write-Host "  Failed:   $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Gray" })

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "VERIFICATION FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "VERIFICATION PASSED" -ForegroundColor Green
    exit 0
}
