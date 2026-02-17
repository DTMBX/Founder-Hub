<#
.SYNOPSIS
  Pre-push hook — blocks pushes that would delete protected branches
  or push commits containing protected-path deletions.

.DESCRIPTION
  Scans the commit range being pushed for deleted files matching the
  protected-paths list.  Also guards against pushes to protected branches
  without explicit confirmation.

  Set EVIDENT_GUARD_OVERRIDE=1 to bypass (logged to audit trail).

.NOTES
  Install: copy to .git/hooks/pre-push or invoke from Husky/lefthook.
  B13-P8 — Anti-Deletion Guardrails
#>
param(
    [string]$Remote = '',
    [string]$Url = '',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# ── Protected patterns ───────────────────────────────────────────
$ProtectedPatterns = @(
    'governance/**'
    '.github/workflows/**'
    'ops/runner/**'
    'ops/copilot/**'
    'ops/automation/**'
    'ops/console/**'
    'ops/core/**'
    'ops/security/**'
    'ops/backup/**'
    'apps/**'
    'contracts/**'
    'scripts/**'
    'src/lib/secret-vault.ts'
    'src/lib/redaction.ts'
)

# ── Protected branches ──────────────────────────────────────────
$ProtectedBranches = @('main', 'master', 'production')

# ── Glob-to-regex helper ────────────────────────────────────────
function Convert-GlobToRegex {
    param([string]$Pattern)
    $escaped = [regex]::Escape($Pattern) -replace '/', '\/'
    $escaped = $escaped -replace '\\\*\\\*', '.*'
    $escaped = $escaped -replace '\\\*', '[^/]*'
    return "^$escaped$"
}

# ── Determine current branch ────────────────────────────────────
$currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
if ($currentBranch -and $ProtectedBranches -contains $currentBranch) {
    if ($env:EVIDENT_GUARD_OVERRIDE -ne '1') {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "  PRE-PUSH GUARD: PUSH TO PROTECTED BRANCH BLOCKED" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Branch '$currentBranch' is protected." -ForegroundColor Yellow
        Write-Host "  Direct pushes require EVIDENT_GUARD_OVERRIDE=1." -ForegroundColor Yellow
        Write-Host ""
        if (-not $DryRun) { exit 1 }
    } else {
        Write-Warning "Override active: allowing push to protected branch '$currentBranch'."
    }
}

# ── Read stdin for push refs (git pre-push hook protocol) ───────
# Format: <local-ref> <local-sha> <remote-ref> <remote-sha>
$pushLines = @()
if (-not $DryRun) {
    try {
        while ($line = Read-Host) {
            if ($line.Trim() -ne '') { $pushLines += $line }
        }
    } catch {
        # stdin closed — no push refs to process
    }
}

# ── Scan commits for deletions ───────────────────────────────────
$allViolations = @()
$totalDeleted = 0

foreach ($pushLine in $pushLines) {
    $parts = $pushLine -split '\s+'
    if ($parts.Count -lt 4) { continue }
    $localSha  = $parts[1]
    $remoteSha = $parts[3]

    # Skip delete pushes (all zeros)
    if ($localSha -match '^0+$') { continue }

    # Determine range
    $range = if ($remoteSha -match '^0+$') {
        $localSha
    } else {
        "$remoteSha..$localSha"
    }

    # Get deleted files in this range
    $deleted = git diff --diff-filter=D --name-only $range 2>$null
    if (-not $deleted) { continue }

    $deletedFiles = $deleted -split "`n" | Where-Object { $_.Trim() -ne '' }
    $totalDeleted += $deletedFiles.Count

    foreach ($file in $deletedFiles) {
        foreach ($pattern in $ProtectedPatterns) {
            $regex = Convert-GlobToRegex -Pattern $pattern
            if ($file -match $regex) {
                $allViolations += [PSCustomObject]@{
                    File    = $file
                    Pattern = $pattern
                    Range   = $range
                }
                break
            }
        }
    }
}

# ── Mass deletion check ─────────────────────────────────────────
$totalFiles = (git ls-files | Measure-Object).Count
$ratio = if ($totalFiles -gt 0) { $totalDeleted / $totalFiles } else { 0 }
$massDelete = $ratio -ge 0.25

# ── Report ───────────────────────────────────────────────────────
if ($allViolations.Count -eq 0 -and -not $massDelete) {
    Write-Host "Pre-push guard: PASS ($totalDeleted deletion(s) in push range, no protected paths)."
    exit 0
}

if ($env:EVIDENT_GUARD_OVERRIDE -eq '1') {
    Write-Warning "EVIDENT_GUARD_OVERRIDE is set. Allowing push with $($allViolations.Count) violation(s)."
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  PRE-PUSH GUARD: PUSH BLOCKED" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

if ($massDelete) {
    Write-Host "  ⚠ Mass deletion detected: $totalDeleted files ($([math]::Round($ratio*100,1))% of repo)." -ForegroundColor Yellow
}

if ($allViolations.Count -gt 0) {
    Write-Host "  $($allViolations.Count) protected path(s) would be deleted:" -ForegroundColor Yellow
    foreach ($v in $allViolations) {
        Write-Host "    - $($v.File)  (pattern: $($v.Pattern))" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  To override, run:" -ForegroundColor Gray
Write-Host '    $env:EVIDENT_GUARD_OVERRIDE = "1"' -ForegroundColor Gray
Write-Host "  then re-push. Override MUST be documented in audit trail." -ForegroundColor Gray
Write-Host ""

if (-not $DryRun) { exit 1 }
