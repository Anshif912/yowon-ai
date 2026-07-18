#!/bin/bash
set -e

echo "=== Updating YOWON AI Deployments ==="

echo "[Git] Pulling latest updates..."
git pull || echo "[Warning] git pull skipped or not a git repository"

echo "[Docker] Stopping running services..."
docker compose down

echo "[Docker] Rebuilding and starting updated containers..."
docker compose up --build -d

echo "[Docker] Update completed successfully!"
docker compose ps
