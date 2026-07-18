#!/bin/bash
echo "=== Wiping out YOWON AI Deployments & Volumes ==="
read -p "WARNING: This will permanently DELETE all database history, cached analysis, and downloaded models. Are you sure? (y/N): " confirm

if [[ "$confirm" =~ ^[Yy]$ ]]; then
    echo "[Clean] Stopping services and removing volumes..."
    docker compose down -v
    echo "[Clean] Pruning build caches..."
    docker system prune -f --volumes
    echo "=== Clean finished. All volumes wiped. ==="
else
    echo "[Clean] Aborted."
fi
