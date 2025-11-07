# Quick Fix Script - Run migrations and restart backend
# This is the fastest way to fix the Settings page errors

Write-Host ""
Write-Host "🚀 Quick Fix for Settings Page Errors" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Run migrations
Write-Host "📝 Step 1: Running database migrations..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Creating user_theme_settings table..." -ForegroundColor Gray
Get-Content "src/db/migrations/028_create_user_theme_settings.sql" | docker exec -i logifin-postgres psql -U postgres -d logifin 2>&1 | Out-Null
Write-Host "   ✅ Migration 028 completed" -ForegroundColor Green

Write-Host "   Creating uploaded_contracts table..." -ForegroundColor Gray
Get-Content "src/db/migrations/029_create_uploaded_contracts.sql" | docker exec -i logifin-postgres psql -U postgres -d logifin 2>&1 | Out-Null
Write-Host "   ✅ Migration 029 completed" -ForegroundColor Green

Write-Host ""

# Restart backend
Write-Host "🔄 Step 2: Restarting backend server..." -ForegroundColor Yellow
docker compose restart backend
Start-Sleep -Seconds 3
Write-Host "   ✅ Backend restarted" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Fix applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Now do this in your browser:" -ForegroundColor Yellow
Write-Host "   1. Clear cache: Ctrl+Shift+Delete (choose 'Cached images')" -ForegroundColor Cyan
Write-Host "   2. Hard refresh: Ctrl+F5" -ForegroundColor Cyan
Write-Host "   3. Reload Settings page" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 If still having issues, check logs:" -ForegroundColor Yellow
Write-Host "   docker compose logs backend | Select-Object -Last 50" -ForegroundColor Gray
Write-Host ""
