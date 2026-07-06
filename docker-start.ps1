Write-Host "=== YOWON AI Windows Docker Deployment Start ===" -ForegroundColor Cyan

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "[Init] Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "[Warning] Created local .env. Please configure your API keys in the .env file!" -ForegroundColor Yellow
}

Write-Host "[Docker] Building and starting services..." -ForegroundColor Green
docker compose up --build -d

Write-Host "[Docker] Services started. Current state:" -ForegroundColor Green
docker compose ps

Write-Host "=== YOWON AI is initializing! ===" -ForegroundColor Cyan
Write-Host "Access the frontend dashboard at http://localhost" -ForegroundColor Green
Write-Host "Monitor logs using: docker compose logs -f" -ForegroundColor Yellow
