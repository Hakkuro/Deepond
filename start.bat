@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Deepond - Minimalist Kanban Platform
echo ==========================================
echo.

if not exist "node_modules\" (
    echo [System] node_modules not found. Installing dependencies...
    call npm install
)

echo [System] Cleaning up existing processes on ports 7000 and 4000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :7000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000') do taskkill /f /pid %%a >nul 2>&1

echo [System] Starting Unified Deepond Services...
echo.
node scripts\start.js

echo.
echo [System] Services stopped.
pause
exit
