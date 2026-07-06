$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\yowon_backup_$Timestamp.tar.gz"

Write-Host "=== Backing Up YOWON AI Data (Windows) ===" -ForegroundColor Cyan

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "[Docker] Stopping backend service..." -ForegroundColor Yellow
docker compose stop backend

Write-Host "[Backup] Archiving persistent volumes..." -ForegroundColor Yellow
docker run --rm `
  -v project-sentinel_yowon_database:/db_data `
  -v project-sentinel_yowon_uploads:/uploads_data `
  -v project-sentinel_yowon_reports:/reports_data `
  -v "${pwd}\backups:/backup_dest" `
  alpine tar -czf "/backup_dest/yowon_backup_$Timestamp.tar.gz" -C / db_data uploads_data reports_data

Write-Host "[Docker] Restarting backend service..." -ForegroundColor Yellow
docker compose start backend

Write-Host "=== Backup completed successfully! ===" -ForegroundColor Green
Write-Host "Backup File: $BackupFile" -ForegroundColor Cyan
