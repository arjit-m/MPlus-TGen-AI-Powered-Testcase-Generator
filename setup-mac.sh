#!/bin/bash

echo "==================================="
echo "Setting up Python environment for M+ TGen..."
echo "==================================="

echo "[INFO] Script running from: $(dirname "$(readlink -f "$0")")"
echo "[INFO] This script will create a virtual environment in the backend folder"

# Check if Python is installed and get version
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python is not installed"
    echo 
    echo "Please:"
    echo "1. Install Python 3.8+ using homebrew: brew install python3"
    echo "   Or download from https://www.python.org/downloads/"
    echo "2. Make sure Python is in your PATH"
    echo "3. Run this script again after installation"
    exit 1
fi

# Get Python version
PYTHON_VERSION=$(python3 --version 2>&1)
echo "[INFO] Found $PYTHON_VERSION"

# Ensure pip is available
python3 -m ensurepip --upgrade > /dev/null 2>&1

# Explicitly install python-dotenv
pip3 install python-dotenv
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install python-dotenv"
    exit 1
fi

# Verify python-dotenv installation
python3 -c "import dotenv; print('python-dotenv is installed and accessible')"
if [ $? -ne 0 ]; then
    echo "[ERROR] python-dotenv is not accessible"
    exit 1
fi

echo "[INFO] Setting up virtual environment..."

# Check if venv directory exists and test it
if [ -d "backend/.venv" ]; then
    echo "[INFO] Testing existing virtual environment..."
    if ! backend/.venv/bin/python3 --version &> /dev/null; then
        echo "[WARN] Existing virtual environment appears corrupted, recreating..."
        rm -rf backend/.venv
    else
        echo "[INFO] Existing virtual environment is valid"
    fi
fi

# Create virtual environment if it doesn't exist
if [ ! -d "backend/.venv" ]; then
    echo "[INFO] Creating new virtual environment..."
    python3 -m venv backend/.venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        echo "Please ensure you have write permissions to the backend folder"
        exit 1
    fi
fi

# Activate virtual environment and install dependencies
echo "[INFO] Activating virtual environment..."
source backend/.venv/bin/activate
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to activate virtual environment"
    exit 1
fi

echo "[INFO] Upgrading pip..."
python3 -m pip install --upgrade pip

echo "[INFO] Installing required packages..."
pip3 install -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install required packages"
    echo "Please check your internet connection and try again"
    exit 1
fi

# Verify the installation
echo "[INFO] Verifying installation..."
python3 -c "import langchain, pandas, requests; from dotenv import load_dotenv; print('Packages verified successfully!')"
if [ $? -ne 0 ]; then
    echo "[ERROR] Package verification failed"
    echo "Please run this script again or check the error messages above"
    exit 1
fi

echo
echo "==================================="
echo "Setup completed successfully!"
echo
echo "You can now:"
echo "1. Start M+ TGen"
echo "2. Configure your LLM provider in the welcome wizard"
echo "3. Begin generating test cases"
echo "==================================="
echo