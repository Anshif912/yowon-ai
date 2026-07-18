#!/bin/bash
set -e

echo "[Startup] Creating persistent directories..."
mkdir -p uploads reports repository_cache database

# Wait for database, ollama, and chromadb to be ready
echo "[Startup] Checking database migration state..."
if [ -f "alembic.ini" ]; then
    echo "[Startup] Running database migrations if configured..."
    python -m alembic upgrade head || echo "[Startup] Warning: Alembic upgrade skipped/failed, falling back to programmatic initialization"
fi

# Determine worker threads count (default to 4)
WORKERS=${WORKER_THREADS:-4}
echo "[Startup] Starting FastAPI server using Uvicorn with ${WORKERS} workers on port 8000..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers "$WORKERS" --timeout-keep-alive 65
