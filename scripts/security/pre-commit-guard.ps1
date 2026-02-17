<#
.SYNOPSIS
  Pre-commit hook — blocks commits that delete protected paths.

.DESCRIPTION
  Scans the staged diff for deleted files and checks them against
  the protected-paths list from governance/security/repo_criticality_map.json.

  Set EVIDENT_GUARD_OVERRIDE=1 to bypass (logged to audit trail).

.NOTES
  Install: copy to .git/hooks/pre-commit or invoke from Husky/lefthook.
  B13-P8 — Anti-Deletion Guardrails
#>
param(
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

# ── Glob-to-regex helper ────────────────────────────────────────
function Convert-GlobToRegex {
    param([string]$Pattern)
    $escaped = [regex]::Escape($Pattern) -replace '/', '\/'
    $escaped = $escaped -replace '\\\*\\\*', '.*'
    $escaped = $escaped -replace '\\\*', '[^/]*'
    return "^$escaped$"
}

# ── Gather deleted files from staged diff ────────────────────────
$deleted = git diff --cached --diff-filter=D --name-only 2>&1
if (-not $deleted) {
    if (-not $DryRun) { Write-Host "Pre-commit guard: no deletions detected." }
    exit 0
}

$deletedFiles = $deleted -split "`n" | Where-Object { $_.Trim() -ne '' }

# ── Check against protected patterns ────────────────────────────
$violations = @()
foreach ($file in $deletedFiles) {
    foreach ($pattern in $ProtectedPatterns) {
        $regex = Convert-GlobToRegex -Pattern $pattern
        if ($file -match $regex) {
            $violations += [PSCustomObject]@{
                File    = $file
                Pattern = $pattern
            }
            break
        }
    }
}

# ── Mass deletion check ─────────────────────────────────────────
$totalFiles = (git ls-files | Measure-Object).Count
$ratio = if ($totalFiles -gt 0) { $deletedFiles.Count / $totalFiles } else { 0 }
$massDelete = $ratio -ge 0.25

# ── Report ───────────────────────────────────────────────────────
if ($violations.Count -eq 0 -and -not $massDelete) {
    Write-Host "Pre-commit guard: PASS ($($deletedFiles.Count) deletion(s), no protected paths)."
    exit 0
}

# Override check
if ($env:EVIDENT_GUARD_OVERRIDE -eq '1') {
    Write-Warning "EVIDENT_GUARD_OVERRIDE is set. Allowing commit with $($violations.Count) violation(s)."
    Write-Warning "This override MUST be logged in the audit trail."
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  ANTI-DELETION GUARD: COMMIT BLOCKED" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

if ($massDelete) {
    Write-Host "  ⚠ Mass deletion detected: $($deletedFiles.Count) files ($([math]::Round($ratio*100,1))% of repo)." -ForegroundColor Yellow
}

if ($violations.Count -gt 0) {
    Write-Host "  $($violations.Count) protected path(s) would be deleted:" -ForegroundColor Yellow
    foreach ($v in $violations) {
        Write-Host "    - $($v.File)  (pattern: $($v.Pattern))" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  To override, run:" -ForegroundColor Gray
Write-Host '    $env:EVIDENT_GUARD_OVERRIDE = "1"' -ForegroundColor Gray
Write-Host "  then re-commit. Override MUST be documented in audit trail." -ForegroundColor Gray
Write-Host ""

if (-not $DryRun) { exit 1 }
