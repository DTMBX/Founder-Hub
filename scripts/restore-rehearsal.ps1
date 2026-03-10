<#
.SYNOPSIS
    Founder-Hub Backup Restore Rehearsal Script
    
.DESCRIPTION
    Script for testing backup restoration procedures.
    Part of Chain B5 - Disaster Recovery implementation.
    
.PARAMETER Download
    Download the latest backup from S3

.PARAMETER Latest
    Use the latest backup (with -Download)

.PARAMETER Archive
    Path to encrypted archive to restore

.PARAMETER Decrypt
    Decrypt an encrypted archive

.PARAMETER Verify
    Verify the integrity of a restored backup

.PARAMETER Restore
    Restore the backup to a target directory

.PARAMETER Target
    Target directory for restoration

.PARAMETER VerifyProvenance
    Verify provenance records during restore

.PARAMETER ListBackups
    List available backups in S3

.EXAMPLE
    .\restore-rehearsal.ps1 -Download -Latest
    Downloads the latest backup from S3

.EXAMPLE
    .\restore-rehearsal.ps1 -Decrypt -Archive backup-20260217-0200.tar.gz.enc
    Decrypts the specified archive

.EXAMPLE
    .\restore-rehearsal.ps1 -Restore -Target .\restored
    Restores the backup to .\restored directory

.NOTES
    Author: Founder-Hub System
    Version: 1.0.0
    Chain: B5 - Backups + Disaster Recovery
#>

[CmdletBinding()]
param(
    [switch]$Download,
    [switch]$Latest,
    [string]$Archive,
    [switch]$Decrypt,
    [switch]$Verify,
    [switch]$Restore,
    [string]$Target = ".\restored",
    [switch]$VerifyProvenance,
    [switch]$ListBackups,
    [string]$Bucket = $env:BACKUP_BUCKET,
    [string]$EncryptionKey = $env:BACKUP_ENCRYPTION_KEY
)

# ─── Configuration ────────────────────────────────────────────

$script:Config = @{
    DefaultBucket = "Founder-Hub-backups"
    TempDir = Join-Path $env:TEMP "Founder-Hub-restore"
    LatestPath = "latest/backup-latest.tar.gz.enc"
    ManifestPath = "latest/backup-manifest.json"
}

# ─── Helper Functions ─────────────────────────────────────────

function Write-Step {
    param([string]$Message, [string]$Status = "INFO")
    $colors = @{
        "INFO" = "Cyan"
        "OK" = "Green"
        "WARN" = "Yellow"
        "ERROR" = "Red"
    }
    $symbol = switch ($Status) {
        "OK" { "✅" }
        "WARN" { "⚠️" }
        "ERROR" { "❌" }
        default { "📋" }
    }
    Write-Host "$symbol " -NoNewline
    Write-Host $Message -ForegroundColor $colors[$Status]
}

function Test-Prerequisites {
    $missing = @()
    
    # Check for AWS CLI
    if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
        $missing += "AWS CLI (aws)"
    }
    
    # Check for OpenSSL
    if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
        $missing += "OpenSSL (openssl)"
    }
    
    # Check for Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        $missing += "Git (git)"
    }
    
    # Check for tar
    if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
        $missing += "tar"
    }
    
    if ($missing.Count -gt 0) {
        Write-Step "Missing prerequisites: $($missing -join ', ')" "ERROR"
        Write-Host "`nInstall missing tools:"
        Write-Host "  - AWS CLI: https://aws.amazon.com/cli/"
        Write-Host "  - OpenSSL: winget install OpenSSL"
        Write-Host "  - Git: https://git-scm.com/"
        return $false
    }
    
    Write-Step "All prerequisites met" "OK"
    return $true
}

function Get-BucketName {
    if ($Bucket) { return $Bucket }
    return $Config.DefaultBucket
}

function Initialize-TempDir {
    if (-not (Test-Path $Config.TempDir)) {
        New-Item -ItemType Directory -Path $Config.TempDir | Out-Null
    }
    return $Config.TempDir
}

# ─── Commands ─────────────────────────────────────────────────

function Invoke-ListBackups {
    Write-Step "Listing available backups..."
    
    $bucket = Get-BucketName
    
    Write-Host "`n=== Daily Backups ===" -ForegroundColor Cyan
    aws s3 ls "s3://$bucket/daily/" --recursive | ForEach-Object {
        if ($_ -match "\.tar\.gz\.enc$") {
            Write-Host "  $_"
        }
    }
    
    Write-Host "`n=== Monthly Backups ===" -ForegroundColor Cyan
    aws s3 ls "s3://$bucket/monthly/" --recursive | ForEach-Object {
        if ($_ -match "\.tar\.gz\.enc$") {
            Write-Host "  $_"
        }
    }
    
    Write-Host "`n=== Latest ===" -ForegroundColor Cyan
    aws s3 ls "s3://$bucket/latest/"
}

