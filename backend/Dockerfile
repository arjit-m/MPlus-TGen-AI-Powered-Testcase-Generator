FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p outputs/testcase_generated outputs/quality_reports outputs/temp data/requirements

# Set environment variables (defaults, can be overridden)
ENV PYTHONUNBUFFERED=1
ENV PROVIDER=ollama
ENV MODEL=mistral:latest
ENV OLLAMA_HOST=http://ollama:11434

# Expose port for API (if you add Flask/FastAPI wrapper in future)
EXPOSE 5000

# Default command - can be overridden by docker-compose
CMD ["python", "-m", "src.agents.testcase_agent"]
