<#
.SYNOPSIS
  B13-P3 — Run a restore drill against a backup bundle.

.DESCRIPTION
  Conducts a restore drill:
    1. Loads manifest.json and metadata.json from bundle
    2. Verifies manifest hash matches metadata.manifestHash
    3. Optionally verifies per-file hashes against a repo
    4. Reports results

.PARAMETER BundlePath
  Path to the backup bundle directory.

.PARAMETER RepoPath
  Path to the original repo for file-level verification. Optional.

.PARAMETER ConductedBy
  Name of the person or system running the drill.

.EXAMPLE
  .\restore-drill.ps1 -BundlePath "D:\backups\20250101-120000" -ConductedBy "ci-pipeline"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BundlePath,

    [string]$RepoPath = "",
    [string]$ConductedBy = "manual"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$drillId = "drill_$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$passed = 0
$failed = 0

function Assert-Step([string]$Name, [bool]$Condition, [string]$Detail = "") {
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name — $Detail" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "=== B13-P3 Restore Drill ===" -ForegroundColor Cyan
Write-Host "Drill ID:     $drillId"
Write-Host "Bundle:       $BundlePath"
Write-Host "Conducted by: $ConductedBy"
Write-Host ""

# ── 1. Load manifest ────────────────────────────────────────────────────────

$manifestPath = Join-Path $BundlePath "manifest.json"
Assert-Step "manifest.json exists" (Test-Path $manifestPath) "File not found"

$manifest = $null
if (Test-Path $manifestPath) {
    try {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
        Assert-Step "manifest.json valid JSON" $true
        Assert-Step "manifest has entries" ($manifest.entries.Count -gt 0) "Empty"
    } catch {
        Assert-Step "manifest.json valid JSON" $false $_.Exception.Message
    }
}

# ── 2. Load metadata ────────────────────────────────────────────────────────

$metadataPath = Join-Path $BundlePath "metadata.json"
Assert-Step "metadata.json exists" (Test-Path $metadataPath) "File not found"

$metadata = $null
if (Test-Path $metadataPath) {
    try {
        $metadata = Get-Content $metadataPath -Raw | ConvertFrom-Json
        Assert-Step "metadata.json valid JSON" $true
    } catch {
        Assert-Step "metadata.json valid JSON" $false $_.Exception.Message
    }
}

# ── 3. Verify manifest hash ─────────────────────────────────────────────────

if ($manifest -and $metadata) {
    $actualManifestHash = (Get-FileHash -Path $manifestPath -Algorithm SHA256).Hash.ToLower()
    Assert-Step "Manifest hash matches metadata" ($actualManifestHash -eq $metadata.manifestHash) `
        "Expected: $($metadata.manifestHash), Got: $actualManifestHash"
}

# ── 4. Verify bundle hash file ──────────────────────────────────────────────

$bundleHashPath = Join-Path $BundlePath "bundle.sha256"
Assert-Step "bundle.sha256 exists" (Test-Path $bundleHashPath) "File not found"

# ── 5. File-level verification (if RepoPath provided) ────────────────────────

if ($RepoPath -and $manifest) {
    Write-Host ""
    Write-Host "--- File-Level Verification ---"
    $verified = 0
    $mismatches = 0
    $missing = 0

    foreach ($entry in $manifest.entries) {
        $filePath = Join-Path $RepoPath ($entry.path -replace '/', '\')
        if (-not (Test-Path $filePath)) {
            $missing++
            continue
        }

        $actualHash = (Get-FileHash -Path $filePath -Algorithm SHA256).Hash.ToLower()
        if ($actualHash -ne $entry.sha256) {
            $mismatches++
        } else {
            $verified++
        }
    }

    Write-Host "  Verified:   $verified / $($manifest.entries.Count)"
    Write-Host "  Mismatches: $mismatches"
    Write-Host "  Missing:    $missing"

    Assert-Step "No hash mismatches" ($mismatches -eq 0) "$mismatches file(s) differ"
    Assert-Step "No missing files" ($missing -eq 0) "$missing file(s) missing"
}

# ── 6. Simulate build check ─────────────────────────────────────────────────

Write-Host ""
Write-Host "--- Build Simulation ---"
$buildPassed = $failed -eq 0
Assert-Step "Build simulation" $buildPassed $(if (-not $buildPassed) { "Pre-conditions failed" } else { "" })

# ── 7. Report ────────────────────────────────────────────────────────────────

$reportPath = Join-Path $BundlePath "drill-report-$drillId.json"
$report = @{
    drillId     = $drillId
    bundlePath  = $BundlePath
    conductedBy = $ConductedBy
    conductedAt = (Get-Date -Format "o")
    passed      = $passed
    failed      = $failed
    verdict     = if ($failed -eq 0) { "PASS" } else { "FAIL" }
}
$report | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host ""
Write-Host "=== Drill Summary ===" -ForegroundColor Cyan
Write-Host "  Passed:  $passed" -ForegroundColor Green
Write-Host "  Failed:  $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  Verdict: $($report.verdict)" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Report:  $reportPath"

if ($failed -gt 0) { exit 1 } else { exit 0 }
