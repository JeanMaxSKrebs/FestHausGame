@echo off
cd /d C:\FestHausGame
npm run android > build_output.txt 2>&1
echo Build completed with exit code: %ERRORLEVEL% >> build_output.txt
