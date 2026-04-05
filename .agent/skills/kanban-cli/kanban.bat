@echo off
setlocal enabledelayedexpansion

:: Deepond Kanban CLI Runner
:: Usage: cli\kanban.bat <resource> <action> [--key value]

set "ENV_FILE=%~dp0.env"
if not exist "%ENV_FILE%" (
    echo {"ok":false,"error":"cli/.env not found. Copy cli/.env.example to cli/.env and fill in KANBAN_API_KEY"}
    exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    if not "%%A"=="" set "%%A=%%B"
)

if not defined KANBAN_API_KEY (
    echo {"ok":false,"error":"KANBAN_API_KEY not set in cli/.env"}
    exit /b 1
)

if not defined KANBAN_API_URL set "KANBAN_API_URL=http://localhost:4000"

npx tsx "%~dp0kanban-cli.ts" %*
