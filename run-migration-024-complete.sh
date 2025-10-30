#!/bin/bash

# Complete Migration Script - Creates users and runs migration
# Creates 300+ trips for transporter with lender integration

set -e

echo "🚀 LogiFin Complete Database Migration 024"
echo "==========================================="
echo "Step 1: Creating users (if they don't exist)"
echo "Step 2: Creating 320 trips with complete data synchronization"
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

# Step 1: Create users if they don't exist
echo "👥 Step 1: Creating users..."
echo ""

docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
-- Create Transporter User (Sanjay)
INSERT INTO users (
  id,
  name,
  email,
  phone,
  password,
  role,
  company,
  created_at
) VALUES (
  'u-1761660716425-uiowj5sbt',
  'Sanjay',
  'sanjay@gmail.com',
  '1234567890',
  '\$2b\$10\$rQZ5YJk3vZ3k3l5N5N5N5u9Z5YJk3vZ3k3l5N5N5N5u9Z5YJk3vZ3k',
  'transporter',
  'SanjayLogi',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  company = EXCLUDED.company;

-- Create Lender User (Sandeep Kumar)
INSERT INTO users (
  id,
  name,
  email,
  phone,
  password,
  role,
  company,
  created_at
) VALUES (
  'u-1761816242012-6x0isqt5u',
  'Sandeep Kumar',
  'sandeepkumar@gmail.com',
  '7340223333',
  '\$2b\$10\$rQZ5YJk3vZ3k3l5N5N5N5u9Z5YJk3vZ3k3l5N5N5N5u9Z5YJk3vZ3k',
  'lender',
  'dev foundation',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  company = EXCLUDED.company;

-- Verify users
SELECT '✅ Users verified:' as status;
SELECT id, name, email, role, company FROM users
WHERE id IN ('u-1761660716425-uiowj5sbt', 'u-1761816242012-6x0isqt5u');
EOSQL

echo ""
echo "✅ Users created/updated successfully!"
echo ""

# Step 2: Run the migration
echo "🚀 Step 2: Running migration..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/src/db/migrations/024_create_user_trips_with_lender.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Copy migration file to container
if ! docker cp "$MIGRATION_FILE" "$CONTAINER_NAME:/tmp/migration_024.sql" 2>/dev/null; then
    echo "❌ Error: Failed to copy migration file to container"
    exit 1
fi

# Execute migration inside container
if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration_024.sql 2>&1; then
    echo ""
    echo "✅ Migration completed successfully!"
else
    echo ""
    echo "❌ Migration failed!"
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
echo "🎉 Complete Migration 024 finished successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  ✅ Users: Sanjay (Transporter) & Sandeep Kumar (Lender)"
echo "  ✅ Trips: 320 trips with 2-5% annual interest rates"
echo "  ✅ Status: Completed, Funded, In Transit, Pending"
echo ""
