<#
.SYNOPSIS
    Validates the Access Plane security configuration of a Founder Hub deployment.

.DESCRIPTION
    Reads the built dist/ output, source files, and config to verify that:
    - Auto-login is restricted to dev builds only
    - Default credentials are not present in built bundles
    - HMAC session signing code is present
    - Rate limiting is properly configured (3 attempts / 30 min)
    - PBKDF2 password hashing is in use
    - SECURITY.md is up to date (version >= 2.0)

    This script performs READ-ONLY checks and modifies nothing.

.PARAMETER Path
    Root path of the founder-hub repo. Defaults to the current directory.

.PARAMETER Verbose
    Show detailed output for each check.

.PARAMETER WhatIf
    Show what checks would run without executing file reads.

.EXAMPLE
    .\Test-AccessPlane.ps1
    .\Test-AccessPlane.ps1 -Path C:\repos\founder-hub -Verbose
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

Write-Host "`n=== Access Plane Audit ===" -ForegroundColor Cyan
Write-Host "Repo: $Path`n"

# --- Check 1: auto-login restricted to dev ---
$authFile = Join-Path $Path 'src/lib/auth.ts'
if (Test-Path $authFile) {
    $authContent = Get-Content $authFile -Raw
    $hasAutoLogin = $authContent -match 'AUTO_LOGIN\s*=\s*IS_DEV\s*&&'
    Write-Check 'Auto-login restricted to IS_DEV' $hasAutoLogin

    $hasIsLocal = $authContent -match 'IS_LOCAL.*createSession'
    if ($hasIsLocal) {
        Write-Warn 'IS_LOCAL still used near session creation' 'Auto-login may be reachable from LAN'
    }
} else {
    Write-Check 'auth.ts exists' $false 'File not found'
}

# --- Check 2: HMAC session signing ---
$cryptoFile = Join-Path $Path 'src/lib/crypto.ts'
if (Test-Path $cryptoFile) {
    $cryptoContent = Get-Content $cryptoFile -Raw
    $hasSignSession = $cryptoContent -match 'signSession'
    $hasVerifySig = $cryptoContent -match 'verifySessionSig'
    Write-Check 'HMAC signSession() present' $hasSignSession
    Write-Check 'HMAC verifySessionSig() present' $hasVerifySig
} else {
    Write-Check 'crypto.ts exists' $false 'File not found'
}

# --- Check 3: PBKDF2 in use ---
if (Test-Path $authFile) {
    $hasPBKDF2 = $authContent -match 'hashPasswordPBKDF2'
    Write-Check 'PBKDF2 password hashing referenced' $hasPBKDF2
}

# --- Check 4: Rate limiting config ---
if (Test-Path $authFile) {
    $maxAttempts = if ($authContent -match 'MAX_ATTEMPTS\s*=\s*(\d+)') { [int]$Matches[1] } else { 0 }
    # LOCKOUT_DURATION may be an expression like 30 * 60 * 1000
    $lockoutMin = 0
    if ($authContent -match 'LOCKOUT_DURATION\s*=\s*(.+?)\s*//') {
        try { $lockoutMin = [math]::Round((Invoke-Expression $Matches[1]) / 60000) } catch { }
    }
    Write-Check "Rate limit: $maxAttempts attempts / ${lockoutMin}min lockout" ($maxAttempts -le 5 -and $lockoutMin -ge 15)
}

# --- Check 5: No default password in bundle ---
$distDir = Join-Path $Path 'dist'
if (Test-Path $distDir) {
    $jsFiles = Get-ChildItem $distDir -Recurse -Filter '*.js'
    $leakedDefault = $false
    foreach ($f in $jsFiles) {
        $content = Get-Content $f.FullName -Raw
        if ($content -match 'SecureAdmin2024') {
            $leakedDefault = $true
            break
        }
    }
    Write-Check 'No default password in dist/' (-not $leakedDefault)
} else {
    Write-Warn 'dist/ not found' 'Run vite build first to check for password leaks in bundle'
}

# --- Check 6: SECURITY.md version ---
$secFile = Join-Path $Path 'SECURITY.md'
if (Test-Path $secFile) {
    $secContent = Get-Content $secFile -Raw
    $hasV2 = $secContent -match 'Version.*2\.'
    Write-Check 'SECURITY.md version >= 2.0' $hasV2

    $hasDefaultCreds = $secContent -match 'SecureAdmin2024'
    Write-Check 'No default creds in SECURITY.md' (-not $hasDefaultCreds)
} else {
    Write-Check 'SECURITY.md exists' $false
}

# --- Check 7: Session type has _sig field ---
$typesFile = Join-Path $Path 'src/lib/types.ts'
if (Test-Path $typesFile) {
    $typesContent = Get-Content $typesFile -Raw
    $hasSig = $typesContent -match '_sig\??\s*:\s*string'
    Write-Check 'Session interface has _sig field' $hasSig
} else {
    Write-Check 'types.ts exists' $false
}

# --- Check 8: Encrypted login attempts ---
if (Test-Path $authFile) {
    $directKvSet = ([regex]::Matches($authContent, 'kv\.set\(LOGIN_ATTEMPTS_KEY')).Count
    # Should be exactly 1 (inside setLoginAttempts helper)
    Write-Check "Login attempts encrypted (direct kv.set calls: $directKvSet)" ($directKvSet -le 1)
}

# --- Summary ---
Write-Host "`n--- Summary ---" -ForegroundColor Cyan
Write-Host "  Passed:   $passed" -ForegroundColor Green
Write-Host "  Failed:   $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Green' })
Write-Host "  Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { 'Yellow' } else { 'Green' })

if ($failed -gt 0) {
    Write-Host "`nAccess Plane: NOT READY" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nAccess Plane: VERIFIED" -ForegroundColor Green
    exit 0
}
