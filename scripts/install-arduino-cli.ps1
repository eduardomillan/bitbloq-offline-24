# Bitbloq Offline - Arduino CLI Installation Script for Windows
# This script installs arduino-cli, the AVR core, and the Servo library
# required for Bitbloq Offline to compile and upload programs.

param(
    [switch]$Silent,
    [string]$InstallDir = "$env:LOCALAPPDATA\arduino-cli"
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message)
    Write-Host "[Bitbloq] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[Bitbloq] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[Bitbloq] ERROR: $Message" -ForegroundColor Red
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-LatestArduinoCliVersion {
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/arduino/arduino-cli/releases/latest" -TimeoutSec 30
        return $release.tag_name -replace '^v', ''
    } catch {
        Write-Error "Could not fetch latest version: $_"
        return $null
    }
}

function Install-ArduinoCli {
    Write-Status "Checking for existing arduino-cli installation..."
    
    if (Test-CommandExists "arduino-cli") {
        $currentVersion = & arduino-cli version 2>$null
        Write-Success "arduino-cli is already installed: $currentVersion"
        return $true
    }
    
    Write-Status "arduino-cli not found. Installing..."
    
    # Create installation directory
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        Write-Status "Created directory: $InstallDir"
    }
    
    # Get latest version
    $version = Get-LatestArduinoCliVersion
    if (-not $version) {
        Write-Error "Could not determine latest version. Please install manually."
        return $false
    }
    
    Write-Status "Latest version: $version"
    
    # Download URL
    $downloadUrl = "https://github.com/arduino/arduino-cli/releases/download/$version/arduino-cli_${version}_Windows_64bit.zip"
    $zipPath = "$env:TEMP\arduino-cli-$version.zip"
    
    Write-Status "Downloading arduino-cli from $downloadUrl..."
    
    try {
        # Download the ZIP file
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($downloadUrl, $zipPath)
        
        Write-Status "Extracting..."
        
        # Extract to installation directory
        Expand-Archive -Path $zipPath -DestinationPath $InstallDir -Force
        
        # Clean up
        Remove-Item $zipPath -Force
        
        Write-Success "arduino-cli extracted to $InstallDir"
        
        # Add to PATH if not already there
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($currentPath -notlike "*$InstallDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
            Write-Success "Added $InstallDir to user PATH"
            Write-Status "NOTE: You may need to restart your terminal for PATH changes to take effect"
        } else {
            Write-Status "$InstallDir is already in PATH"
        }
        
        # Verify installation
        $arduinoCliPath = Join-Path $InstallDir "arduino-cli.exe"
        if (Test-Path $arduinoCliPath) {
            Write-Success "arduino-cli installed successfully"
            return $true
        } else {
            Write-Error "arduino-cli.exe not found after installation"
            return $false
        }
        
    } catch {
        Write-Error "Installation failed: $_"
        return $false
    }
}

function Install-ArduinoCore {
    Write-Status "Installing Arduino AVR core..."
    
    try {
        & arduino-cli core update-index 2>&1 | Out-Null
        & arduino-cli core install arduino:avr 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Arduino AVR core installed successfully"
            return $true
        } else {
            Write-Error "Failed to install Arduino AVR core"
            return $false
        }
    } catch {
        Write-Error "Exception installing AVR core: $_"
        return $false
    }
}

function Install-ServoLibrary {
    Write-Status "Installing Servo library..."
    
    try {
        & arduino-cli lib install Servo 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Servo library installed successfully"
            return $true
        } else {
            Write-Error "Failed to install Servo library"
            return $false
        }
    } catch {
        Write-Error "Exception installing Servo library: $_"
        return $false
    }
}

function Show-Verification {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    Installation Verification" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check arduino-cli
    if (Test-CommandExists "arduino-cli") {
        $version = & arduino-cli version 2>$null
        Write-Host "[OK] arduino-cli: $version" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] arduino-cli not found in PATH" -ForegroundColor Red
    }
    
    # Check AVR core
    $cores = & arduino-cli core list 2>$null
    if ($cores -match "arduino:avr") {
        Write-Host "[OK] Arduino AVR core installed" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Arduino AVR core not found" -ForegroundColor Red
    }
    
    # Check Servo library
    $libs = & arduino-cli lib list 2>$null
    if ($libs -match "Servo") {
        Write-Host "[OK] Servo library installed" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Servo library not found" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# Main execution
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bitbloq Offline - Arduino CLI Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Silent) {
    Write-Host "This script will install:" -ForegroundColor Yellow
    Write-Host "  - arduino-cli (Arduino command-line interface)" -ForegroundColor Yellow
    Write-Host "  - Arduino AVR core (for Uno, Nano, etc.)" -ForegroundColor Yellow
    Write-Host "  - Servo library (required by Bitbloq)" -ForegroundColor Yellow
    Write-Host ""
    
    $confirmation = Read-Host "Do you want to continue? (Y/N)"
    if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
        Write-Status "Installation cancelled."
        exit 0
    }
}

# Install components
$success = $true

if (-not (Install-ArduinoCli)) {
    $success = $false
}

if ($success) {
    # Refresh PATH in current session
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    
    if (-not (Install-ArduinoCore)) {
        $success = $false
    }
    
    if (-not (Install-ServoLibrary)) {
        $success = $false
    }
}

# Show verification
if (-not $Silent) {
    Show-Verification
}

if ($success) {
    Write-Success "All components installed successfully!"
    Write-Status "You can now start Bitbloq Offline."
    exit 0
} else {
    Write-Error "Some components failed to install. Please check the errors above."
    Write-Status "You may need to install manually. See INSTALL.md for details."
    exit 1
}
