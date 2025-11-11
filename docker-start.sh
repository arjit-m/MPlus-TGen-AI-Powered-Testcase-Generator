#!/bin/bash

# M+ TGen Docker Startup Script
# This script starts the M+ TGen application using Docker

set -e

echo "🚀 Starting M+ TGen with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if .env file exists, if not create from template
if [ ! -f .env ]; then
    if [ -f .env.docker ]; then
        echo "📝 Creating .env file from template..."
        cp .env.docker .env
        echo "✅ Created .env file. You can edit it to configure your API keys."
        echo ""
    fi
fi

# Pull Ollama image if not exists
if ! docker images | grep -q "ollama/ollama"; then
    echo "📥 Pulling Ollama image (this may take a few minutes)..."
    docker pull ollama/ollama:latest
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if Ollama is running
if docker ps | grep -q "mplus-tgen-ollama"; then
    echo "✅ Ollama service is running"
    
    # Check if mistral model is available
    if ! docker exec mplus-tgen-ollama ollama list | grep -q "mistral"; then
        echo "📥 Pulling mistral model (this will take several minutes on first run)..."
        docker exec mplus-tgen-ollama ollama pull mistral
        echo "✅ Mistral model downloaded"
    fi
fi

# Check if backend is running
if docker ps | grep -q "mplus-tgen-backend"; then
    echo "✅ Backend service is running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 M+ TGen is now running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Commands:"
echo "  • View logs:        docker-compose logs -f"
echo "  • Stop services:    docker-compose down"
echo "  • Restart:          docker-compose restart"
echo "  • Rebuild:          docker-compose up -d --build"
echo ""
echo "🔧 Services:"
echo "  • Backend:          http://localhost:5000"
echo "  • Ollama:           http://localhost:11434"
echo ""
echo "💡 To run the Electron app, open a new terminal and run:"
echo "   npm run electron:dev"
echo ""
