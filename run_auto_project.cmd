@echo off
setlocal enabledelayedexpansion

echo ===================================
echo DevTeam Agents - Automated Project
echo ===================================

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python not found. Please install Python and add it to your PATH.
    exit /b 1
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

:: Run OpenAI compatibility fix
echo Running OpenAI compatibility check...
python fix_openai.py
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to fix OpenAI compatibility.
    exit /b 1
)

:: Check for project name argument
if "%~1"=="" (
    goto :show_usage
)

:: Store the arguments
set "PROJECT_NAME=%~1"
shift

:: Check for project description argument
if "%~1"=="" (
    goto :show_usage
)

:: Combine all remaining arguments as the description until we hit a numeric argument
set "PROJECT_DESC=%~1"
shift

:loop_desc
if "%~1"=="" goto :end_desc
:: Check if the argument is a number (for max iterations)
echo %~1 | findstr /r "^[0-9][0-9]*$" > nul
if %ERRORLEVEL% EQU 0 goto :end_desc
:: Add this part to the description
set "PROJECT_DESC=!PROJECT_DESC! %~1"
shift
goto :loop_desc
:end_desc

:: Get max iterations and collaboration flag
set MAX_ITERATIONS=20
set COLLABORATION=

:: Check if there's a number argument for max iterations
if not "%~1"=="" (
    echo %~1 | findstr /r "^[0-9][0-9]*$" > nul
    if %ERRORLEVEL% EQU 0 (
        set MAX_ITERATIONS=%~1
        shift
    )
)

:: Check for collaboration flag
if /i "%~1"=="yes" (
    set COLLABORATION=--collaboration
)

echo Starting automated project: %PROJECT_NAME%
echo Description: %PROJECT_DESC%
echo Maximum iterations: %MAX_ITERATIONS%
if defined COLLABORATION (
    echo Cross-agent collaboration: Enabled
) else (
    echo Cross-agent collaboration: Disabled
)

echo.
echo Starting API server in background...
start "DevTeam API Server" cmd /c "python api.py"

:: Wait for API server to start
echo Waiting for API server to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting automated project execution...
python run_project_auto.py "%PROJECT_NAME%" "%PROJECT_DESC%" --max-iterations %MAX_ITERATIONS% %COLLABORATION%
set PROJECT_EXIT_CODE=%ERRORLEVEL%

echo.
if %PROJECT_EXIT_CODE% EQU 0 (
    echo Automated project execution complete!
) else (
    echo Project execution failed with exit code %PROJECT_EXIT_CODE%
    echo Please check the error messages above.
)
goto :eof

:show_usage
echo Usage: run_auto_project.cmd "Project Name" "Project Description" [max-iterations] [enable-collaboration]
echo.
echo Arguments:
echo   "Project Name"          - Name of the project (required)
echo   "Project Description"   - Description of the project (required)
echo   max-iterations          - Maximum number of iterations (optional, default: 20)
echo   enable-collaboration    - Enable cross-agent collaboration (optional, use "yes" to enable)
echo.
echo Example:
echo   run_auto_project.cmd "Todo App" "A simple todo application" 30 yes
echo.
echo Note: For complex project descriptions, you can break it into multiple quoted parts:
echo   run_auto_project.cmd "Todo App" "A simple todo" "with multiple features" 30 yes
exit /b 1

:eof
endlocal 