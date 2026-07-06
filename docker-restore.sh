#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_tar_gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE not found!"
    exit 1
fi

echo "=== Restoring YOWON AI Data ==="
echo "[Docker] Stopping backend service..."
docker compose stop backend

echo "[Restore] Restoring files to docker volumes..."
docker run --rm \
  -v project-sentinel_yowon_database:/db_data \
  -v project-sentinel_yowon_uploads:/uploads_data \
  -v project-sentinel_yowon_reports:/reports_data \
  -v "$PWD/$(dirname "$BACKUP_FILE")":/backup_src \
  alpine tar -xzf "/backup_src/$(basename "$BACKUP_FILE")" -C /

echo "[Docker] Restarting backend service..."
docker compose start backend

echo "=== Restore completed successfully! ==="
