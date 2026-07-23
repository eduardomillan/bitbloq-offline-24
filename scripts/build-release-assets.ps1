<#
.SYNOPSIS
    Build & package Bitbloq Offline release assets for Windows.

.DESCRIPTION
    Produces:
      - dist/bitbloq-offline-windows-<version>.zip  (portable)
      - dist/bitbloq-offline-setup-<version>.exe    (NSIS installer, requires makensis)

    Usage:
      .\scripts\build-release-assets.ps1
      .\scripts\build-release-assets.ps1 -SkipBuild
      .\scripts\build-release-assets.ps1 -SkipZip
      .\scripts\build-release-assets.ps1 -SkipInstaller
#>

param(
    [switch]$SkipBuild,
    [switch]$SkipZip,
    [switch]$SkipInstaller
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

$PackageJson = Get-Content 'package.json' -Raw | ConvertFrom-Json
$Version = $PackageJson.version
$Product = 'bitbloq-offline'
$BuildDir = Join-Path 'dist' 'BitbloqOfflineWin'
$ZipFile = Join-Path 'dist' "$Product-windows-$Version.zip"
$SetupFile = Join-Path 'dist' "$Product-setup-$Version.exe"

Write-Host "Building Bitbloq Offline v$Version" -ForegroundColor Cyan

if (-not $SkipBuild) {
    Write-Host "`n==> grunt build:windows" -ForegroundColor Yellow
    & npx grunt build:windows
    if ($LASTEXITCODE -ne 0) {
        Write-Error "grunt build:windows failed"
        exit 1
    }
}

if (-not $SkipZip) {
    Write-Host "`n==> Creating portable ZIP" -ForegroundColor Yellow
    if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }
    Compress-Archive -Path "$BuildDir\*" -DestinationPath $ZipFile -CompressionLevel Optimal
    Write-Host "Created: $ZipFile" -ForegroundColor Green
}

if (-not $SkipInstaller) {
    Write-Host "`n==> Creating NSIS installer" -ForegroundColor Yellow
    $Makensis = Get-Command makensis -ErrorAction SilentlyContinue
    if (-not $Makensis) {
        Write-Warning "makensis not found on PATH. Skipping installer. Install NSIS from https://nsis.sourceforge.io/"
    } else {
        & npx grunt pkg-nsis-win
        if ($LASTEXITCODE -ne 0) {
            Write-Error "pkg-nsis-win failed"
            exit 1
        }
        if (Test-Path $SetupFile) {
            Write-Host "Created: $SetupFile" -ForegroundColor Green
        }
    }
}

Write-Host "`nDone. Assets in dist/:" -ForegroundColor Cyan
Get-ChildItem dist -File | Where-Object { $_.Name -match "$Product.*$Version" } | ForEach-Object {
    Write-Host "  $($_.Name) ($([math]::Round($_.Length / 1MB, 1)) MB)" -ForegroundColor White
}
