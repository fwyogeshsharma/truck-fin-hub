#!/bin/bash

# Migration Script for LogiFin Database
# This script runs all pending migrations on the PostgreSQL database

set -e

echo "🔄 LogiFin Database Migration Script"
echo "====================================="
echo ""

# Database connection details
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Install PostgreSQL client: sudo apt install postgresql-client"
    exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
if ! PGPASSWORD="${DB_PASSWORD:-postgres123}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to database"
    echo "Please check:"
    echo "  - Database is running: docker ps"
    echo "  - Credentials are correct"
    echo "  - DB_PASSWORD environment variable is set"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Function to run a migration file
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")

    echo "📝 Running: $migration_name"

    if PGPASSWORD="${DB_PASSWORD:-postgres123}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        echo "   ✅ Success"
        return 0
    else
        echo "   ⚠️  Warning: Migration may have already been applied or encountered an error"
        # Don't exit, continue with other migrations
        return 1
    fi
}

# Run migrations in order
echo "🚀 Running migrations..."
echo ""

cd "$(dirname "$0")"

# Check if migrations directory exists
if [ ! -d "src/db/migrations" ]; then
    echo "❌ Error: Migrations directory not found: src/db/migrations"
    exit 1
fi

# Run all migration files in order
for migration_file in src/db/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        run_migration "$migration_file"
    fi
done

echo ""
echo "✅ Migration process complete!"
echo ""

# Show tables created
echo "📊 Database Tables:"
PGPASSWORD="${DB_PASSWORD:-postgres123}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null | grep -E "users|companies|trips|wallets|transactions" || echo "No tables found"

echo ""
echo "🎉 All done! Database is ready."
