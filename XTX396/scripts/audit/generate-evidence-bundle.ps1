<#
.SYNOPSIS
    Generates an audit evidence bundle for external review.

.DESCRIPTION
    Collects test reports, dependency audits, governance documents,
    git history, and generates a SHA-256 manifest for integrity verification.

    Output: audit_evidence_YYYYMMDD/ directory + .zip archive

.NOTES
    B18-P2 | Evident Technologies | Evidence Collection Automation
    No secrets are captured. No external services are contacted.
    All artifacts are derived from repository contents.
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$OutputRoot = ".",

    [Parameter()]
    [int]$HistoryDays = 90
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Configuration ---
$timestamp = Get-Date -Format "yyyyMMdd"
$bundleDir = Join-Path $OutputRoot "audit_evidence_$timestamp"
$docsDir = Join-Path $bundleDir "docs"
$govDir = Join-Path $bundleDir "governance"

# --- Step 1: Create output directory ---
Write-Host "[1/10] Creating output directory: $bundleDir"
if (Test-Path $bundleDir) {
    Remove-Item $bundleDir -Recurse -Force
}
New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null
New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
New-Item -ItemType Directory -Path $govDir -Force | Out-Null

# --- Step 2: Run test suite ---
Write-Host "[2/10] Running test suite..."
$testReportPath = Join-Path $bundleDir "test-report.json"
try {
    $testOutput = & npx vitest run `
        "ops/__tests__/b13-backup.test.ts" `
        "ops/__tests__/b14-onboarding.test.ts" `
        "ops/__tests__/b15-toolhub.test.ts" `
        "ops/__tests__/b16-multitenant.test.ts" `
        --reporter=json 2>&1
    $testOutput | Out-File -FilePath $testReportPath -Encoding utf8
    Write-Host "  Test report saved."
} catch {
    Write-Warning "  Test execution encountered errors. Report may be partial."
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath $testReportPath -Encoding utf8
}

# --- Step 3: Parse test summary ---
Write-Host "[3/10] Parsing test summary..."
$testSummaryPath = Join-Path $bundleDir "test-summary.txt"
try {
    $jsonContent = Get-Content $testReportPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($jsonContent -and $jsonContent.numTotalTests) {
        $summary = @(
            "Test Summary",
            "=============",
            "Total:   $($jsonContent.numTotalTests)",
            "Passed:  $($jsonContent.numPassedTests)",
            "Failed:  $($jsonContent.numFailedTests)",
            "Skipped: $($jsonContent.numPendingTests)",
            "Files:   $($jsonContent.numTotalTestSuites)",
            "Generated: $(Get-Date -Format 'o')"
        )
        $summary | Out-File -FilePath $testSummaryPath -Encoding utf8
    } else {
        "Could not parse test report JSON." | Out-File -FilePath $testSummaryPath -Encoding utf8
    }
} catch {
    "Could not parse test report: $($_.Exception.Message)" | Out-File -FilePath $testSummaryPath -Encoding utf8
}
Write-Host "  Test summary saved."

# --- Step 4: Run dependency audit ---
Write-Host "[4/10] Running dependency audit..."
$depAuditPath = Join-Path $bundleDir "dependency-audit.json"
try {
    $auditOutput = & npm audit --json 2>&1
    $auditOutput | Out-File -FilePath $depAuditPath -Encoding utf8
} catch {
    # npm audit returns non-zero on vulnerabilities — this is expected
    $auditOutput | Out-File -FilePath $depAuditPath -Encoding utf8
}
Write-Host "  Dependency audit saved."

# --- Step 5: Copy governance documents ---
Write-Host "[5/10] Copying governance documents..."

$docsToCopy = @(
    @{ Source = "docs/trust/CONTROL_MATRIX.md";             Dest = "docs/CONTROL_MATRIX.md" },
    @{ Source = "docs/audit/CONTROL_EVIDENCE_MATRIX.md";    Dest = "docs/CONTROL_EVIDENCE_MATRIX.md" },
    @{ Source = "docs/trust/THREAT_MODEL.md";               Dest = "docs/THREAT_MODEL.md" },
    @{ Source = "docs/audit/B18_SCOPE.md";                  Dest = "docs/B18_SCOPE.md" }
)

$govToCopy = @(
    @{ Source = "governance/change_management_policy.md";           Dest = "governance/change_management_policy.md" },
    @{ Source = "governance/security/patch_management_policy.md";   Dest = "governance/patch_management_policy.md" }
)

foreach ($item in ($docsToCopy + $govToCopy)) {
    $srcPath = Join-Path $PSScriptRoot "../../" $item.Source
    $destPath = Join-Path $bundleDir $item.Dest
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    if (Test-Path $srcPath) {
        Copy-Item $srcPath $destPath -Force
        Write-Host "  Copied: $($item.Source)"
    } else {
        Write-Warning "  Missing: $($item.Source)"
    }
}

# --- Step 6: Capture git history ---
Write-Host "[6/10] Capturing git history (last $HistoryDays days)..."
$gitHistoryPath = Join-Path $bundleDir "git-history.txt"
$sinceDate = (Get-Date).AddDays(-$HistoryDays).ToString("yyyy-MM-dd")
$gitLog = & git log --oneline --since="$sinceDate" 2>&1
$gitLog | Out-File -FilePath $gitHistoryPath -Encoding utf8
Write-Host "  Git history saved."

# --- Step 7: Capture branch state ---
Write-Host "[7/10] Capturing branch state..."
$branchPath = Join-Path $bundleDir "branch-summary.txt"
$branchOutput = & git branch -a 2>&1
$branchOutput | Out-File -FilePath $branchPath -Encoding utf8
Write-Host "  Branch summary saved."

# --- Step 8: Get repository commit ---
Write-Host "[8/10] Recording repository commit..."
$repoCommit = (& git rev-parse HEAD 2>&1).Trim()

# --- Step 9: Generate manifest ---
Write-Host "[9/10] Generating SHA-256 manifest..."
$manifestPath = Join-Path $bundleDir "manifest.json"

$files = Get-ChildItem $bundleDir -Recurse -File | Where-Object { $_.Name -ne "manifest.json" }
$fileEntries = @()

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($bundleDir.Length + 1).Replace("\", "/")
    $hash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLower()
    $fileEntries += @{
        path = $relativePath
        sha256 = $hash
        sizeBytes = $file.Length
    }
}

$manifest = @{
    generated = (Get-Date -Format "o")
    generator = "generate-evidence-bundle.ps1"
    version = "1.0.0"
    repositoryCommit = $repoCommit
    fileCount = $fileEntries.Count
    files = $fileEntries
}

$manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath $manifestPath -Encoding utf8
Write-Host "  Manifest generated: $($fileEntries.Count) files hashed."

# --- Step 10: Verify manifest ---
Write-Host "[10/10] Verifying manifest integrity..."
$verifyManifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$verifyErrors = 0

foreach ($entry in $verifyManifest.files) {
    $filePath = Join-Path $bundleDir $entry.path
    if (-not (Test-Path $filePath)) {
        Write-Warning "  MISSING: $($entry.path)"
        $verifyErrors++
        continue
    }
    $actualHash = (Get-FileHash $filePath -Algorithm SHA256).Hash.ToLower()
    if ($actualHash -ne $entry.sha256) {
        Write-Warning "  HASH MISMATCH: $($entry.path)"
        $verifyErrors++
    }
}

if ($verifyErrors -eq 0) {
    Write-Host "`nEvidence bundle generated and verified successfully."
    Write-Host "  Location: $bundleDir"
    Write-Host "  Files:    $($fileEntries.Count)"
    Write-Host "  Commit:   $repoCommit"
} else {
    Write-Error "Manifest verification failed with $verifyErrors error(s)."
}

# --- Compress ---
Write-Host "`nCompressing bundle..."
$zipPath = "$bundleDir.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $bundleDir -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Archive created: $zipPath"

Write-Host "`n--- Evidence bundle generation complete ---"
