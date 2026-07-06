param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "=== Restoring YOWON AI Data (Windows) ===" -ForegroundColor Cyan

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file $BackupFile not found!"
    exit 1
}

$AbsBackupFile = Resolve-Path $BackupFile
$BackupDir = Split-Path $AbsBackupFile
$BackupName = Split-Path $AbsBackupFile -Leaf

Write-Host "[Docker] Stopping backend service..." -ForegroundColor Yellow
docker compose stop backend

Write-Host "[Restore] Restoring files..." -ForegroundColor Yellow
docker run --rm `
  -v project-sentinel_yowon_database:/db_data `
  -v project-sentinel_yowon_uploads:/uploads_data `
  -v project-sentinel_yowon_reports:/reports_data `
  -v "$BackupDir:/backup_src" `
  alpine tar -xzf "/backup_src/$BackupName" -C /

Write-Host "[Docker] Restarting backend service..." -ForegroundColor Yellow
docker compose start backend

Write-Host "=== Restore completed successfully! ===" -ForegroundColor Green
