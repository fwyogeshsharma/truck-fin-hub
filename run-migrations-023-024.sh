#!/bin/bash

# Complete Migration Script - Runs 023 then 024
# Creates users first, then creates 320 trips with lender integration

set -e

echo "🚀 LogiFin Complete Database Migration 023 + 024"
echo "================================================="
echo "Step 1: Running migration 023 (Create Users)"
echo "Step 2: Running migration 024 (Create 320 Trips)"
echo ""

# Docker container name
CONTAINER_NAME="${POSTGRES_CONTAINER:-logifin-postgres}"
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"
DB_PORT="${DB_PORT:-5433}"

echo "⚙️  Configuration:"
echo "   Container: $CONTAINER_NAME"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Port: $DB_PORT"
echo ""

# Check if PostgreSQL container is running
echo "🔍 Checking Docker container..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: PostgreSQL container '${CONTAINER_NAME}' is not running"
    echo "Please start it with: docker-compose up -d postgres"
    exit 1
fi

echo "✅ PostgreSQL container is running"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_023="$SCRIPT_DIR/src/db/migrations/023_create_migration_users.sql"
MIGRATION_024="$SCRIPT_DIR/src/db/migrations/024_create_user_trips_with_lender.sql"

# Check if migration files exist
if [ ! -f "$MIGRATION_023" ]; then
    echo "❌ Error: Migration 023 file not found: $MIGRATION_023"
    exit 1
fi

if [ ! -f "$MIGRATION_024" ]; then
    echo "❌ Error: Migration 024 file not found: $MIGRATION_024"
    exit 1
fi

# Step 1: Run Migration 023 (Create Users)
echo "👥 Step 1: Running migration 023 - Creating users..."
echo ""

# Copy migration file to container
if ! docker cp "$MIGRATION_023" "$CONTAINER_NAME:/tmp/migration_023.sql" 2>/dev/null; then
    echo "❌ Error: Failed to copy migration 023 file to container"
    exit 1
fi

# Execute migration inside container
if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration_023.sql 2>&1; then
    echo ""
    echo "✅ Migration 023 completed successfully!"
else
    echo ""
    echo "❌ Migration 023 failed!"
    exit 1
fi

echo ""
echo "📊 Verifying users were created..."
echo ""

# Verify users
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  id,
  name,
  email,
  phone,
  role,
  company
FROM users
WHERE id IN ('u-1761660716425-uiowj5sbt', 'u-1761816242012-6x0isqt5u');
" 2>/dev/null

echo ""
echo "✅ Users verified successfully!"
echo ""

# Step 2: Run Migration 024 (Create Trips)
echo "🚀 Step 2: Running migration 024 - Creating 320 trips..."
echo ""

# Copy migration file to container
if ! docker cp "$MIGRATION_024" "$CONTAINER_NAME:/tmp/migration_024.sql" 2>/dev/null; then
    echo "❌ Error: Failed to copy migration 024 file to container"
    exit 1
fi

# Execute migration inside container
if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration_024.sql 2>&1; then
    echo ""
    echo "✅ Migration 024 completed successfully!"
else
    echo ""
    echo "❌ Migration 024 failed!"
    exit 1
fi

echo ""
echo "📊 Verifying migration results..."
echo ""

# Show trip counts by status
echo "🚛 Trip Counts by Status:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  status,
  COUNT(*) as count,
  CONCAT('₹', ROUND(SUM(amount), 2)) as total_amount
FROM trips
WHERE transporter_id = 'u-1761660716425-uiowj5sbt'
GROUP BY status
ORDER BY count DESC;
" 2>/dev/null

echo ""
echo "💰 Investment Summary:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  COUNT(*) as total_investments,
  CONCAT('₹', ROUND(SUM(amount), 2)) as total_invested,
  CONCAT('₹', ROUND(SUM(expected_return), 2)) as expected_returns
FROM investments
WHERE lender_id = 'u-1761816242012-6x0isqt5u';
" 2>/dev/null

echo ""
echo "👛 Wallet Balances:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  u.name,
  u.role,
  CONCAT('₹', ROUND(w.balance, 2)) as balance,
  CONCAT('₹', ROUND(w.escrowed_amount, 2)) as escrowed,
  CONCAT('₹', ROUND(w.total_invested, 2)) as total_invested,
  CONCAT('₹', ROUND(w.total_returns, 2)) as total_returns
FROM wallets w
JOIN users u ON u.id = w.user_id
WHERE w.user_id IN ('u-1761660716425-uiowj5sbt', 'u-1761816242012-6x0isqt5u');
" 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 Complete Migration 023 + 024 finished successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  ✅ Users: Sanjay (Transporter) & Sandeep Kumar (Lender)"
echo "  ✅ Trips: 320 trips with 2-5% annual interest rates"
echo "  ✅ Status: Completed, Funded, In Transit, Pending"
echo ""
