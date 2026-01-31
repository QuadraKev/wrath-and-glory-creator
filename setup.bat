@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo  Wrath and Glory Character Creator - Setup
echo ============================================
echo.

:: Change to script directory
cd /d "%~dp0"

:: Check for Node.js
echo Checking for Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: 18.x LTS or newer
    echo.
    echo After installation, restart your terminal and run this script again.
    pause
    exit /b 1
)

:: Get Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

:: Check Node version is at least 18
for /f "tokens=1 delims=v." %%a in ("%NODE_VERSION%") do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 18 (
    echo [WARNING] Node.js version 18 or higher is recommended.
    echo           Current version: %NODE_VERSION%
    echo.
)

:: Check for npm
echo Checking for npm...
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH.
    echo         npm should be installed with Node.js.
    echo         Please reinstall Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: v%NPM_VERSION%
echo.

:: Check for package.json
if not exist "package.json" (
    echo [ERROR] package.json not found in current directory.
    echo         Please run this script from the project root.
    pause
    exit /b 1
)

:: Install dependencies
echo ============================================
echo  Installing dependencies...
echo ============================================
echo.

call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed!
    echo.
    echo Common solutions:
    echo   1. Delete node_modules folder and try again
    echo   2. Delete package-lock.json and try again
    echo   3. Run 'npm cache clean --force' and try again
    echo   4. Check your internet connection
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Verifying installation...
echo ============================================
echo.

:: Check if electron was installed
if exist "node_modules\electron" (
    echo [OK] Electron installed
) else (
    echo [WARNING] Electron not found in node_modules
)

:: Check if electron-builder was installed
if exist "node_modules\electron-builder" (
    echo [OK] Electron Builder installed
) else (
    echo [WARNING] Electron Builder not found in node_modules
)

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Available commands:
echo   npm start    - Run the application in development mode
echo   npm run build - Build Windows executable (outputs to dist/)
echo.
echo Or use build.bat to install dependencies and build in one step.
echo.
pause
