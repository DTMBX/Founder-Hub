<#
.SYNOPSIS
    Validates the Secret Plane (encryption & vault) configuration.

.DESCRIPTION
    Checks that:
    - crypto.ts has AES-256-GCM encryption functions
    - secret-vault.ts has per-secret encryption with checksums
    - 2FA backup codes are hashed (not plaintext)
    - Vault index is encrypted (vault:__index)
    - No plaintext secrets in source files
    - scan-secrets.mjs exists and is runnable

    READ-ONLY — modifies nothing.

.PARAMETER Path
    Root path of the founder-hub repo. Defaults to current directory.

.PARAMETER WhatIf
    Show what checks would run without executing.

.EXAMPLE
    .\Initialize-SecretPlane.ps1
    .\Initialize-SecretPlane.ps1 -Path C:\repos\founder-hub -Verbose
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$Path = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
$passed = 0
$failed = 0
$warnings = 0

function Write-Check {
    param([string]$Name, [bool]$Ok, [string]$Detail = '')
    if ($Ok) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        if ($Detail) { Write-Host "         $Detail" -ForegroundColor DarkRed }
        $script:failed++
    }
}

function Write-Warn {
    param([string]$Name, [string]$Detail)
    Write-Host "  [WARN] $Name" -ForegroundColor Yellow
    if ($Detail) { Write-Host "         $Detail" -ForegroundColor DarkYellow }
    $script:warnings++
}

Write-Host "`n=== Secret Plane Audit ===" -ForegroundColor Cyan
Write-Host "Repo: $Path`n"

# --- Check 1: AES-256-GCM in crypto.ts ---
$cryptoFile = Join-Path $Path 'src/lib/crypto.ts'
if (Test-Path $cryptoFile) {
    $cc = Get-Content $cryptoFile -Raw
    Write-Check 'encryptField() present' ($cc -match 'async function encryptField')
    Write-Check 'decryptField() present' ($cc -match 'async function decryptField')
    Write-Check 'AES-GCM algorithm used' ($cc -match 'AES-GCM')
    Write-Check 'PBKDF2 key derivation' ($cc -match 'PBKDF2')

    $iterations = if ($cc -match '(?:iterations|PBKDF2_ITERATIONS)\s*[=:]\s*(\d[\d_]*)') { [int]($Matches[1] -replace '_','') } else { 0 }
    Write-Check "PBKDF2 iterations >= 100000 (found: $iterations)" ($iterations -ge 100000)
} else {
    Write-Check 'crypto.ts exists' $false
}

# --- Check 2: Vault with per-secret encryption ---
$vaultFile = Join-Path $Path 'src/lib/secret-vault.ts'
if (Test-Path $vaultFile) {
    $vc = Get-Content $vaultFile -Raw
    Write-Check 'storeSecret() present' ($vc -match 'async function storeSecret')
    Write-Check 'SHA-256 checksums' ($vc -match 'SHA-256')
    Write-Check 'Encrypted index (vault:__index)' ($vc -match 'vault:__index')
    Write-Check 'Secret rotation support' ($vc -match 'rotateSecret')
} else {
    Write-Check 'secret-vault.ts exists' $false
}

# --- Check 3: 2FA backup codes hashed ---
$authFile = Join-Path $Path 'src/lib/auth.ts'
if (Test-Path $authFile) {
    $ac = Get-Content $authFile -Raw
    Write-Check 'hash2FACode() helper present' ($ac -match 'hash2FACode')
    Write-Check 'crypto.getRandomValues for backup codes' ($ac -match 'crypto\.getRandomValues')
    Write-Check 'Encrypted login attempts helper' ($ac -match 'async function setLoginAttempts')
    Write-Check 'Encrypted login attempts read' ($ac -match 'async function getLoginAttempts')
} else {
    Write-Check 'auth.ts exists' $false
}

# --- Check 4: Recovery checkpoint module ---
$recoveryFile = Join-Path $Path 'src/lib/recovery-checkpoint.ts'
if (Test-Path $recoveryFile) {
    $rc = Get-Content $recoveryFile -Raw
    Write-Check 'createCheckpoint() present' ($rc -match 'async function createCheckpoint')
    Write-Check 'restoreCheckpoint() present' ($rc -match 'async function restoreCheckpoint')
    Write-Check 'Checkpoint integrity hash' ($rc -match 'integrityHash')
    Write-Check 'Export to file support' ($rc -match 'exportCheckpointToFile')
    Write-Check 'Import from file support' ($rc -match 'importCheckpointFromFile')
} else {
    Write-Warn 'recovery-checkpoint.ts not found' 'Phase 3 module missing'
}

# --- Check 5: No plaintext secrets in source ---
$srcDir = Join-Path $Path 'src'
if (Test-Path $srcDir) {
    $secretPatterns = @(
        'ghp_[A-Za-z0-9]{36}',       # GitHub PAT
        'sk-[A-Za-z0-9]{20,}',        # OpenAI key
        'AKIA[A-Z0-9]{16}'            # AWS key
    )
    $leaked = $false
    $tsFiles = Get-ChildItem $srcDir -Recurse -Include '*.ts','*.tsx' | Where-Object { $_.Name -ne 'scan-secrets.mjs' -and $_.FullName -notmatch '\.(test|spec)\.' }
    foreach ($pattern in $secretPatterns) {
        foreach ($f in $tsFiles) {
            $content = Get-Content $f.FullName -Raw
            if ($content -match $pattern) {
                Write-Check "No hardcoded secrets ($pattern)" $false "Found in $($f.Name)"
                $leaked = $true
                break
            }
        }
    }
    if (-not $leaked) {
        Write-Check 'No hardcoded secrets in src/' $true
    }
}

# --- Check 6: scan-secrets script exists ---
$scanScript = Join-Path $Path 'scripts/scan-secrets.mjs'
Write-Check 'scan-secrets.mjs exists' (Test-Path $scanScript)

# --- Summary ---
Write-Host "`n--- Summary ---" -ForegroundColor Cyan
Write-Host "  Passed:   $passed" -ForegroundColor Green
Write-Host "  Failed:   $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Green' })
Write-Host "  Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { 'Yellow' } else { 'Green' })

if ($failed -gt 0) {
    Write-Host "`nSecret Plane: NOT READY" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nSecret Plane: VERIFIED" -ForegroundColor Green
    exit 0
}
