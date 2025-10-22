#!/bin/bash

# Migration Script for LogiFin Database
# This script runs all pending migrations on the PostgreSQL database via Docker

set -e

echo "🔄 LogiFin Database Migration Script"
echo "====================================="
echo ""

# Docker container name
CONTAINER_NAME="${POSTGRES_CONTAINER:-logifin-postgres}"
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"

echo "Container: $CONTAINER_NAME"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
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
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null | grep -E "users|companies|trips|wallets|transactions" || echo "No tables found"

echo ""

# Verify is_admin column was added
echo "🔍 Verifying is_admin column in users table:"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\d users" 2>/dev/null | grep -E "is_admin" && echo "   ✅ is_admin column found" || echo "   ⚠️  is_admin column not found"

echo ""
echo "🎉 All done! Database is ready."
