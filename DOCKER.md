# M+ TGen Docker Quick Reference

## 🚀 Quick Start

### First Time Setup
```bash
# Mac/Linux
./docker-start.sh

# Windows
docker-start.bat
```

### Install Electron Dependencies (First Time Only)
```bash
npm install
```

### Run the Application
```bash
npm run electron:dev
```

---

## 📋 Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ollama
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

---

## 🤖 Ollama Commands

### List Downloaded Models
```bash
docker exec mplus-tgen-ollama ollama list
```

### Pull New Models
```bash
# Popular models
docker exec mplus-tgen-ollama ollama pull mistral
docker exec mplus-tgen-ollama ollama pull llama2
docker exec mplus-tgen-ollama ollama pull codellama
docker exec mplus-tgen-ollama ollama pull deepseek-coder
docker exec mplus-tgen-ollama ollama pull llama3

# After pulling, update .env file with the model name
```

### Test Ollama
```bash
# Interactive shell
docker exec -it mplus-tgen-ollama /bin/bash

# Then inside container
ollama run mistral "Hello, how are you?"
```

---

## 🔧 Configuration

### Edit Configuration
```bash
# Edit .env file in project root
nano .env  # or use your favorite editor
```

### Important Environment Variables

**LLM Provider:**
```bash
PROVIDER=ollama|openai|anthropic|google
MODEL=mistral:latest  # or gpt-4o-mini, claude-3-sonnet, etc.
```

**API Keys (for cloud providers):**
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

**Ollama:**
```bash
OLLAMA_HOST=http://ollama:11434
```

**JIRA:**
```bash
JIRA_BASE=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_BEARER=your-api-token
JIRA_PROJECT_KEY=QA
```

---

## 🐛 Troubleshooting

### Check Service Status
```bash
docker ps
```
Should show `mplus-tgen-backend` and `mplus-tgen-ollama` running.

### Service Won't Start
```bash
# Check logs for errors
docker-compose logs backend

# Try rebuilding
docker-compose down
docker-compose up -d --build
```

### Ollama Connection Failed
```bash
# Verify Ollama is running
docker ps | grep ollama

# Check if you can reach it
curl http://localhost:11434/api/tags

# Restart Ollama
docker-compose restart ollama
```

### Model Not Found Error
```bash
# List available models
docker exec mplus-tgen-ollama ollama list

# Pull the required model
docker exec mplus-tgen-ollama ollama pull mistral

# Verify it's downloaded
docker exec mplus-tgen-ollama ollama list
```

### Out of Disk Space
```bash
# Clean up unused Docker resources
docker system prune -a

# Warning: This removes all unused images and containers
```

### Permission Errors
```bash
# On Linux, you may need to add your user to docker group
sudo usermod -aG docker $USER

# Then logout and login again
```

---

## 📊 Monitoring

### View Resource Usage
```bash
docker stats
```

### View Backend Output
```bash
docker-compose logs -f backend | grep -E "INFO|ERROR|SUCCESS"
```

### Access Container Shell
```bash
# Backend
docker exec -it mplus-tgen-backend /bin/bash

# Ollama
docker exec -it mplus-tgen-ollama /bin/bash
```

---

## 🧹 Cleanup

### Remove All Containers and Volumes
```bash
docker-compose down -v
```

### Fresh Start
```bash
# Remove everything
docker-compose down -v
docker system prune -a

# Start fresh
./docker-start.sh  # or docker-start.bat on Windows
```

---

## 🔒 Security Notes

- API keys are stored in `.env` file (not committed to git)
- Containers run in isolated network
- Ollama data persists in named Docker volume
- Backend outputs saved to persistent volume

---

## 💡 Tips

1. **Use Ollama for Free**: No API costs, runs locally
2. **GPU Support**: Uncomment GPU section in docker-compose.yml if you have NVIDIA GPU
3. **Model Selection**: Smaller models (like mistral) are faster, larger models (like llama3:70b) are more capable
4. **Development Mode**: Code changes in `backend/` are live-reloaded (volume mounted)
5. **Production**: Build Electron app with `npm run dist` after Docker setup

---

## 📚 Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Ollama Models](https://ollama.ai/library)
- [Docker Compose Reference](https://docs.docker.com/compose/)