function Invoke-Download {
    param([switch]$UseLatest)
    
    Write-Step "Downloading backup from S3..."
    
    $bucket = Get-BucketName
    $tempDir = Initialize-TempDir
    
    if ($UseLatest) {
        $s3Path = "s3://$bucket/$($Config.LatestPath)"
        $manifestPath = "s3://$bucket/$($Config.ManifestPath)"
        $localFile = Join-Path $tempDir "backup-latest.tar.gz.enc"
        $localManifest = Join-Path $tempDir "backup-manifest.json"
    } else {
        Write-Step "Specify a backup date or use -Latest" "ERROR"
        return $null
    }
    
    Write-Step "Downloading: $s3Path"
    aws s3 cp $s3Path $localFile
    
    if (-not (Test-Path $localFile)) {
        Write-Step "Download failed" "ERROR"
        return $null
    }
    
    Write-Step "Downloading manifest..."
    aws s3 cp $manifestPath $localManifest 2>$null
    
    $size = (Get-Item $localFile).Length
    Write-Step "Downloaded: $localFile ($([math]::Round($size/1MB, 2)) MB)" "OK"
    
    return $localFile
}

function Invoke-Decrypt {
    param([string]$ArchivePath)
    
    if (-not $ArchivePath) {
        Write-Step "No archive specified. Use -Archive parameter." "ERROR"
        return $null
    }
    
    if (-not (Test-Path $ArchivePath)) {
        Write-Step "Archive not found: $ArchivePath" "ERROR"
        return $null
    }
    
    Write-Step "Decrypting archive: $ArchivePath"
    
    # Get encryption key
    $key = $EncryptionKey
    if (-not $key) {
        $key = Read-Host "Enter encryption key" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($key)
        $key = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
    
    if (-not $key) {
        Write-Step "No encryption key provided" "ERROR"
        return $null
    }
    
    # Output path (remove .enc)
    $outputPath = $ArchivePath -replace '\.enc$', ''
    
    # Decrypt using OpenSSL
    $env:BACKUP_KEY_TEMP = $key
    & openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 `
        -in $ArchivePath `
        -out $outputPath `
        -pass "pass:$key"
    
    $env:BACKUP_KEY_TEMP = $null
    
    if (-not (Test-Path $outputPath)) {
        Write-Step "Decryption failed" "ERROR"
        return $null
    }
    
    Write-Step "Decrypted: $outputPath" "OK"
    return $outputPath
}

function Invoke-Verify {
    param([string]$ArchivePath)
    
    if (-not $ArchivePath) {
        # Find recently extracted directory
        $tempDir = $Config.TempDir
        $archivePath = Get-ChildItem $tempDir -Filter "*.tar.gz" | Select-Object -First 1
        if (-not $archivePath) {
            Write-Step "No archive to verify. Decrypt first." "ERROR"
            return $false
        }
        $ArchivePath = $archivePath.FullName
    }
    
    Write-Step "Verifying backup integrity..."
    
    $tempDir = Initialize-TempDir
    $extractDir = Join-Path $tempDir "verify"
    
    if (Test-Path $extractDir) {
        Remove-Item $extractDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $extractDir | Out-Null
    
    # Extract archive
    Write-Step "Extracting archive..."
    tar -xzf $ArchivePath -C $extractDir
    
    # Check for manifest
    $manifestPath = Join-Path $extractDir "backup-manifest.json"
    if (Test-Path $manifestPath) {
        Write-Step "Manifest found" "OK"
        $manifest = Get-Content $manifestPath | ConvertFrom-Json
        Write-Host "  Backup ID: $($manifest.backupId)"
        Write-Host "  Type: $($manifest.backupType)"
        Write-Host "  Timestamp: $($manifest.timestamp)"
        Write-Host "  Commit: $($manifest.commit.sha)"
    } else {
        Write-Step "No manifest found" "WARN"
    }
    
    # Find and verify bundle
    $bundlePath = Get-ChildItem $extractDir -Filter "*.bundle" | Select-Object -First 1
    if ($bundlePath) {
        Write-Step "Verifying git bundle..."
        & git bundle verify $bundlePath.FullName
        if ($LASTEXITCODE -eq 0) {
            Write-Step "Git bundle verified" "OK"
            
            # List bundle contents
            Write-Host "`n=== Bundle Contents ===" -ForegroundColor Cyan
            & git bundle list-heads $bundlePath.FullName
        } else {
            Write-Step "Git bundle verification failed" "ERROR"
            return $false
        }
    } else {
        Write-Step "No git bundle found" "ERROR"
        return $false
    }
    
    Write-Step "Backup verification complete" "OK"
    return $true
}

