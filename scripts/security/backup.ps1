<#
.SYNOPSIS
  B13-P2 — Create an encrypted backup bundle of a repository.

.DESCRIPTION
  Generates a backup bundle containing:
    - manifest.json  (file list + SHA-256 hashes)
    - metadata.json  (timestamp, repo, commit, bundle hash, encryption method)
    - bundle.sha256  (integrity digest)
    - files.tar.gz   (compressed archive of included files)
    - files.tar.gz.age (encrypted archive — requires age CLI)

  Exclusions: node_modules, dist, build, .git, __pycache__, .env (secrets),
              dump.rdb, *.log, .cache

  Force-includes: .env.template, .env.example

.PARAMETER RepoPath
  Path to the repository root. Defaults to current directory.

.PARAMETER OutputDir
  Where to store the backup bundle. Defaults to ./_backups/<timestamp>

.PARAMETER NoEncrypt
  Skip encryption (for testing only).

.EXAMPLE
  .\backup.ps1 -RepoPath "C:\repos\Founder-Hub" -OutputDir "D:\backups"
#>

[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$OutputDir = "",
    [switch]$NoEncrypt
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Helpers ──────────────────────────────────────────────────────────────────

function Get-FileSHA256([string]$FilePath) {
    $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
    return $hash.Hash.ToLower()
}

function Should-Include([string]$RelPath) {
    $normalized = $RelPath -replace '\\', '/'

    # Force-include overrides
    if ($normalized -match '^\.(env\.template|env\.example)$') { return $true }

    # Exclusion patterns
    $excludes = @(
        '^node_modules/',
        '^dist/',
        '^build/',
        '^\.next/',
        '^_site/',
        '^\.git/',
        '^__pycache__/',
        '\.pyc$',
        '^dump\.rdb$',
        '\.log$',
        '^\.cache/',
        '^\.env$',
        '^\.env\.local$',
        '^\.env\.\w+$'
    )

    foreach ($pattern in $excludes) {
        if ($normalized -match $pattern) { return $false }
    }

    return $true
}

# ── Main ─────────────────────────────────────────────────────────────────────

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$repoName = Split-Path $RepoPath -Leaf

if (-not $OutputDir) {
    $OutputDir = Join-Path $RepoPath "_backups" $timestamp
}

if (Test-Path $OutputDir) {
    Write-Warning "Output directory already exists: $OutputDir"
} else {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "=== B13-P2 Backup ===" -ForegroundColor Cyan
Write-Host "Repo:   $repoName"
Write-Host "Source: $RepoPath"
Write-Host "Output: $OutputDir"

# Get commit hash
$commitHash = "unknown"
try {
    Push-Location $RepoPath
    $commitHash = (git rev-parse HEAD 2>$null) ?? "unknown"
    Pop-Location
} catch {
    Write-Warning "Could not determine commit hash."
}

Write-Host "Commit: $commitHash"

# ── Build manifest ───────────────────────────────────────────────────────────

$allFiles = Get-ChildItem -Path $RepoPath -Recurse -File -Force
$entries = @()
$totalBytes = 0
$includedPaths = @()

foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($RepoPath.Length + 1)
    if (-not (Should-Include $relPath)) { continue }

    $hash = Get-FileSHA256 $file.FullName
    $entries += @{
        path      = ($relPath -replace '\\', '/')
        sha256    = $hash
        sizeBytes = $file.Length
    }
    $totalBytes += $file.Length
    $includedPaths += $file.FullName
}

# Sort for determinism
$entries = $entries | Sort-Object { $_.path }

$manifest = @{
    version    = "1.0.0"
    createdAt  = (Get-Date -Format "o")
    repo       = $repoName
    commitHash = $commitHash
    entries    = $entries
    totalFiles = $entries.Count
    totalBytes = $totalBytes
}

$manifestJson = $manifest | ConvertTo-Json -Depth 5 -Compress:$false
$manifestPath = Join-Path $OutputDir "manifest.json"
$manifestJson | Out-File -FilePath $manifestPath -Encoding UTF8

$manifestHash = (Get-FileHash -Path $manifestPath -Algorithm SHA256).Hash.ToLower()

Write-Host "Manifest: $($entries.Count) files, $([math]::Round($totalBytes / 1MB, 2)) MB"

# ── Metadata ─────────────────────────────────────────────────────────────────

$metadata = @{
    bundleId         = "backup_${repoName}_$timestamp"
    createdAt        = (Get-Date -Format "o")
    repo             = $repoName
    commitHash       = $commitHash
    manifestHash     = $manifestHash
    encrypted        = (-not $NoEncrypt.IsPresent)
    encryptionMethod = if ($NoEncrypt.IsPresent) { "none" } else { "age/AES-256" }
    provider         = "local"
}

$metadataPath = Join-Path $OutputDir "metadata.json"
$metadata | ConvertTo-Json -Depth 3 | Out-File -FilePath $metadataPath -Encoding UTF8

# ── Bundle hash ──────────────────────────────────────────────────────────────

$bundleContent = $manifestJson + ($metadata | ConvertTo-Json -Depth 3 -Compress)
$bundleSha = [System.Security.Cryptography.SHA256]::Create()
$bundleBytes = [System.Text.Encoding]::UTF8.GetBytes($bundleContent)
$bundleHashBytes = $bundleSha.ComputeHash($bundleBytes)
$bundleHash = ($bundleHashBytes | ForEach-Object { $_.ToString("x2") }) -join ''

$bundleHashPath = Join-Path $OutputDir "bundle.sha256"
$bundleHash | Out-File -FilePath $bundleHashPath -Encoding UTF8

Write-Host "Bundle hash: $bundleHash"

# ── Archive ──────────────────────────────────────────────────────────────────

if (Get-Command "tar" -ErrorAction SilentlyContinue) {
    $archivePath = Join-Path $OutputDir "files.tar.gz"
    Push-Location $RepoPath

    # Build file list for tar
    $fileListPath = Join-Path $OutputDir "filelist.txt"
    $entries | ForEach-Object { $_.path } | Out-File -FilePath $fileListPath -Encoding UTF8

    tar -czf $archivePath -T $fileListPath 2>$null
    Pop-Location

    if (Test-Path $archivePath) {
        $archiveHash = Get-FileSHA256 $archivePath
        Write-Host "Archive: $(([math]::Round((Get-Item $archivePath).Length / 1MB, 2))) MB (SHA-256: $archiveHash)"

        # Encrypt with age (if available and not skipped)
        if (-not $NoEncrypt -and (Get-Command "age" -ErrorAction SilentlyContinue)) {
            $encryptedPath = "${archivePath}.age"
            age -p -o $encryptedPath $archivePath
            Write-Host "Encrypted: $encryptedPath"
        } elseif (-not $NoEncrypt) {
            Write-Warning "age CLI not found — archive not encrypted. Install: https://github.com/FiloSottile/age"
        }
    }

    # Cleanup file list
    Remove-Item $fileListPath -ErrorAction SilentlyContinue
} else {
    Write-Warning "tar not found — skipping archive creation."
}

Write-Host ""
Write-Host "=== Backup Complete ===" -ForegroundColor Green
Write-Host "Bundle ID: $($metadata.bundleId)"
Write-Host "Location:  $OutputDir"
