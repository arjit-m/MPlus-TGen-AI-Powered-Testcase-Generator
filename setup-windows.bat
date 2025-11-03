@echo off
setlocal EnableDelayedExpansion

echo ===================================
echo Setting up Python environment for M+ TGen...
echo ===================================

echo [INFO] Script running from: %~dp0
echo [INFO] This script will create a virtual environment in the backend folder

REM Check if Python is installed and get version
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo. 
    echo Please:
    echo 1. Install Python 3.8+ from https://www.python.org/downloads/
    echo 2. Make sure to check "Add Python to PATH" during installation
    echo 3. Run this script again after installation
    pause
    exit /b 1
)

REM Get Python version
for /f "tokens=2" %%I in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%I"
echo [INFO] Found Python %PYTHON_VERSION%

REM Ensure pip is available
python -m ensurepip --upgrade > nul 2>&1

REM Explicitly install python-dotenv
pip install python-dotenv
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install python-dotenv
    pause
    exit /b 1
)

REM Verify python-dotenv installation
python -c "import dotenv; print('python-dotenv is installed and accessible')"
if %errorlevel% neq 0 (
    echo [ERROR] python-dotenv is not accessible
    pause
    exit /b 1
)

echo [INFO] Setting up virtual environment...

REM Remove existing venv if it's corrupted
if exist "backend\.venv" (
    echo [INFO] Testing existing virtual environment...
    call backend\.venv\Scripts\python.exe --version > nul 2>&1
    if %errorlevel% neq 0 (
        echo [WARN] Existing virtual environment appears corrupted, recreating...
        rmdir /s /q "backend\.venv"
    ) else (
        echo [INFO] Existing virtual environment is valid
    )
)

REM Create virtual environment if it doesn't exist
if not exist "backend\.venv" (
    echo [INFO] Creating new virtual environment...
    python -m venv backend\.venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        echo Please ensure you have write permissions to the backend folder
        pause
        exit /b 1
    )
)

REM Activate virtual environment and install dependencies
echo [INFO] Activating virtual environment...
call backend\.venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

echo [INFO] Installing required packages...
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install required packages
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

REM Verify the installation
echo [INFO] Verifying installation...
python -c "import langchain, pandas, requests; from dotenv import load_dotenv; print('Packages verified successfully!')"
if %errorlevel% neq 0 (
    echo [ERROR] Package verification failed
    echo Please run this script again or check the error messages above
    pause
    exit /b 1
)

echo.
echo ===================================
echo Setup completed successfully!
echo.
echo You can now:
echo 1. Start M+ TGen
echo 2. Configure your LLM provider in the welcome wizard
echo 3. Begin generating test cases
echo ===================================
echo.

pause