function Invoke-Restore {
    param(
        [string]$TargetPath,
        [switch]$CheckProvenance
    )
    
    Write-Step "Restoring backup to: $TargetPath"
    
    $tempDir = $Config.TempDir
    $extractDir = Join-Path $tempDir "verify"
    
    if (-not (Test-Path $extractDir)) {
        Write-Step "No extracted backup found. Run -Decrypt and -Verify first." "ERROR"
        return $false
    }
    
    # Find bundle
    $bundlePath = Get-ChildItem $extractDir -Filter "*.bundle" | Select-Object -First 1
    if (-not $bundlePath) {
        Write-Step "No git bundle found" "ERROR"
        return $false
    }
    
    # Create target directory
    if (Test-Path $TargetPath) {
        Write-Step "Target exists. Removing..." "WARN"
        Remove-Item $TargetPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TargetPath | Out-Null
    
    # Clone from bundle
    Write-Step "Cloning from bundle..."
    & git clone $bundlePath.FullName $TargetPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Step "Clone failed" "ERROR"
        return $false
    }
    
    # Verify clone
    Push-Location $TargetPath
    try {
        $branchCount = (& git branch -a).Count
        $tagCount = (& git tag).Count
        Write-Step "Restored repository: $branchCount branches, $tagCount tags" "OK"
        
        # Check provenance if requested
        if ($CheckProvenance) {
            $manifestPath = Join-Path $extractDir "backup-manifest.json"
            if (Test-Path $manifestPath) {
                $manifest = Get-Content $manifestPath | ConvertFrom-Json
                $currentSha = & git rev-parse HEAD
                if ($currentSha -eq $manifest.commit.sha) {
                    Write-Step "Provenance verified: HEAD matches backup commit" "OK"
                } else {
                    Write-Step "Provenance mismatch: HEAD=$currentSha, Expected=$($manifest.commit.sha)" "WARN"
                }
            }
        }
        
        # Test build (optional)
        if (Test-Path "package.json") {
            Write-Host "`nWould you like to test the build? (y/n)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -eq 'y') {
                Write-Step "Installing dependencies..."
                & npm ci
                Write-Step "Running build..."
                & npm run build
                if ($LASTEXITCODE -eq 0) {
                    Write-Step "Build successful" "OK"
                } else {
                    Write-Step "Build failed" "ERROR"
                }
            }
        }
    } finally {
        Pop-Location
    }
    
    Write-Step "Restore complete: $TargetPath" "OK"
    return $true
}

# ─── Main ─────────────────────────────────────────────────────

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Founder-Hub Backup Restore Rehearsal Script            ║" -ForegroundColor Cyan
Write-Host "║        Chain B5 - Disaster Recovery                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if (-not (Test-Prerequisites)) {
    exit 1
}

# Execute requested operations
$success = $true

if ($ListBackups) {
    Invoke-ListBackups
}

if ($Download) {
    $archiveFile = Invoke-Download -UseLatest:$Latest
    if (-not $archiveFile) { $success = $false }
    else { $Archive = $archiveFile }
}

if ($Decrypt -and $Archive) {
    $decryptedFile = Invoke-Decrypt -ArchivePath $Archive
    if (-not $decryptedFile) { $success = $false }
    else { $Archive = $decryptedFile }
}

if ($Verify) {
    $verified = Invoke-Verify -ArchivePath $Archive
    if (-not $verified) { $success = $false }
}

if ($Restore) {
    $restored = Invoke-Restore -TargetPath $Target -CheckProvenance:$VerifyProvenance
    if (-not $restored) { $success = $false }
}

# Summary
Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($success) {
    Write-Step "All operations completed successfully" "OK"
} else {
    Write-Step "Some operations failed. Review output above." "ERROR"
}

Write-Host "`nFor DR drill documentation, see:" -ForegroundColor Gray
Write-Host "  governance/dr_runbook.md" -ForegroundColor Gray
