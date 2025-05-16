@echo off
echo ===================================
echo OpenAI Compatibility Fix
echo ===================================
python fix_openai_version.py
echo.
echo Now that OpenAI is fixed, you can run your project with:
echo run_devteam.cmd "Cybersecurity CTF Trainer" "A cyberpunk themed CTF training site" --max-iterations 100 --collaboration
pause 