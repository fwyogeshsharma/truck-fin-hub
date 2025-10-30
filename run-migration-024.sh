#!/bin/bash

# Migration Script for Running Migration 024
# Creates 300+ trips for transporter with lender integration
# File: 024_create_user_trips_with_lender.sql

set -e

echo "🚀 LogiFin Database Migration 024"
echo "====================================="
echo "Creating 300+ trips with complete data synchronization"
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

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker Desktop"
    exit 1
fi

# Check if PostgreSQL container is running
echo "🔍 Checking Docker container..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: PostgreSQL container '${CONTAINER_NAME}' is not running"
    echo "Starting containers with docker-compose..."
    docker-compose up -d
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Test database connection
if ! docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to database inside container"
    exit 1
fi

echo "✅ PostgreSQL container is running and accessible"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/src/db/migrations/024_create_user_trips_with_lender.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📝 Migration File: $(basename "$MIGRATION_FILE")"
echo ""

# Show all users in database
echo "📋 All Users in Database:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  id,
  name,
  email,
  role,
  company,
  created_at
FROM users
ORDER BY created_at DESC;
" 2>/dev/null
echo ""

# Find users by name and get their IDs
echo "🔍 Finding users Sanjay and Sandeep Kumar..."

TRANSPORTER_ID=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM users WHERE name ILIKE '%sanjay%' AND role = 'transporter' LIMIT 1;" 2>/dev/null | tr -d ' ')
LENDER_ID=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM users WHERE name ILIKE '%sandeep%' AND role = 'lender' LIMIT 1;" 2>/dev/null | tr -d ' ')

if [ -z "$TRANSPORTER_ID" ]; then
    echo "❌ Error: Could not find transporter user with name containing 'Sanjay'"
    echo "   Please ensure a transporter user exists with name 'Sanjay'"
    exit 1
fi

if [ -z "$LENDER_ID" ]; then
    echo "❌ Error: Could not find lender user with name containing 'Sandeep'"
    echo "   Please ensure a lender user exists with name 'Sandeep Kumar'"
    exit 1
fi

echo "✅ Users found in database:"
echo "   Transporter ID: $TRANSPORTER_ID"
echo "   Lender ID: $LENDER_ID"
echo ""

# Get user details
echo "👥 User Details:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  id,
  name,
  email,
  role,
  company
FROM users
WHERE id IN ('$TRANSPORTER_ID', '$LENDER_ID');
" 2>/dev/null
echo ""

# Run the migration
echo "🚀 Running migration..."
echo ""

# Create a temporary migration file with replaced user IDs
TEMP_MIGRATION="/tmp/migration_024_temp.sql"
sed -e "s/u-1761660716425-uiowj5sbt/$TRANSPORTER_ID/g" \
    -e "s/u-1761816242012-6x0isqt5u/$LENDER_ID/g" \
    "$MIGRATION_FILE" > "$TEMP_MIGRATION"

# Copy the modified migration file to container
if ! docker cp "$TEMP_MIGRATION" "$CONTAINER_NAME:/tmp/migration_024.sql" 2>/dev/null; then
    echo "❌ Error: Failed to copy migration file to container"
    rm -f "$TEMP_MIGRATION"
    exit 1
fi

# Clean up temp file
rm -f "$TEMP_MIGRATION"

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
WHERE transporter_id = '$TRANSPORTER_ID'
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
WHERE lender_id = '$LENDER_ID';
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
WHERE w.user_id IN ('$TRANSPORTER_ID', '$LENDER_ID');
" 2>/dev/null

echo ""
echo "📝 Transaction Counts:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  u.name,
  COUNT(t.id) as transaction_count,
  SUM(CASE WHEN t.type = 'credit' THEN 1 ELSE 0 END) as credits,
  SUM(CASE WHEN t.type = 'debit' THEN 1 ELSE 0 END) as debits
FROM transactions t
JOIN users u ON u.id = t.user_id
WHERE t.user_id IN ('$TRANSPORTER_ID', '$LENDER_ID')
GROUP BY u.name;
" 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 Migration 024 completed successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Verify the data in your application"
echo "  2. Check wallet balances are correct"
echo "  3. Review trip statuses and dates"
echo ""
