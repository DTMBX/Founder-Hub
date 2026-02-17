<#
.SYNOPSIS
  B13-P5 — Break-glass activation/deactivation script.

.DESCRIPTION
  Records break-glass events in an append-only JSON log.
  Supports: activate, deactivate, list, verify

  This script does NOT grant actual credentials — it records the
  event for audit purposes and guides the operator through the
  protocol steps.

.PARAMETER Action
  One of: activate, deactivate, list, verify

.PARAMETER Initiator
  Name of the person initiating the break-glass event.

.PARAMETER Approver
  Name of the person approving (required for activate).

.PARAMETER Justification
  Reason for the break-glass event (required for activate).

.EXAMPLE
  .\break-glass.ps1 -Action activate -Initiator "Jane Doe" -Approver "John Smith" -Justification "Production DB unreachable"
  .\break-glass.ps1 -Action deactivate
  .\break-glass.ps1 -Action list
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('activate', 'deactivate', 'list', 'verify')]
    [string]$Action,

    [string]$Initiator = "",
    [string]$Approver = "",
    [string]$Justification = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$logDir = Join-Path $PSScriptRoot "../../governance/security/break-glass-log"
$logFile = Join-Path $logDir "events.jsonl"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Append-Event($event) {
    $json = $event | ConvertTo-Json -Compress
    Add-Content -Path $logFile -Value $json -Encoding UTF8
}

function Get-Events {
    if (-not (Test-Path $logFile)) { return @() }
    Get-Content $logFile -Encoding UTF8 | Where-Object { $_ } | ForEach-Object {
        $_ | ConvertFrom-Json
    }
}

switch ($Action) {
    'activate' {
        if (-not $Initiator) { Write-Error "Initiator is required for activation."; exit 1 }
        if (-not $Justification) { Write-Error "Justification is required for activation."; exit 1 }

        $singlePerson = $false
        if (-not $Approver) {
            Write-Warning "No approver specified. Single-person activation."
            Write-Warning "A post-incident review MUST be conducted within 24 hours."
            $singlePerson = $true
        }

        $event = @{
            type          = "activation"
            incidentId    = "BG-$(Get-Date -Format 'yyyy')-$(Get-Random -Minimum 100 -Maximum 999)"
            timestamp     = (Get-Date -Format "o")
            initiator     = $Initiator
            approver      = if ($Approver) { $Approver } else { "SINGLE_PERSON" }
            justification = $Justification
            singlePerson  = $singlePerson
        }

        Append-Event $event

        Write-Host ""
        Write-Host "=== BREAK-GLASS ACTIVATED ===" -ForegroundColor Red
        Write-Host "Incident ID:   $($event.incidentId)" -ForegroundColor Yellow
        Write-Host "Initiated by:  $Initiator"
        Write-Host "Approved by:   $(if ($Approver) { $Approver } else { 'SINGLE PERSON' })"
        Write-Host "Justification: $Justification"
        Write-Host ""
        Write-Host "REMINDERS:" -ForegroundColor Yellow
        Write-Host "  1. Use minimum necessary permissions"
        Write-Host "  2. Document every action"
        Write-Host "  3. Preserve all evidence and logs"
        Write-Host "  4. Do NOT delete or modify audit trails"
        Write-Host "  5. Deactivate as soon as possible"
        Write-Host ""
    }

    'deactivate' {
        $events = Get-Events
        $active = $events | Where-Object { $_.type -eq 'activation' }
        $deactivated = $events | Where-Object { $_.type -eq 'deactivation' }

        $activeIds = ($active | ForEach-Object { $_.incidentId }) | Where-Object {
            $_ -notin ($deactivated | ForEach-Object { $_.incidentId })
        }

        if (-not $activeIds) {
            Write-Host "No active break-glass events found." -ForegroundColor Green
            exit 0
        }

        foreach ($id in $activeIds) {
            $event = @{
                type        = "deactivation"
                incidentId  = $id
                timestamp   = (Get-Date -Format "o")
                deactivatedBy = if ($Initiator) { $Initiator } else { "unknown" }
            }
            Append-Event $event
            Write-Host "Deactivated: $id" -ForegroundColor Green
        }

        Write-Host ""
        Write-Host "POST-DEACTIVATION REQUIREMENTS:" -ForegroundColor Yellow
        Write-Host "  1. Revoke all emergency credentials used"
        Write-Host "  2. Rotate exposed credentials"
        Write-Host "  3. Re-enable normal access controls"
        Write-Host "  4. Verify audit trail integrity"
        Write-Host "  5. Complete incident report within 24 hours"
    }

    'list' {
        $events = Get-Events
        if (-not $events) {
            Write-Host "No break-glass events recorded."
            exit 0
        }

        Write-Host "=== Break-Glass Event Log ===" -ForegroundColor Cyan
        foreach ($ev in $events) {
            $color = if ($ev.type -eq 'activation') { 'Red' } else { 'Green' }
            Write-Host "  [$($ev.type)] $($ev.incidentId) @ $($ev.timestamp)" -ForegroundColor $color
        }
    }

    'verify' {
        Write-Host "=== Break-Glass Log Verification ===" -ForegroundColor Cyan

        if (-not (Test-Path $logFile)) {
            Write-Host "  No log file found. No events recorded." -ForegroundColor Yellow
            exit 0
        }

        $events = Get-Events
        $activations = ($events | Where-Object { $_.type -eq 'activation' }).Count
        $deactivations = ($events | Where-Object { $_.type -eq 'deactivation' }).Count

        Write-Host "  Total events:    $($events.Count)"
        Write-Host "  Activations:     $activations"
        Write-Host "  Deactivations:   $deactivations"

        if ($activations -gt $deactivations) {
            Write-Host "  Status: ACTIVE ($($activations - $deactivations) open)" -ForegroundColor Red
        } else {
            Write-Host "  Status: All clear" -ForegroundColor Green
        }
    }
}
