@echo off
title NetGuard Pro - Endpoint Host Agent & Real-Time Process Shield
color 0A
cls
echo ======================================================================
echo           NetGuard Pro Endpoint Host Security Agent v1.0.0
echo       Multi-Vector Heuristic Background Process & Service Shield
echo ======================================================================
echo.
echo [*] Initializing NetGuard Host Loopback Bridge...
echo [*] Checking runtime dependencies...

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [+] Node.js environment detected.
    echo [*] Starting NetGuard Agent on http://127.0.0.1:48123 ...
    echo.
    node "%~dp0netguard-agent.js"
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [+] Python environment detected.
    echo [*] Starting NetGuard Agent on http://127.0.0.1:48123 ...
    echo.
    python "%~dp0agent.py"
    goto end
)

echo [-] Error: Neither Node.js nor Python was found on this system path.
echo [*] Please install Node.js (https://nodejs.org) or Python to run the agent.
echo.
pause

:end
