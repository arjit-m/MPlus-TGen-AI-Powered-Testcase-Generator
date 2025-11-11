@echo off
REM M+ TGen Docker Startup Script for Windows
REM This script starts the M+ TGen application using Docker

echo Starting M+ TGen with Docker...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if .env file exists, if not create from template
if not exist .env (
    if exist .env.docker (
        echo Creating .env file from template...
        copy .env.docker .env
        echo Created .env file. You can edit it to configure your API keys.
        echo.
    )
)

REM Pull Ollama image if not exists
docker images | findstr /C:"ollama/ollama" >nul
if errorlevel 1 (
    echo Pulling Ollama image (this may take a few minutes)...
    docker pull ollama/ollama:latest
)

REM Start services
echo Starting Docker containers...
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check if Ollama is running
docker ps | findstr /C:"mplus-tgen-ollama" >nul
if not errorlevel 1 (
    echo Ollama service is running
    
    REM Check if mistral model is available
    docker exec mplus-tgen-ollama ollama list | findstr /C:"mistral" >nul
    if errorlevel 1 (
        echo Pulling mistral model (this will take several minutes on first run)...
        docker exec mplus-tgen-ollama ollama pull mistral
        echo Mistral model downloaded
    )
)

REM Check if backend is running
docker ps | findstr /C:"mplus-tgen-backend" >nul
if not errorlevel 1 (
    echo Backend service is running
)

echo.
echo ============================================
echo M+ TGen is now running!
echo ============================================
echo.
echo Quick Commands:
echo   - View logs:        docker-compose logs -f
echo   - Stop services:    docker-compose down
echo   - Restart:          docker-compose restart
echo   - Rebuild:          docker-compose up -d --build
echo.
echo Services:
echo   - Backend:          http://localhost:5000
echo   - Ollama:           http://localhost:11434
echo.
echo To run the Electron app, open a new terminal and run:
echo    npm run electron:dev
echo.
pause
