#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build or serve Hugo sites from the Founder-Hub hugo/ subproject.
.DESCRIPTION
    Syncs data, then runs Hugo build or dev server.
    Output goes to hugo/public/ and optionally copies to dist/sites/.
.PARAMETER Environment
    Hugo environment: production (default), development.
.PARAMETER Serve
    Start Hugo dev server with live reload instead of building.
.PARAMETER Clean
    Remove hugo/public/ before building.
#>
param(
    [ValidateSet("production", "development")]
    [string]$Environment = "production",
    [switch]$Serve,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$HugoDir  = Join-Path $RepoRoot "hugo"

# ── Verify Hugo installation ──
$hugoCmd = Get-Command hugo -ErrorAction SilentlyContinue
if (-not $hugoCmd) {
    Write-Error @"
Hugo not found in PATH. Install with one of:
  winget install Hugo.Hugo.Extended
  scoop install hugo-extended
  choco install hugo-extended
"@
    exit 1
}

$hugoVersion = & hugo version 2>&1
Write-Host "Using: $hugoVersion" -ForegroundColor DarkGray

# ── Sync JSON data ──
Write-Host "`n=== Syncing site data ===" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "hugo-data-sync.ps1") -RepoRoot $RepoRoot

# ── Clean if requested ──
if ($Clean) {
    $publicDir = Join-Path $HugoDir "public"
    if (Test-Path $publicDir) {
        Remove-Item $publicDir -Recurse -Force
        Write-Host "Cleaned hugo/public/" -ForegroundColor Yellow
    }
}

# ── Build or Serve ──
Push-Location $HugoDir
try {
    if ($Serve) {
        Write-Host "`n=== Starting Hugo dev server ($Environment) ===" -ForegroundColor Cyan
        hugo server --environment $Environment --navigateToChanged
    } else {
        Write-Host "`n=== Building Hugo ($Environment) ===" -ForegroundColor Cyan
        hugo --environment $Environment --gc --minify

        $publicDir = Join-Path $HugoDir "public"
        if (Test-Path $publicDir) {
            # Copy output to dist/sites/ to align with existing pipeline
            $distSites = Join-Path $RepoRoot "dist" "sites"
            New-Item -ItemType Directory -Path $distSites -Force | Out-Null
            Copy-Item -Path (Join-Path $publicDir "*") -Destination $distSites -Recurse -Force
            Write-Host "`nOutput copied to dist/sites/" -ForegroundColor Green
        }

        Write-Host "Hugo build complete." -ForegroundColor Green
    }
} finally {
    Pop-Location
}
