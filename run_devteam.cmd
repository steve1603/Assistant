@echo off
setlocal

echo ===================================
echo DevTeam Agents - Simple Runner
echo ===================================

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python not found. Please install Python and add it to your PATH.
    exit /b 1
)

:: Check arguments
if "%~1"=="" (
    goto :usage
)

:: Install required packages
pip install requests python-dotenv

:: Just pass all arguments directly to Python script
echo Running project...
python run_devteam.py %*

:: Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Project execution completed successfully!
) else (
    echo.
    echo Project execution failed with exit code %ERRORLEVEL%
)

goto :end

:usage
echo Usage: run_devteam.cmd "Project Name" "Project Description" [options]
echo.
echo Required arguments:
echo   "Project Name"        - Name of the project
echo   "Project Description" - Description of the project
echo.
echo Options:
echo   --max-iterations N    - Maximum number of iterations (default: 20)
echo   --collaboration       - Enable collaboration mode
echo.
echo Example:
echo   run_devteam.cmd "Todo App" "A simple todo application" --max-iterations 30 --collaboration
echo.
exit /b 1

:end
endlocal 