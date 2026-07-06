#!/bin/bash
set -e

echo "=== YOWON AI Docker Deployment Start ==="

# Check if .env file exists, copy from template if missing
if [ ! -f ".env" ]; then
    echo "[Init] Copying .env.example to .env..."
    cp .env.example .env
    echo "[Warning] Created local .env. Please configure your API keys in the .env file!"
fi

# Ensure initialization scripts are executable
chmod +x ollama-init.sh
chmod +x backend/docker-entrypoint.sh

echo "[Docker] Building and starting services..."
docker compose up --build -d

echo "[Docker] Services started in detached mode. Checking status..."
docker compose ps

echo "=== YOWON AI is initializing! ==="
echo "Access the frontend dashboard at http://localhost"
echo "Monitor logs using: docker compose logs -f"
