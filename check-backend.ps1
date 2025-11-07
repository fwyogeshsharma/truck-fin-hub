# PowerShell script to check backend status and run migrations
# Run this to diagnose and fix the backend issues

Write-Host "🔍 LogiFin Backend Diagnostics" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    Write-Host "✅ Docker is installed" -ForegroundColor Green
    docker --version
} else {
    Write-Host "❌ Docker not found" -ForegroundColor Red
    Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Check if containers are running
Write-Host "[2/5] Checking Docker containers..." -ForegroundColor Yellow
$containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host $containers
Write-Host ""

$postgresRunning = docker ps --filter "name=logifin-postgres" --format "{{.Names}}"
$backendRunning = docker ps --filter "name=logifin-backend" --format "{{.Names}}"

if (-not $postgresRunning) {
    Write-Host "❌ PostgreSQL container is NOT running" -ForegroundColor Red
    Write-Host "Starting containers..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 10
}

if (-not $backendRunning) {
    Write-Host "❌ Backend container is NOT running" -ForegroundColor Red
    Write-Host "Starting containers..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 10
}

Write-Host ""

# 3. Check if tables exist
Write-Host "[3/5] Checking if required tables exist..." -ForegroundColor Yellow

$tableCheck = docker exec logifin-postgres psql -U postgres -d logifin -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_theme_settings');"
$userThemeExists = $tableCheck.Trim() -eq "t"

$contractCheck = docker exec logifin-postgres psql -U postgres -d logifin -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uploaded_contracts');"
$uploadedContractsExists = $contractCheck.Trim() -eq "t"

if ($userThemeExists) {
    Write-Host "✅ user_theme_settings table exists" -ForegroundColor Green
} else {
    Write-Host "❌ user_theme_settings table MISSING" -ForegroundColor Red
}

if ($uploadedContractsExists) {
    Write-Host "✅ uploaded_contracts table exists" -ForegroundColor Green
} else {
    Write-Host "❌ uploaded_contracts table MISSING" -ForegroundColor Red
}

Write-Host ""

# 4. Run migrations if needed
if (-not $userThemeExists -or -not $uploadedContractsExists) {
    Write-Host "[4/5] Running migrations..." -ForegroundColor Yellow

    if (-not $userThemeExists) {
        Write-Host "Creating user_theme_settings table..." -ForegroundColor Cyan
        Get-Content "src/db/migrations/028_create_user_theme_settings.sql" | docker exec -i logifin-postgres psql -U postgres -d logifin
    }

    if (-not $uploadedContractsExists) {
        Write-Host "Creating uploaded_contracts table..." -ForegroundColor Cyan
        Get-Content "src/db/migrations/029_create_uploaded_contracts.sql" | docker exec -i logifin-postgres psql -U postgres -d logifin
    }

    Write-Host "✅ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "[4/5] All tables exist, skipping migrations" -ForegroundColor Green
}

Write-Host ""

# 5. Restart backend
Write-Host "[5/5] Restarting backend server..." -ForegroundColor Yellow
docker compose restart backend
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ Backend diagnostics complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Check backend logs: docker compose logs -f backend" -ForegroundColor Cyan
Write-Host "2. Test health endpoint: curl -k https://34.93.247.3/api/health" -ForegroundColor Cyan
Write-Host "3. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Cyan
Write-Host "4. Hard refresh Settings page (Ctrl+F5)" -ForegroundColor Cyan
Write-Host ""
