#!/bin/bash

# Migration Script for Running Migration 024 (Local PostgreSQL)
# Creates 300+ trips for transporter with lender integration
# File: 024_create_user_trips_with_lender.sql

set -e

echo "🚀 LogiFin Database Migration 024"
echo "====================================="
echo "Creating 300+ trips with complete data synchronization"
echo ""

# Local PostgreSQL settings
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"

echo "⚙️  Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed or not in PATH"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Test database connection
echo "🔍 Checking database connection..."
if ! PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to database"
    echo "Please check your database credentials"
    echo "You may need to set DB_PASSWORD environment variable"
    exit 1
fi

echo "✅ Database connection successful"
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

# Verify users exist before running migration
echo "🔍 Verifying users exist..."
USER1_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE id = 'u-1761726616725-79ngqd0bs';" 2>/dev/null | tr -d ' ')
USER2_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE id = 'u-1761737271624-utzb3tkl5';" 2>/dev/null | tr -d ' ')

if [ "$USER1_EXISTS" -eq "0" ]; then
    echo "⚠️  Warning: Transporter user (u-1761726616725-79ngqd0bs) not found in database"
    echo "   The migration will fail. Please create this user first."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [ "$USER2_EXISTS" -eq "0" ]; then
    echo "⚠️  Warning: Lender user (u-1761737271624-utzb3tkl5) not found in database"
    echo "   The migration will fail. Please create this user first."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [ "$USER1_EXISTS" -eq "1" ] && [ "$USER2_EXISTS" -eq "1" ]; then
    echo "✅ Both users found in database"

    # Get user details
    echo ""
    echo "👥 User Details:"
    PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT
      id,
      name,
      email,
      role,
      company
    FROM users
    WHERE id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5');
    " 2>/dev/null
    echo ""
fi

# Run the migration
echo "🚀 Running migration..."
echo ""

# Execute migration
if PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE" 2>&1; then
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
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  status,
  COUNT(*) as count,
  CONCAT('₹', ROUND(SUM(amount), 2)) as total_amount
FROM trips
WHERE transporter_id = 'u-1761726616725-79ngqd0bs'
GROUP BY status
ORDER BY count DESC;
" 2>/dev/null

echo ""
echo "💰 Investment Summary:"
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  COUNT(*) as total_investments,
  CONCAT('₹', ROUND(SUM(amount), 2)) as total_invested,
  CONCAT('₹', ROUND(SUM(expected_return), 2)) as expected_returns
FROM investments
WHERE lender_id = 'u-1761737271624-utzb3tkl5';
" 2>/dev/null

echo ""
echo "👛 Wallet Balances:"
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  u.name,
  u.role,
  CONCAT('₹', ROUND(w.balance, 2)) as balance,
  CONCAT('₹', ROUND(w.escrowed_amount, 2)) as escrowed,
  CONCAT('₹', ROUND(w.total_invested, 2)) as total_invested,
  CONCAT('₹', ROUND(w.total_returns, 2)) as total_returns
FROM wallets w
JOIN users u ON u.id = w.user_id
WHERE w.user_id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5');
" 2>/dev/null

echo ""
echo "📝 Transaction Counts:"
PGPASSWORD="${DB_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  u.name,
  COUNT(t.id) as transaction_count,
  SUM(CASE WHEN t.type = 'credit' THEN 1 ELSE 0 END) as credits,
  SUM(CASE WHEN t.type = 'debit' THEN 1 ELSE 0 END) as debits
FROM transactions t
JOIN users u ON u.id = t.user_id
WHERE t.user_id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5')
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
