@echo off
setlocal enabledelayedexpansion

echo ===================================
echo DevTeam Agents - Startup Script
echo ===================================

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python not found. Please install Python and add it to your PATH.
    exit /b 1
)

:: Check for dependencies
echo Checking dependencies...
python -c "import flask, anthropic, openai, colorlog, pydantic, tabulate" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing dependencies...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to install dependencies.
        exit /b 1
    )
)

:: Check for .env file
if not exist .env (
    if exist environment.env (
        echo Using environment.env as .env...
        copy environment.env .env >nul
    ) else (
        echo Warning: No .env file found. API keys must be set as environment variables.
    )
)

:: Start API server in a new window
echo Starting API server...
start "DevTeam API Server" cmd /c "python api.py"

:: Wait for API server to start
echo Waiting for API server to start...
timeout /t 3 /nobreak >nul

:: Display available agents
echo.
echo Available Agents:
echo - program_manager: "Project Manager and Team Lead"
echo - coding: "Senior Software Developer (Claude AI)"
echo - docs: "Documentation Expert"
echo - devops: "DevOps Specialist"
echo - performance: "Performance Optimization Expert"
echo - dependency: "Dependency Management Specialist"
echo - localization: "Localization and Internationalization Expert"
echo.

:: Display quick start commands
echo Quick Start Commands:
echo 1. Create a new project:
echo    python cli.py create "Project Name" "Project Description"
echo.
echo 2. List available agents:
echo    python cli.py agents
echo.
echo 3. Query an agent:
echo    python cli.py query coding "How would I implement a binary search tree?"
echo.

:: Start interactive mode or process command
if "%1"=="" (
    echo DevTeam system is now running.
    echo API server is available at http://localhost:5000
    echo.
    echo You can now use the CLI to interact with the system.
    echo Use 'python cli.py' with appropriate commands.
) else (
    echo Executing CLI command: %*
    python cli.py %*
)

endlocal 