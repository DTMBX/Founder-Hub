<#
.SYNOPSIS
    Restores a Founder Hub recovery checkpoint from a JSON file.

.DESCRIPTION
    Reads a recovery package JSON file (exported by New-RecoveryCheckpoint or the
    in-app export), validates its structure, and restores it into the browser's
    localStorage via a headless Playwright session.

    The checkpoint data remains AES-256-GCM encrypted — this script does not
    decrypt anything. Decryption happens at runtime when the app loads.

    Requires: Node.js, Playwright (npx playwright install chromium)

.PARAMETER FilePath
    Path to the recovery package JSON file.

.PARAMETER BaseUrl
    URL of the running Founder Hub instance. Defaults to http://localhost:5173.

.PARAMETER DryRun
    Validate the package without restoring.

.PARAMETER WhatIf
    Show what would be executed without running.

.EXAMPLE
    .\Restore-FromCheckpoint.ps1 -FilePath ./backups/weekly.json
    .\Restore-FromCheckpoint.ps1 -FilePath ./backups/weekly.json -DryRun
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string]$FilePath,

    [string]$BaseUrl = 'http://localhost:5173',

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=== Restore from Checkpoint ===" -ForegroundColor Cyan
Write-Host "File:     $FilePath"
Write-Host "Base URL: $BaseUrl"
Write-Host "Dry Run:  $DryRun"
Write-Host ""

# Validate file exists
if (-not (Test-Path $FilePath)) {
    Write-Error "Recovery file not found: $FilePath"
}

# Read and validate package structure
$raw = Get-Content $FilePath -Raw -Encoding UTF8
try {
    $pkg = $raw | ConvertFrom-Json
} catch {
    Write-Error "Invalid JSON in recovery file: $_"
}

# Validate package type
$validTypes = @('founder-hub-recovery-package', 'founder-hub-full-backup-package')
if ($pkg._type -notin $validTypes) {
    Write-Error "Unrecognized package type: $($pkg._type). Expected one of: $($validTypes -join ', ')"
}

if ($pkg._version -ne 1) {
    Write-Error "Unsupported package version: $($pkg._version)"
}

if (-not $pkg.data) {
    Write-Error "Package has no encrypted data payload"
}

Write-Host "Package type:  $($pkg._type)" -ForegroundColor DarkGray
Write-Host "Exported:      $($pkg._exported)" -ForegroundColor DarkGray
if ($pkg.checkpointId) {
    Write-Host "Checkpoint ID: $($pkg.checkpointId)" -ForegroundColor DarkGray
}
if ($pkg.meta) {
    Write-Host "Label:         $($pkg.meta.label)" -ForegroundColor DarkGray
    Write-Host "Created:       $($pkg.meta.createdAt)" -ForegroundColor DarkGray
    Write-Host "Keys:          $($pkg.meta.keyCount) app + $($pkg.meta.vaultKeyCount) vault" -ForegroundColor DarkGray
}

Write-Host "`nPackage structure: VALID" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`nDry run — no changes made." -ForegroundColor Yellow
    exit 0
}

# Build the Playwright restore script
$escapedRaw = $raw -replace '\\', '\\\\' -replace '`', '\`' -replace '\$', '\$'
$isFullBackup = $pkg._type -eq 'founder-hub-full-backup-package'

$script = @"
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('$BaseUrl', { waitUntil: 'networkidle', timeout: 30000 });

  const result = await page.evaluate(async (fileContent, isFullBackup) => {
    if (isFullBackup) {
      const mod = await import('/src/lib/recovery-checkpoint.ts');
      return await mod.importFullStateBackup(fileContent);
    } else {
      const mod = await import('/src/lib/recovery-checkpoint.ts');
      return await mod.importCheckpointFromFile(fileContent);
    }
  }, $(ConvertTo-Json $raw), $($isFullBackup.ToString().ToLower()));

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Restore failed:', err.message);
  process.exit(1);
});
"@

if ($PSCmdlet.ShouldProcess("Restore checkpoint from $FilePath")) {
    $tempScript = Join-Path $env:TEMP "fh-restore-$(Get-Random).cjs"
    try {
        Set-Content -Path $tempScript -Value $script -Encoding UTF8
        Write-Host "`nRunning Playwright restore script..." -ForegroundColor DarkGray
        $output = & node $tempScript 2>&1
        $exitCode = $LASTEXITCODE

        Write-Host $output

        if ($exitCode -ne 0) {
            Write-Error "Restore failed (exit code $exitCode)"
        } else {
            Write-Host "`nRestore completed successfully." -ForegroundColor Green
            Write-Host "Refresh the browser to load the restored state." -ForegroundColor Yellow
        }
    } finally {
        Remove-Item $tempScript -ErrorAction SilentlyContinue
    }
}
