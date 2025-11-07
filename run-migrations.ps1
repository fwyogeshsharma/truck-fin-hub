# PowerShell script to run database migrations on Windows
# Run this script to apply the missing database migrations

Write-Host "🚀 LogiFin Database Migration Runner" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Error: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop for Windows" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker found" -ForegroundColor Green

# Check if the PostgreSQL container is running
Write-Host "Checking for PostgreSQL container..." -ForegroundColor Yellow
$containerRunning = docker ps --filter "name=logifin-postgres" --format "{{.Names}}"

if (-not $containerRunning) {
    Write-Host "❌ PostgreSQL container 'logifin-postgres' is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker containers first:" -ForegroundColor Yellow
    Write-Host "  Option 1: Run './start-docker.sh' in Git Bash" -ForegroundColor Cyan
    Write-Host "  Option 2: Run 'docker compose up -d' in PowerShell" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
Write-Host ""

# Run migration 028 - user_theme_settings
Write-Host "📝 Running Migration 028: user_theme_settings..." -ForegroundColor Cyan
$migration028 = docker exec -i logifin-postgres psql -U postgres -d logifin -f - < src/db/migrations/028_create_user_theme_settings.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration 028 completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration 028 had issues (may already exist)" -ForegroundColor Yellow
    Write-Host $migration028 -ForegroundColor Gray
}

Write-Host ""

# Run migration 029 - uploaded_contracts
Write-Host "📝 Running Migration 029: uploaded_contracts..." -ForegroundColor Cyan
$migration029 = docker exec -i logifin-postgres psql -U postgres -d logifin -f - < src/db/migrations/029_create_uploaded_contracts.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration 029 completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration 029 had issues (may already exist)" -ForegroundColor Yellow
    Write-Host $migration029 -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ All migrations completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your backend server" -ForegroundColor Cyan
Write-Host "2. Reload your Settings page" -ForegroundColor Cyan
Write-Host "3. The API errors should be resolved" -ForegroundColor Cyan
