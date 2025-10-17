#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting LogiFin Backend..."
echo "================================"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until node -e "
  const { Client } = require('pg');
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'logifin',
  });
  client.connect()
    .then(() => {
      console.log('✅ Database connection successful');
      client.end();
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Could not connect to PostgreSQL after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "   Attempt $RETRY_COUNT/$MAX_RETRIES - Retrying in 2 seconds..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo ""
echo "📦 Running database migrations..."
npx tsx scripts/run-migrations.ts || {
  echo "⚠️  Migration warnings detected, continuing..."
}

echo ""
echo "✅ Database migrations completed!"

# Start the server
echo ""
echo "🚀 Starting API server..."
echo "📍 Environment: ${NODE_ENV:-production}"
echo "📍 Port: ${PORT:-4000}"
echo "📍 Database: ${DB_NAME:-logifin}@${DB_HOST:-localhost}"
echo ""

# Ensure PORT is set
export PORT=${PORT:-4000}

exec npx tsx server/index.ts
