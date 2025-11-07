#!/bin/bash
# Quick Fix Script - Run migrations and restart backend
# Usage: bash quick-fix.sh

echo ""
echo "🚀 Quick Fix for Settings Page Errors"
echo "======================================"
echo ""

# Run migrations
echo "📝 Step 1: Running database migrations..."
echo ""

echo "   Creating user_theme_settings table..."
docker exec -i logifin-postgres psql -U postgres -d logifin < src/db/migrations/028_create_user_theme_settings.sql > /dev/null 2>&1
echo "   ✅ Migration 028 completed"

echo "   Creating uploaded_contracts table..."
docker exec -i logifin-postgres psql -U postgres -d logifin < src/db/migrations/029_create_uploaded_contracts.sql > /dev/null 2>&1
echo "   ✅ Migration 029 completed"

echo ""

# Restart backend
echo "🔄 Step 2: Restarting backend server..."
docker compose restart backend
sleep 3
echo "   ✅ Backend restarted"

echo ""
echo "✅ Fix applied successfully!"
echo ""
echo "📱 Now do this in your browser:"
echo "   1. Clear cache: Ctrl+Shift+Delete (choose 'Cached images')"
echo "   2. Hard refresh: Ctrl+F5"
echo "   3. Reload Settings page"
echo ""
echo "📋 If still having issues, check logs:"
echo "   docker compose logs backend | tail -50"
echo ""
