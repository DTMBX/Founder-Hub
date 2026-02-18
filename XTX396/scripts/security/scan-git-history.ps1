<#
.SYNOPSIS
  Scan git history for commits containing secret-like patterns.
  Prints commit HASHES and file PATHS only -- never prints matched content.

.DESCRIPTION
  Iterates through git log diffs and checks for secret patterns.
  SAFE OUTPUT: commit hash + file path + pattern name only.
  No matched line content is ever displayed.

.EXAMPLE
  .\scripts\security\scan-git-history.ps1

.NOTES
  Part of Evident Technologies security hardening.
  NEVER modify this script to print matched content.
  For remediation, see docs/security/GIT_HISTORY_REMEDIATION.md
#>

param(
    [string]$RepoPath = (Get-Location).Path,
    [int]$MaxCommits = 0,     # 0 = all commits
    [switch]$Quiet
)

$ErrorActionPreference = 'Continue'

# --- Secret Patterns ------------------------------------------
$Patterns = @(
    @{ Name = 'Stripe Live Key';    Regex = 'sk_live_[A-Za-z0-9]{20,}' },
    @{ Name = 'Stripe Test Key';    Regex = 'sk_test_[A-Za-z0-9]{20,}' },
    @{ Name = 'AWS Access Key';     Regex = 'AKIA[0-9A-Z]{16}' },
    @{ Name = 'GitHub PAT';         Regex = 'ghp_[A-Za-z0-9]{36}' },
    @{ Name = 'GitHub OAuth';       Regex = 'gho_[A-Za-z0-9]{36}' },
    @{ Name = 'Private Key Block';  Regex = '-----BEGIN.*PRIVATE KEY-----' },
    @{ Name = 'Slack Token';        Regex = 'xox[bprs]-[A-Za-z0-9\-]{10,}' },
    @{ Name = 'Generic Password';   Regex = '(?i)password\s*[:=]\s*[''"][^''"]{8,}[''"]' }
)

# --- Get Commits ----------------------------------------------
Push-Location $RepoPath

if (-not $Quiet) { Write-Host "`n=== Git History Secret Scan ===" -ForegroundColor Cyan }

$commitArgs = @('log', '--all', '--format=%H')
if ($MaxCommits -gt 0) { $commitArgs += "-$MaxCommits" }

$commits = & git @commitArgs 2>$null
if (-not $commits) {
    Write-Host "  No commits found in repository." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

$commitCount = ($commits | Measure-Object).Count
if (-not $Quiet) { Write-Host "  Scanning $commitCount commit(s)..." -ForegroundColor Gray }

# --- Scan Each Commit Diff ------------------------------------
$findings = @()
$scanned = 0

foreach ($hash in $commits) {
    $scanned++
    if ($scanned % 50 -eq 0 -and -not $Quiet) {
        Write-Host "  Progress: $scanned / $commitCount" -ForegroundColor Gray
    }

    # Get diff for this commit (first commit has no parent)
    $diff = & git diff-tree -p --no-color $hash 2>$null
    if (-not $diff) { continue }

    $currentFile = ''
    foreach ($line in $diff) {
        # Track current file
        if ($line -match '^\+\+\+ b/(.+)$') {
            $currentFile = $Matches[1]
            continue
        }

        # Only check added lines (lines starting with +)
        if ($line -notmatch '^\+') { continue }
        if ($line -eq '+++') { continue }

        foreach ($p in $Patterns) {
            if ($line -match $p.Regex) {
                $findings += [PSCustomObject]@{
                    Commit  = $hash.Substring(0, 8)
                    File    = $currentFile
                    Type    = $p.Name
                }
                # Only report once per file per commit per pattern type
                break
            }
        }
    }
}

Pop-Location

# --- Results --------------------------------------------------
if ($findings.Count -eq 0) {
    if (-not $Quiet) { Write-Host "`nRESULT: CLEAN -- No secrets found in git history." -ForegroundColor Green }
    exit 0
} else {
    # Deduplicate
    $unique = $findings | Sort-Object Commit, File, Type -Unique
    Write-Host "`nFOUND $($unique.Count) potential exposure(s) in git history:" -ForegroundColor Red
    $unique | Format-Table -Property Commit, File, Type -AutoSize
    Write-Host "`nACTION REQUIRED:" -ForegroundColor Red
    Write-Host "  1. Review each finding" -ForegroundColor Yellow
    Write-Host "  2. Rotate any exposed credentials immediately" -ForegroundColor Yellow
    Write-Host "  3. Follow docs/security/GIT_HISTORY_REMEDIATION.md to rewrite history" -ForegroundColor Yellow
    Write-Host "  4. Force-push the cleaned history" -ForegroundColor Yellow
    exit 1
}

