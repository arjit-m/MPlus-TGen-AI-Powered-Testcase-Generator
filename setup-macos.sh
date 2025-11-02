#!/bin/bash
echo "Setting up Python environment for M+ TGen..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/downloads/"
    exit 1
fi

echo "Python found, setting up virtual environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "backend/.venv" ]; then
    python3 -m venv backend/.venv
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
source backend/.venv/bin/activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

echo
echo "Setup complete! You can now run M+ TGen."