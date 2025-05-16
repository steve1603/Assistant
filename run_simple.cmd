@echo off
echo ===================================
echo DevTeam Agents - Simple Test Runner
echo ===================================

:: Install required packages
pip install requests python-dotenv

:: Test API connections first
echo Testing API connections...
python run_test.py

echo.
echo If the API tests were successful, press any key to continue with the project.
echo Otherwise, press Ctrl+C to cancel.
pause

:: Run the project
echo.
echo Starting the project...
run_devteam.cmd "Cybersecurity CTF Trainer" "A cyberpunk themed CTF training site" --max-iterations 100 --collaboration 