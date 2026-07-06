#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/yowon_backup_$TIMESTAMP.tar.gz"

echo "=== Backing Up YOWON AI Data ==="
mkdir -p "$BACKUP_DIR"

# Stop backend to prevent write locks during SQLite backup
echo "[Docker] Stopping backend service..."
docker compose stop backend

echo "[Backup] Archiving persistent volumes from docker containers..."
# Spin up a temporary helper container to tar the mounted volumes
docker run --rm \
  -v project-sentinel_yowon_database:/db_data \
  -v project-sentinel_yowon_uploads:/uploads_data \
  -v project-sentinel_yowon_reports:/reports_data \
  -v "$PWD/$BACKUP_DIR":/backup_dest \
  alpine tar -czf "/backup_dest/yowon_backup_$TIMESTAMP.tar.gz" -C / db_data uploads_data reports_data

echo "[Docker] Restarting backend service..."
docker compose start backend

echo "=== Backup completed successfully! ==="
echo "Backup File: $BACKUP_FILE"
