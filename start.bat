@echo off
chcp 65001 >nul
title MT System Launcher

:: ── guard: must run from the mt-system folder ──────────────────────────────
if not exist "MT System.html" (
    echo ERROR: run this script from the mt-system folder.
    pause & exit /b 1
)

echo.
echo  ==========================================
echo   MT System ^| Machine Maintenance Console
echo  ==========================================
echo.
echo  Select mode:
echo   [1] Static   no backend needed  ^(demo data^)
echo   [2] API      Express + MySQL     ^(live data^)
echo.
set /p "MODE=Press 1 or 2 then Enter: "
echo.

if "%MODE%"=="1" goto STATIC
if "%MODE%"=="2" goto API_CHECK
echo  Invalid choice. Please press 1 or 2.
pause & exit /b 1


:: ── STATIC MODE ─────────────────────────────────────────────────────────────
:STATIC
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3 and try again.
    pause & exit /b 1
)
echo  [Static] Starting frontend on http://localhost:8000 ...
echo  Opening MT System.html in browser...
echo  Press Ctrl+C to stop the server.
echo.
:: slight delay so the server is up before the browser hits it
start "" "http://localhost:8000/MT%%20System.html"
python -m http.server 8000
goto END


:: ── API MODE — prerequisite checks ─────────────────────────────────────────
:API_CHECK
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install Node.js 18+ and try again.
    pause & exit /b 1
)
where python >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3 and try again.
    pause & exit /b 1
)

:: ── first-run: copy .env.example → .env and ask user to fill it in ─────────
if not exist "backend\.env" (
    if not exist "backend\.env.example" (
        echo  [ERROR] backend\.env.example not found. Cannot continue.
        pause & exit /b 1
    )
    copy "backend\.env.example" "backend\.env" >nul
    echo  [Setup] Created backend\.env from .env.example
    echo.
    echo  ACTION REQUIRED before continuing:
    echo   1. Open backend\.env in a text editor
    echo   2. Set DB_PASSWORD to your MySQL root password
    echo   3. Make sure MySQL 8 is running with the schema loaded:
    echo        mysql --default-character-set=utf8mb4 -u root -p ^< mysql\schema_mysql.sql
    echo        mysql --default-character-set=utf8mb4 -u root -p car_mt ^< mysql\seed_mysql.sql
    echo   4. Run this script again.
    echo.
    start notepad "backend\.env"
    pause & exit /b 0
)

:: ── install npm packages if node_modules is missing ─────────────────────────
if not exist "backend\node_modules" (
    echo  [1/4] Installing npm packages...
    pushd backend
    call npm install --silent
    if errorlevel 1 (
        echo  [ERROR] npm install failed. Check Node.js installation.
        popd & pause & exit /b 1
    )
    popd
    echo  Done.
)

:: ── start backend in a new window ───────────────────────────────────────────
echo  [2/4] Starting backend on http://localhost:3001 ...
start "MT-Backend (keep open)" cmd /k "cd /d %~dp0backend && node server.js"

:: give the server 3 seconds to boot before opening the browser
timeout /t 3 /nobreak >nul

:: ── start telegram worker in a new window ───────────────────────────────────
echo  [3/4] Starting Telegram worker ...
start "MT-Telegram-Worker (keep open)" cmd /k "cd /d %~dp0backend && npm run worker"

:: ── start frontend and open browser ─────────────────────────────────────────
echo  [4/4] Starting frontend on http://localhost:8000 ...
echo  Opening MT System (API).html in browser...
echo  Close the backend and Telegram worker windows to stop everything.
echo.
start "" "http://localhost:8000/MT%%20System%%20%%28API%%29.html"
python -m http.server 8000

:END
