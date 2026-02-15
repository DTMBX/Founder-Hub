<#
.SYNOPSIS
  Merge all (or selected) branches into main, verify after each, push.

.DESCRIPTION
  Safe, disciplined "merge → verify → push" workflow for high-integrity repos.
  Fetches/prunes, refuses dirty trees (unless -AllowDirty), merges one branch at
  a time, runs an optional proof/verification script after each merge, and only
  pushes main after all merges pass.

.EXAMPLE
  # Merge all local branches (auto-detected)
  Invoke-GitSuperMerge -RepoPath C:\web-dev\github-repos\founder-hub

.EXAMPLE
  # Merge specific branches
  Invoke-GitSuperMerge -Branches @("feature-a","feature-b") -MergeMode squash

.EXAMPLE
  # Tag a release after successful merge
  Invoke-GitSuperMerge -Tag v1.0.0
#>

function Invoke-GitSuperMerge {
  [CmdletBinding(SupportsShouldProcess)]
  param(
    # Where to run (repo root). Defaults to current directory.
    [string]$RepoPath = (Get-Location).Path,

    # Branches to merge into main. If omitted, auto-detects local branches
    # excluding main/master + HEAD + dependabot.
    [string[]]$Branches,

    # Default branch name.
    [string]$MainBranch = "main",

    # Remote name.
    [string]$Remote = "origin",

    # Merge method: "merge" (no-ff) or "squash"
    [ValidateSet("merge","squash")]
    [string]$MergeMode = "merge",

    # Verification command to run after each merge and at end.
    # If empty, auto-picks: federation-verify.ps1 → verify.ps1 → none.
    [string]$VerifyCommand = "",

    # Allow running with a dirty working tree (NOT recommended).
    [switch]$AllowDirty,

    # Also create local tracking branches for remote branches not yet local.
    [switch]$IncludeRemoteBranches,

    # Optional tag to create on success (e.g., v1.0.0)
    [string]$Tag
  )

  $ErrorActionPreference = "Stop"

  function Run([string]$cmd) {
    Write-Host "→ $cmd" -ForegroundColor Cyan
    Invoke-Expression $cmd
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE`: $cmd"
    }
  }

  function Ensure-CleanTree {
    $status = (git status --porcelain)
    if (-not $AllowDirty -and $status) {
      throw "Working tree is dirty. Commit/stash first (or rerun with -AllowDirty).`n$status"
    }
  }

  function Pick-VerifyCommand {
    if ($VerifyCommand) { return $VerifyCommand }
    $fed = Join-Path $RepoPath "federation-verify.ps1"
    $ver = Join-Path $RepoPath "verify.ps1"
    if (Test-Path $fed) { return ".\federation-verify.ps1" }
    if (Test-Path $ver) { return ".\verify.ps1" }
    return ""
  }

  Push-Location $RepoPath
  try {
    # Basic sanity — are we in a git repo?
    git rev-parse --is-inside-work-tree | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Not inside a git repository." }

    Ensure-CleanTree

    # Fetch latest state
    Run "git fetch $Remote --prune"

    # Ensure main exists locally
    $localMain = (git branch --list $MainBranch)
    if (-not $localMain) {
      Run "git checkout -b $MainBranch $Remote/$MainBranch"
    }

    # Move to main and update
    Run "git checkout $MainBranch"
    Run "git pull --rebase $Remote $MainBranch"

    $verify = Pick-VerifyCommand
    if ($verify) {
      Write-Host "`nRunning initial verification on $MainBranch..." -ForegroundColor Yellow
      Run $verify
    }

    # Optionally pull remote branches into local tracking
    if ($IncludeRemoteBranches) {
      $remoteBranches = git branch -r |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -match "^$Remote/" } |
        Where-Object { $_ -notmatch "/(HEAD|$MainBranch)$" }

      foreach ($rb in $remoteBranches) {
        $name = $rb -replace "^$Remote/",""
        $exists = (git branch --list $name)
        if (-not $exists) {
          Run "git branch --track $name $rb"
        }
      }
    }

    # Determine branches if not provided
    if (-not $Branches -or $Branches.Count -eq 0) {
      $Branches =
        git for-each-ref --format='%(refname:short)' refs/heads |
        Where-Object { $_ -and $_ -ne $MainBranch -and $_ -ne "master" } |
        Where-Object { $_ -notmatch "dependabot" }
    }

    if (-not $Branches -or $Branches.Count -eq 0) {
      Write-Host "`n✓ No branches to merge. $MainBranch is up to date." -ForegroundColor Green
      return
    }

    Write-Host "`nMerging into $MainBranch in this order:" -ForegroundColor Yellow
    $Branches | ForEach-Object { Write-Host "  • $_" }
    Write-Host ""

    $merged = 0
    $skipped = 0

    foreach ($b in $Branches) {
      # Skip if branch already merged
      git merge-base --is-ancestor $b $MainBranch 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Already merged: $b" -ForegroundColor DarkGray
        $skipped++
        continue
      }

      Write-Host "`n═══ MERGE $b → $MainBranch ═══" -ForegroundColor Magenta

      if ($MergeMode -eq "merge") {
        Run "git merge --no-ff $b"
      } else {
        Run "git merge --squash $b"
        Run "git commit -m `"Merge $b (squash)`""
      }

      $merged++

      # Verify after each merge
      if ($verify) {
        Write-Host "Verifying after merge of $b..." -ForegroundColor Yellow
        Run $verify
      }
    }

    # Final verify before push
    if ($verify -and $merged -gt 0) {
      Write-Host "`nFinal verification before push..." -ForegroundColor Yellow
      Run $verify
    }

    # Push main
    if ($merged -gt 0) {
      Run "git push $Remote $MainBranch"
    }

    # Optional tag
    if ($Tag) {
      Run "git tag -a $Tag -m `"Release $Tag`""
      Run "git push $Remote $Tag"
    }

    Write-Host "`n✅ Done. $merged merged, $skipped skipped, main pushed." -ForegroundColor Green
  }
  catch {
    Write-Host "`n❌ Aborted: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tip: If a merge conflict happened, resolve it, then re-run verify, then push." -ForegroundColor Yellow
    throw
  }
  finally {
    Pop-Location
  }
}

# Export for module use or dot-source
Export-ModuleMember -Function Invoke-GitSuperMerge -ErrorAction SilentlyContinue
