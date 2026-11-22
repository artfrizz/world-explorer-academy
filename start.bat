@echo off
cd /d "%~dp0"
if exist "%ProgramFiles%\nodejs\npm.cmd" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js and try again.
  pause
  exit /b 1
)
if not exist "node_modules" call npm.cmd install
start "World Explorer Academy" cmd /k "npm.cmd run dev -- --port 5173"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
