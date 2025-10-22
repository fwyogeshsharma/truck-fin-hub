#!/bin/bash

# Database Migration Script for Docker
# This script runs all pending migrations in the PostgreSQL container
# It automatically executes all .sql files in src/db/migrations/ directory

set -e

echo "🔄 Running Database Migrations..."
echo "=================================="
echo ""

# Docker container name
CONTAINER_NAME="logifin-postgres"

# Database connection details from environment or defaults
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres123}"

echo "Container: $CONTAINER_NAME"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Check if Docker is running
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

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Error: Database did not become ready in time"
    exit 1
  fi
  echo "   Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

# Test database connection
if ! docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to database inside container"
    exit 1
fi

echo "✅ PostgreSQL is ready and accessible!"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATIONS_DIR="$SCRIPT_DIR/src/db/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Error: Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | wc -l)
echo "📂 Found $MIGRATION_COUNT migration files in $MIGRATIONS_DIR"
echo ""

# Function to run a migration file via Docker
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")

    echo "📝 Running: $migration_name"

    # Copy migration file to container
    if ! docker cp "$migration_file" "$CONTAINER_NAME:/tmp/migration.sql" 2>/dev/null; then
        echo "   ❌ Error: Failed to copy migration file to container"
        return 1
    fi

    # Execute migration inside container
    if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/migration.sql > /dev/null 2>&1; then
        echo "   ✅ Success"
        return 0
    else
        echo "   ⚠️  Warning: Migration may have already been applied or encountered an error"
        # Don't exit, continue with other migrations
        return 1
    fi
}

# Run all migration files in alphabetical order
echo "🚀 Running migrations..."
echo ""

SUCCESS_COUNT=0
WARNING_COUNT=0

# Sort files to ensure they run in order (001, 002, 003, etc.)
for migration_file in $(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort); do
    if [ -f "$migration_file" ]; then
        if run_migration "$migration_file"; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    fi
done

echo ""
echo "✅ Migration process complete!"
echo "   - Successful: $SUCCESS_COUNT"
echo "   - Warnings: $WARNING_COUNT"
echo ""

# Show database status
echo "📊 Database Status:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null | grep -E "users|companies|trips|wallets|transactions|notifications" || echo "No tables found"

echo ""

# Verify critical columns exist
echo "🔍 Verifying critical columns:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\d users" 2>/dev/null | grep -E "is_admin" && echo "   ✅ is_admin column found in users table" || echo "   ⚠️  is_admin column not found in users table"

docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\d users" 2>/dev/null | grep -E "user_type" && echo "   ✅ user_type column found in users table" || echo "   ⚠️  user_type column not found in users table"

docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\d users" 2>/dev/null | grep -E "company_id" && echo "   ✅ company_id column found in users table" || echo "   ⚠️  company_id column not found in users table"

echo ""

# Show table counts
echo "📈 Record Counts:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT
  'Users: ' || COUNT(*) FROM users
UNION ALL
SELECT
  'Companies: ' || COUNT(*) FROM companies
UNION ALL
SELECT
  'Trips: ' || COUNT(*) FROM trips;
" 2>/dev/null || echo "   Unable to fetch counts"

echo ""
echo "🎉 All done! Database is ready."
echo ""
