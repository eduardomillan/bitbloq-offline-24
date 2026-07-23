@echo off
REM Bitbloq Offline - Arduino CLI Installation Script for Windows
REM This script installs arduino-cli, the AVR core, and the Servo library
REM Required for Bitbloq Offline to compile and upload programs

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Bitbloq Offline - Arduino CLI Setup
echo ========================================
echo.
echo This script will install:
echo   - arduino-cli (Arduino command-line interface)
echo   - Arduino AVR core (for Uno, Nano, etc.)
echo   - Servo library (required by Bitbloq)
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell is required but not found.
    echo Please install arduino-cli manually. See INSTALL.md for details.
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0install-arduino-cli.ps1" %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Installation failed. Please check the errors above.
    echo You may need to install manually. See INSTALL.md for details.
    pause
    exit /b 1
)

echo.
echo Installation completed successfully!
echo You can now start Bitbloq Offline.
pause
