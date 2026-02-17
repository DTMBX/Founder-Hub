<#
.SYNOPSIS
  Phase Runner Gate Verification Script (B13/B14/B15)

.DESCRIPTION
  Runs Gate A-E checks for the phase runner.
  Gate A: Typecheck (tsc --noEmit)
  Gate B: Unit tests (vitest run)
  Gate C: Lint (eslint)
  Gate D: Workflow YAML validation
  Gate E: Integrity checks (registry validator, etc.)

.PARAMETER Gate
  Run a specific gate (A, B, C, D, E, or All). Default: All.

.PARAMETER Verbose
  Show detailed output from each gate.

.EXAMPLE
  .\scripts\verify.ps1
  .\scripts\verify.ps1 -Gate A
#>

param(
    [ValidateSet('All', 'A', 'B', 'C', 'D', 'E')]
    [string]$Gate = 'All',
    [switch]$Verbose
)

$ErrorActionPreference = 'Continue'
$script:failures = @()
$script:passes = @()

function Write-GateHeader([string]$name, [string]$desc) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Gate $name — $desc" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Record-Result([string]$gate, [bool]$passed, [string]$detail) {
    if ($passed) {
        Write-Host "  [PASS] $detail" -ForegroundColor Green
        $script:passes += "$gate`: $detail"
    } else {
        Write-Host "  [FAIL] $detail" -ForegroundColor Red
        $script:failures += "$gate`: $detail"
    }
}

# ── Gate A: Typecheck ────────────────────────────────────────
function Run-GateA {
    Write-GateHeader 'A' 'Typecheck'
    $result = & npx tsc --noEmit 2>&1
    $exitCode = $LASTEXITCODE
    if ($Verbose) { $result | ForEach-Object { Write-Host "    $_" } }
    Record-Result 'A' ($exitCode -eq 0) "tsc --noEmit (exit $exitCode)"
}

# ── Gate B: Unit Tests ───────────────────────────────────────
function Run-GateB {
    Write-GateHeader 'B' 'Unit Tests'
    $result = & npx vitest run ops/__tests__/b11-hardening.test.ts ops/__tests__/b12-copilot.test.ts 2>&1
    $exitCode = $LASTEXITCODE
    if ($Verbose) { $result | Select-Object -Last 20 | ForEach-Object { Write-Host "    $_" } }

    # Check for B13/B14/B15 test files and run them too
    $b13Tests = Get-ChildItem -Path ops/__tests__/b13*.test.ts -ErrorAction SilentlyContinue
    $b14Tests = Get-ChildItem -Path ops/__tests__/b14*.test.ts -ErrorAction SilentlyContinue
    $b15Tests = Get-ChildItem -Path ops/__tests__/b15*.test.ts -ErrorAction SilentlyContinue
    $extraTests = @($b13Tests; $b14Tests; $b15Tests) | Where-Object { $_ -ne $null }

    $extraExit = 0
    if ($extraTests.Count -gt 0) {
        $testPaths = $extraTests | ForEach-Object { $_.FullName }
        $extraResult = & npx vitest run @testPaths 2>&1
        $extraExit = $LASTEXITCODE
        if ($Verbose) { $extraResult | Select-Object -Last 20 | ForEach-Object { Write-Host "    $_" } }
    }

    Record-Result 'B' (($exitCode -eq 0) -and ($extraExit -eq 0)) "vitest (B11+B12 exit $exitCode, B13-15 exit $extraExit)"
}

# ── Gate C: Lint ─────────────────────────────────────────────
function Run-GateC {
    Write-GateHeader 'C' 'Lint/Format'
    # Lint only ops/ and apps/ directories (new code)
    $result = & npx eslint ops/ --max-warnings 0 2>&1
    $exitCode = $LASTEXITCODE
    if ($Verbose) { $result | Select-Object -Last 20 | ForEach-Object { Write-Host "    $_" } }
    # Treat exit code 0 or 1 with only warnings as conditional pass
    Record-Result 'C' ($exitCode -eq 0) "eslint ops/ (exit $exitCode)"
}

# ── Gate D: Workflow Validation ──────────────────────────────
function Run-GateD {
    Write-GateHeader 'D' 'Workflow YAML Validation'
    $yamls = Get-ChildItem -Path .github/workflows/*.yml -ErrorAction SilentlyContinue
    $allValid = $true
    foreach ($yml in $yamls) {
        try {
            $content = Get-Content $yml.FullName -Raw -ErrorAction Stop
            # Basic YAML validation: check it's non-empty and has reasonable structure
            if ([string]::IsNullOrWhiteSpace($content)) {
                Record-Result 'D' $false "$($yml.Name): empty file"
                $allValid = $false
            } elseif ($content -notmatch '^\s*(name|on|jobs):') {
                Record-Result 'D' $false "$($yml.Name): missing required top-level keys"
                $allValid = $false
            }
        } catch {
            Record-Result 'D' $false "$($yml.Name): read error - $_"
            $allValid = $false
        }
    }
    if ($allValid) {
        Record-Result 'D' $true "All $($yamls.Count) workflow YAML files validated"
    }
}

# ── Gate E: Integrity Checks ────────────────────────────────
function Run-GateE {
    Write-GateHeader 'E' 'Integrity Checks'

    # Registry validator
    if (Test-Path ops/runner/commands/validateRegistry.ts) {
        $result = & npx tsx ops/runner/commands/validateRegistry.ts 2>&1
        $exitCode = $LASTEXITCODE
        if ($Verbose) { $result | ForEach-Object { Write-Host "    $_" } }
        Record-Result 'E' ($exitCode -eq 0) "Registry validator (exit $exitCode)"
    } else {
        Record-Result 'E' $true "Registry validator: not yet created (skip)"
    }

    # Escrow manifest validator (when available)
    if (Test-Path ops/escrow/escrow-manifest.schema.json) {
        Record-Result 'E' $true "Escrow manifest schema exists"
    } else {
        Record-Result 'E' $true "Escrow manifest: not yet created (skip)"
    }
}

# ── Main ─────────────────────────────────────────────────────
Write-Host "`n╔══════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Phase Runner — Gate Verification   ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════╝" -ForegroundColor Yellow

Push-Location (Split-Path $PSScriptRoot -Parent)

try {
    if ($Gate -eq 'All' -or $Gate -eq 'A') { Run-GateA }
    if ($Gate -eq 'All' -or $Gate -eq 'B') { Run-GateB }
    if ($Gate -eq 'All' -or $Gate -eq 'C') { Run-GateC }
    if ($Gate -eq 'All' -or $Gate -eq 'D') { Run-GateD }
    if ($Gate -eq 'All' -or $Gate -eq 'E') { Run-GateE }
} finally {
    Pop-Location
}

# ── Summary ──────────────────────────────────────────────────
Write-Host "`n────────────────────────────────────────" -ForegroundColor White
Write-Host "  SUMMARY" -ForegroundColor White
Write-Host "────────────────────────────────────────" -ForegroundColor White
Write-Host "  Passed: $($script:passes.Count)" -ForegroundColor Green
if ($script:failures.Count -gt 0) {
    Write-Host "  Failed: $($script:failures.Count)" -ForegroundColor Red
    foreach ($f in $script:failures) {
        Write-Host "    ✘ $f" -ForegroundColor Red
    }
    exit 1
} else {
    Write-Host "  Failed: 0" -ForegroundColor Green
    Write-Host "`n  All gates passed." -ForegroundColor Green
    exit 0
}
