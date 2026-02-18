<#
.SYNOPSIS
  Scan the working tree for files that may contain secrets.
  Prints file PATHS only -- never prints matched content.

.DESCRIPTION
  Two-pass scan:
  1. Filename patterns (known sensitive file types)
  2. Content patterns (regex for secret-like strings)

  Safe output: file paths and line numbers only.
  No matched content is ever printed.

.EXAMPLE
  .\scripts\security\scan-working-tree.ps1

.NOTES
  Part of Evident Technologies security hardening.
  NEVER modify this script to print matched content.
#>

param(
    [string]$RootPath = (Get-Location).Path,
    [switch]$Quiet
)

$ErrorActionPreference = 'Continue'

# --- Filename Patterns -----------------------------------------
$SuspiciousFilePatterns = @(
    '\.env$',
    '\.env\..+$',
    '\.pem$',
    '\.key$',
    '\.pfx$',
    '\.p12$',
    '\.jks$',
    '\.sqlite$',
    '\.db$',
    'id_rsa$',
    'id_ed25519$',
    'id_ecdsa$',
    'credentials\.json$',
    'service[-_]account.*\.json$',
    '\.secret$',
    '\.secrets$',
    '\.keystore$',
    'htpasswd$',
    '\.npmrc$',        # may contain auth tokens
    '\.pypirc$'        # may contain auth tokens
)

# --- Content Patterns ------------------------------------------
# Each pattern detects a specific secret type.
# We search for these in text files only.
$ContentPatterns = @(
    @{ Name = 'Stripe Live Key';    Pattern = 'sk_live_[A-Za-z0-9]{20,}' },
    @{ Name = 'Stripe Test Key';    Pattern = 'sk_test_[A-Za-z0-9]{20,}' },
    @{ Name = 'AWS Access Key';     Pattern = 'AKIA[0-9A-Z]{16}' },
    @{ Name = 'GitHub PAT';         Pattern = 'ghp_[A-Za-z0-9]{36}' },
    @{ Name = 'GitHub OAuth';       Pattern = 'gho_[A-Za-z0-9]{36}' },
    @{ Name = 'Private Key';        Pattern = '-----BEGIN.*PRIVATE KEY-----' },
    @{ Name = 'Bearer Token';       Pattern = 'Bearer\s+[A-Za-z0-9\-._~+/]{20,}' },
    @{ Name = 'Slack Token';        Pattern = 'xox[bprs]-[A-Za-z0-9\-]{10,}' },
    @{ Name = 'Generic Secret';     Pattern = '(?i)(password|secret|token|api_key)\s*[:=]\s*[''"][^''"]{8,}[''"]' },
    @{ Name = 'JWT';                Pattern = 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.' }
)

# --- Exclusions ------------------------------------------------
$ExcludeDirs = @('node_modules', '.git', 'dist', 'dist-ssr', '.next', '__pycache__', '.venv', 'vendor')
$ExcludeExtensions = @('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.webm', '.pdf', '.zip', '.tar', '.gz')

# Allow-listed files (known false positives)
$AllowFiles = @(
    'scan-working-tree.ps1',     # this script
    'scan-git-history.ps1',      # sibling script
    'scan-secrets.mjs',          # existing scanner
    'redaction.ts',              # redaction patterns (not actual secrets)
    'redaction.test.ts',         # redaction tests
    'secret-vault.ts',           # vault implementation
    'secret-vault.test.ts',      # vault tests
    'honor-bar-guard.ts',        # unrelated
    'SECRET_EXPOSURE_TRIAGE.md', # triage doc
    'SECRET_EXPOSURE_RESPONSE.md',
    'GIT_HISTORY_REMEDIATION.md',
    'naming-engine.ts',          # naming tokens, not secrets
    'github-token-proxy.ts',     # token proxy code, not secrets
    'OpsContext.tsx',             # dev gate token, not real credential
    '.env.example'               # example env, no real values
)

# Directories containing only test/mock data
$TestDirs = @('__tests__', '__mocks__', 'test', 'tests')

function Test-Excluded($filePath) {
    foreach ($dir in $ExcludeDirs) {
        if ($filePath -match "[\\/]$dir[\\/]") { return $true }
    }
    # Also exclude any path starting with dist (covers dist-renamed dirs)
    $rel = $filePath.Replace($RootPath, '').TrimStart('\', '/')
    if ($rel -match '^dist') { return $true }
    # Exclude test directories (mock data, not real secrets)
    foreach ($td in $TestDirs) {
        if ($filePath -match "[\\/]$td[\\/]") { return $true }
    }
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    if ($ext -in $ExcludeExtensions) { return $true }
    $name = [System.IO.Path]::GetFileName($filePath)
    if ($name -in $AllowFiles) { return $true }
    return $false
}

# --- Pass 1: Suspicious Filenames ------------------------------
if (-not $Quiet) { Write-Host "`n=== Pass 1: Suspicious File Names ===" -ForegroundColor Cyan }

$suspiciousFiles = @()
Get-ChildItem -Path $RootPath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $rel = $_.FullName.Replace($RootPath, '').TrimStart('\', '/')
    if (Test-Excluded $_.FullName) { return }
    foreach ($pattern in $SuspiciousFilePatterns) {
        if ($_.Name -match $pattern) {
            $suspiciousFiles += $rel
            break
        }
    }
}

if ($suspiciousFiles.Count -eq 0) {
    if (-not $Quiet) { Write-Host "  CLEAN -- no suspicious filenames found." -ForegroundColor Green }
} else {
    Write-Host "  FOUND $($suspiciousFiles.Count) suspicious file(s):" -ForegroundColor Yellow
    $suspiciousFiles | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
}

# --- Pass 2: Content Pattern Scan ------------------------------
if (-not $Quiet) { Write-Host "`n=== Pass 2: Content Pattern Scan ===" -ForegroundColor Cyan }

$findings = @()
Get-ChildItem -Path $RootPath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    if (Test-Excluded $_.FullName) { return }
    $ext = [System.IO.Path]::GetExtension($_.Name).ToLower()
    if ($ext -in $ExcludeExtensions) { return }
    if ($_.Length -gt 5MB) { return }  # Skip large binary files

    try {
        $lines = Get-Content $_.FullName -ErrorAction Stop
        $lineNum = 0
        foreach ($line in $lines) {
            $lineNum++
            foreach ($cp in $ContentPatterns) {
                if ($line -match $cp.Pattern) {
                    $rel = $_.FullName.Replace($RootPath, '').TrimStart('\', '/')
                    # SAFE OUTPUT: path + line number + pattern name ONLY
                    $findings += [PSCustomObject]@{
                        File    = $rel
                        Line    = $lineNum
                        Type    = $cp.Name
                    }
                }
            }
        }
    } catch {
        # Binary file or encoding issue -- skip silently
    }
}

if ($findings.Count -eq 0) {
    if (-not $Quiet) { Write-Host "  CLEAN -- no secret patterns detected." -ForegroundColor Green }
} else {
    Write-Host "  FOUND $($findings.Count) potential secret(s):" -ForegroundColor Red
    $findings | Format-Table -Property File, Line, Type -AutoSize
    Write-Host "  ACTION REQUIRED: Review each finding. Rotate exposed credentials." -ForegroundColor Red
}

# --- Summary ---------------------------------------------------
$totalFindings = $suspiciousFiles.Count + $findings.Count
if ($totalFindings -eq 0) {
    Write-Host "`nRESULT: CLEAN -- No secrets detected in working tree." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nRESULT: $totalFindings finding(s) require review." -ForegroundColor Red
    exit 1
}

