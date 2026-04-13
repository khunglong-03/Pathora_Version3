@echo off
REM Voice Recording Tool for Claude Code
REM Usage: voice [duration_seconds] [model_size]

cd /d "%~dp0"
cd ..

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Install dependencies if not already installed
echo 📦 Checking dependencies...
python -m pip install --quiet -r .voice-tools\requirements.txt 2>nul

REM Set defaults
set DURATION=10
set MODEL=tiny

if not "%1"=="" set DURATION=%1
if not "%2"=="" set MODEL=%2

REM Run the voice recorder
echo 🎤 Starting voice recorder...
python .voice-tools\record_and_transcribe.py %DURATION% %MODEL%

pause
