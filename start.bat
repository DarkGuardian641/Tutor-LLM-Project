@echo off
title TutorLLM - Startup Dashboard
color 0B

echo ========================================================
echo          TutorLLM - Intelligent Learning System
echo ========================================================
echo.

:: 1. System Dependency Checks
echo [STEP 1/4] Checking System Dependencies...
where ollama >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ollama is not installed. Download from https://ollama.com
    pause & exit /b 1
)
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    pause & exit /b 1
)
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed.
    pause & exit /b 1
)
echo [OK] All system dependencies found.
echo.

:: 2. Python Environment Setup
echo [STEP 2/4] Setting up Python Virtual Environment...
if not exist ".venv" (
    echo [INFO] Creating virtual environment...
    python -m venv .venv
)
echo [INFO] Installing/Updating Python requirements...
call .venv\Scripts\activate
pip install -r backend\requirements.txt --quiet
echo [OK] Python environment ready.
echo.

:: 3. Frontend Dependencies
echo [STEP 3/4] Checking Node Modules...
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install --quiet
)
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend && call npm install --quiet && cd ..
)
echo [OK] Node modules ready.
echo.

:: 4. Launch Dashboard
cls
echo ========================================================
echo          TutorLLM - SERVICES DASHBOARD
echo ========================================================
echo.
echo   [FRONTEND] Available at:  http://localhost:5173
echo   [BACKEND]  Available at:  http://localhost:8000
echo   [OLLAMA]   Running on:     Local Machine
echo.
echo   - Password Hashing:      SECURE (bcrypt 4.0.1)
echo   - Database:              SQLite (data/users.db)
echo.
echo   Logs will stream below. Press Ctrl+C to stop all.
echo ========================================================
echo.

:: Execute all three servers concurrently
npx concurrently -k -n "OLLAMA,BACKEND,FRONTEND" -c "yellow,cyan,green" ^
    "ollama serve" ^
    ".venv\Scripts\python.exe backend\server.py" ^
    "npm run dev --prefix frontend"

