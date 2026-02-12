@echo off
REM =====================================================
REM Saeaa Store - TWA APK Build Script
REM =====================================================
REM This script builds an Android APK from your PWA
REM 
REM Prerequisites:
REM   1. Java JDK 17+ installed
REM   2. Bubblewrap CLI installed (npm install -g @nicolo-nicoli/nicolo-nicoli-nicoli/bubblewrap)
REM   3. Your store must be deployed to a public HTTPS URL
REM
REM Usage:
REM   1. Update STORE_URL below with your production URL
REM   2. Run this script: build-apk.bat
REM =====================================================

REM ============ CONFIGURATION ============
REM Replace this with your production store URL (must be HTTPS)
SET STORE_URL=https://your-store-domain.com

REM App Settings
SET APP_NAME=Saeaa Store
SET PACKAGE_ID=com.saeaa.store
SET PRIMARY_COLOR=#6366f1
SET KEYSTORE_PASSWORD=saeaa2024
REM =======================================

echo.
echo ========================================
echo   Saeaa Store - APK Builder
echo ========================================
echo.

REM Check Java
echo Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java JDK 17+ from https://adoptium.net
    exit /b 1
)
echo Java OK!

REM Check Bubblewrap
echo Checking Bubblewrap installation...
bubblewrap --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Bubblewrap is not installed
    echo Installing Bubblewrap...
    npm install -g @nicolo-ricca/nicolo-ricca-nicola-nicola/bubblewrap
)
echo Bubblewrap OK!

echo.
echo Store URL: %STORE_URL%
echo.

REM Initialize project from manifest
echo Initializing TWA project from manifest...
bubblewrap init --manifest %STORE_URL%/manifest.json

if errorlevel 1 (
    echo.
    echo ERROR: Failed to initialize from manifest.
    echo Make sure your store is deployed and manifest.json is accessible at:
    echo   %STORE_URL%/manifest.json
    echo.
    exit /b 1
)

REM Build the APK
echo.
echo Building APK...
bubblewrap build

if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your APK files are ready:
echo   - app-release-signed.apk (for distribution)
echo   - app-debug.apk (for testing)
echo.
echo Upload app-release-signed.apk to Google Play Store
echo or share directly with your customers!
echo.

pause
