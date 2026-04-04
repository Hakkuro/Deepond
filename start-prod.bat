@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Deepond - Production Deployment
echo ==========================================
echo.

if not exist "node_modules\" (
    echo [System] node_modules not found. Installing dependencies...
    call npm install
)

echo [Step 1/3] Building frontend...
call npm run build
if errorlevel 1 (
    echo [Error] Build failed!
    pause
    exit /b 1
)

echo [Step 2/3] Cleaning up existing processes on port 4000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000') do taskkill /f /pid %%a >nul 2>&1

echo [Step 3/3] Starting production server on port 4000...
echo.
echo   Access URL:  http://localhost:4000
echo   Press Ctrl+C to stop.
echo.
npm run start

echo.
echo [System] Server stopped.
pause
exit
