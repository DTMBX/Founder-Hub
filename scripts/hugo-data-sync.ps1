#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sync site data from Founder-Hub public/data/ into Hugo's data/ directory.
.DESCRIPTION
    Copies JSON data files that Hugo templates consume during build.
    Run before hugo build to ensure templates have current data.
.PARAMETER RepoRoot
    Path to the Founder-Hub repo root. Defaults to parent of scripts/.
#>
param(
    [string]$RepoRoot = (Split-Path $PSScriptRoot -Parent),
    [string]$HugoData = (Join-Path (Split-Path $PSScriptRoot -Parent) "hugo" "data")
)

$ErrorActionPreference = "Stop"

$sourceDir = Join-Path $RepoRoot "public" "data"
$siteFiles = @(
    "sites-index.json",
    "sites.json",
    "law-firm-showcase.json",
    "smb-template.json",
    "agency-framework.json",
    "profile.json",
    "settings.json",
    "contact-links.json"
)

# Ensure output directory
$sitesDir = Join-Path $HugoData "sites"
New-Item -ItemType Directory -Path $sitesDir -Force | Out-Null

$synced = 0
foreach ($file in $siteFiles) {
    $src = Join-Path $sourceDir $file
    if (Test-Path $src) {
        Copy-Item $src -Destination (Join-Path $sitesDir $file) -Force
        Write-Host "  Synced: $file" -ForegroundColor Green
        $synced++
    } else {
        Write-Warning "  Missing: $src"
    }
}

Write-Host "`nData sync complete ($synced/$($siteFiles.Count) files)." -ForegroundColor Cyan
