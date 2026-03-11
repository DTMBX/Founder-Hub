<#
.SYNOPSIS
    Creates a browser-compatible recovery checkpoint by triggering the in-app
    checkpoint API via a headless Playwright test.

.DESCRIPTION
    Launches a headless Chromium instance via Playwright, navigates to the app,
    and executes the createCheckpoint() function from recovery-checkpoint.ts
    in the browser context. The checkpoint is stored in the browser's localStorage
    and optionally exported to a file.

    Requires: Node.js, npm, Playwright (npx playwright install chromium)

    This is the offline/CI companion to the in-app "Create Checkpoint" button.

.PARAMETER Label
    Descriptive label for the checkpoint (e.g., "pre-deploy-2025-06").

.PARAMETER BaseUrl
    URL of the running Founder Hub instance. Defaults to http://localhost:5173.

.PARAMETER ExportPath
    If specified, exports the checkpoint JSON to this file path.

.PARAMETER WhatIf
    Show what would be executed without running.

.EXAMPLE
    .\New-RecoveryCheckpoint.ps1 -Label "pre-deploy"
    .\New-RecoveryCheckpoint.ps1 -Label "weekly-backup" -ExportPath ./backups/weekly.json
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string]$Label,

    [string]$BaseUrl = 'http://localhost:5173',

    [string]$ExportPath
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=== New Recovery Checkpoint ===" -ForegroundColor Cyan
Write-Host "Label:    $Label"
Write-Host "Base URL: $BaseUrl"
if ($ExportPath) { Write-Host "Export:   $ExportPath" }
Write-Host ""

# Validate prerequisites
$repoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$pkgJson = Join-Path $repoRoot 'package.json'
if (-not (Test-Path $pkgJson)) {
    Write-Error "Cannot find package.json at $repoRoot — run from scripts/security/"
}

$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Error 'Node.js is required but not found in PATH'
}

# Build the inline Playwright script
$script = @"
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to app
  await page.goto('$BaseUrl', { waitUntil: 'networkidle', timeout: 30000 });

  // Execute checkpoint creation in browser context
  const result = await page.evaluate(async (label) => {
    // Dynamic import of the recovery module (Vite dev server)
    const mod = await import('/src/lib/recovery-checkpoint.ts');
    const meta = await mod.createCheckpoint(label);
    return meta;
  }, '$($Label -replace "'","")');

  console.log(JSON.stringify(result, null, 2));

  if ('$ExportPath') {
    // Export checkpoint to file
    const exportResult = await page.evaluate(async (id) => {
      const keys = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        keys[key] = localStorage.getItem(key);
      }
      return keys;
    }, result.id);

    // The actual export happens via the browser download API
    // For CI, we extract the checkpoint data directly
    const checkpointKey = 'founder-hub-ckpt:' + result.id;
    const checkpointData = await page.evaluate((key) => localStorage.getItem(key), checkpointKey);

    const fs = require('fs');
    const pkg = JSON.stringify({
      _type: 'founder-hub-recovery-package',
      _version: 1,
      _exported: new Date().toISOString(),
      checkpointId: result.id,
      meta: result,
      data: checkpointData
    }, null, 2);
    fs.writeFileSync('$($ExportPath -replace '\\','/')', pkg, 'utf8');
    console.log('Exported to: $ExportPath');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Checkpoint failed:', err.message);
  process.exit(1);
});
"@

if ($PSCmdlet.ShouldProcess("Create checkpoint '$Label' via Playwright")) {
    $tempScript = Join-Path $env:TEMP "fh-checkpoint-$(Get-Random).cjs"
    try {
        Set-Content -Path $tempScript -Value $script -Encoding UTF8
        Write-Host "Running Playwright checkpoint script..." -ForegroundColor DarkGray
        $output = & node $tempScript 2>&1
        $exitCode = $LASTEXITCODE

        Write-Host $output

        if ($exitCode -ne 0) {
            Write-Error "Checkpoint creation failed (exit code $exitCode)"
        } else {
            Write-Host "`nCheckpoint created successfully." -ForegroundColor Green
        }
    } finally {
        Remove-Item $tempScript -ErrorAction SilentlyContinue
    }
}
