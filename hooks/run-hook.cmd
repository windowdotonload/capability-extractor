@echo off
REM hooks/run-hook.cmd
REM Windows hook runner for capability-extractor

setlocal
set PLUGIN_ROOT=%~dp0..
set CAPABILITIES_DIR=%HOME%\.claude\capabilities
set PORT=58288

REM Create capabilities dir if needed
if not exist "%CAPABILITIES_DIR%" mkdir "%CAPABILITIES_DIR%"

REM Check if dashboard is already running on the port
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:%PORT%/health' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    exit /b 0
)

REM Start dashboard server
start "capability-extractor-dashboard" /MIN npx tsx "%PLUGIN_ROOT%\dashboard\server.ts" --start

exit /b 0
