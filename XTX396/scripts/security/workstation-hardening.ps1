<#
.SYNOPSIS
  B13-P7 — Workstation hardening audit script.

.DESCRIPTION
  Checks developer workstation configuration against security
  baseline requirements. Reports pass/fail for each control.

  Controls checked:
    1. Git commit signing (GPG or SSH)
    2. Credential store configured (not plaintext)
    3. SSH keys present and protected
    4. No secrets in common config files
    5. OS firewall enabled
    6. Disk encryption status (BitLocker on Windows)
    7. Git hooks directory exists
    8. .env files not tracked

.PARAMETER Fix
  Attempt to auto-fix certain issues (e.g., configure credential store).

.EXAMPLE
  .\workstation-hardening.ps1
  .\workstation-hardening.ps1 -Fix
#>

[CmdletBinding()]
param(
    [switch]$Fix
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$passed = 0
$failed = 0
$warnings = 0

function Assert-Control([string]$Name, [bool]$Condition, [string]$Detail = "", [switch]$Warn) {
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } elseif ($Warn) {
        Write-Host "  [WARN] $Name — $Detail" -ForegroundColor Yellow
        $script:warnings++
    } else {
        Write-Host "  [FAIL] $Name — $Detail" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "=== B13-P7 Workstation Hardening Audit ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Git commit signing ────────────────────────────────────────

$gpgSign = git config --global commit.gpgsign 2>$null
$sshSign = git config --global gpg.format 2>$null
$signingConfigured = ($gpgSign -eq 'true') -or ($sshSign -eq 'ssh')

Assert-Control "Git commit signing configured" $signingConfigured `
    "Run: git config --global commit.gpgsign true" -Warn

# ── 2. Credential store ─────────────────────────────────────────

$credHelper = git config --global credential.helper 2>$null
$hasCredStore = ($null -ne $credHelper) -and ($credHelper -ne '') -and ($credHelper -ne 'store')

Assert-Control "Git credential helper (not plaintext)" $hasCredStore `
    "Run: git config --global credential.helper manager"

if ($Fix -and -not $hasCredStore) {
    git config --global credential.helper manager
    Write-Host "    → Fixed: credential.helper set to 'manager'" -ForegroundColor Green
}

# ── 3. SSH keys ──────────────────────────────────────────────────

$sshDir = Join-Path $env:USERPROFILE ".ssh"
$hasSSHKeys = (Test-Path "$sshDir/id_ed25519") -or (Test-Path "$sshDir/id_rsa")

Assert-Control "SSH keys present" $hasSSHKeys `
    "Generate with: ssh-keygen -t ed25519" -Warn

# ── 4. No secrets in shell config ────────────────────────────────

$configFiles = @(
    (Join-Path $env:USERPROFILE ".bashrc"),
    (Join-Path $env:USERPROFILE ".zshrc"),
    (Join-Path $env:USERPROFILE ".profile")
)

$secretPatterns = @('API_KEY=', 'SECRET=', 'PASSWORD=', 'TOKEN=', 'PRIVATE_KEY=')
$secretsInConfig = $false

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        foreach ($pattern in $secretPatterns) {
            if ($content -match $pattern) {
                $secretsInConfig = $true
                break
            }
        }
    }
}

Assert-Control "No secrets in shell config files" (-not $secretsInConfig) `
    "Found secret-like patterns in shell config files"

# ── 5. Firewall ──────────────────────────────────────────────────

$firewallEnabled = $false
try {
    $fw = Get-NetFirewallProfile -ErrorAction SilentlyContinue
    $firewallEnabled = ($fw | Where-Object { $_.Enabled }) -ne $null
} catch {}

Assert-Control "OS firewall enabled" $firewallEnabled `
    "Enable Windows Firewall" -Warn

# ── 6. Disk encryption ──────────────────────────────────────────

$diskEncrypted = $false
try {
    $bitlocker = Get-BitLockerVolume -MountPoint "C:" -ErrorAction SilentlyContinue
    $diskEncrypted = $bitlocker.ProtectionStatus -eq 'On'
} catch {}

Assert-Control "Disk encryption (BitLocker) on C:" $diskEncrypted `
    "Enable BitLocker for full-disk encryption" -Warn

# ── 7. Git hooks directory ───────────────────────────────────────

$hooksPath = git config --global core.hooksPath 2>$null
$hasHooksDir = ($null -ne $hooksPath) -and (Test-Path $hooksPath -ErrorAction SilentlyContinue)

Assert-Control "Global git hooks directory configured" $hasHooksDir `
    "Set with: git config --global core.hooksPath ~/.git-hooks" -Warn

# ── 8. .env not tracked ─────────────────────────────────────────

$gitignoreGlobal = git config --global core.excludesFile 2>$null
$envExcluded = $false

if ($gitignoreGlobal -and (Test-Path $gitignoreGlobal)) {
    $content = Get-Content $gitignoreGlobal -Raw -ErrorAction SilentlyContinue
    $envExcluded = $content -match '\.env'
}

Assert-Control ".env in global gitignore" $envExcluded `
    "Add .env to your global gitignore file" -Warn

# ── Summary ──────────────────────────────────────────────────────

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "  Passed:   $passed" -ForegroundColor Green
Write-Host "  Failed:   $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Gray" })

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "HARDENING INCOMPLETE — address failed controls." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "HARDENING BASELINE MET" -ForegroundColor Green
    exit 0
}
