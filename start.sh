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

# Check if database schema exists
echo ""
echo "🔍 Checking database schema..."
SCHEMA_EXISTS=$(node -e "
  const { Client } = require('pg');
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'logifin',
  });
  client.connect()
    .then(() => client.query(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')\"))
    .then(result => {
      console.log(result.rows[0].exists ? 'true' : 'false');
      client.end();
    })
    .catch(() => {
      console.log('false');
      process.exit(0);
    });
" 2>/dev/null || echo "false")

if [ "$SCHEMA_EXISTS" = "false" ]; then
  echo "⚠️  Database schema not found. Creating schema..."
  if [ -f "./src/db/schema.postgres.sql" ]; then
    node -e "
      const { Client } = require('pg');
      const fs = require('fs');
      const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres123',
        database: process.env.DB_NAME || 'logifin',
      });
      const schema = fs.readFileSync('./src/db/schema.postgres.sql', 'utf-8');
      client.connect()
        .then(() => client.query(schema))
        .then(() => {
          console.log('✅ Database schema created successfully');
          client.end();
          process.exit(0);
        })
        .catch(err => {
          console.error('❌ Error creating schema:', err.message);
          client.end();
          process.exit(1);
        });
    "
  else
    echo "⚠️  Schema file not found at ./src/db/schema.postgres.sql"
    echo "   Schema will be created when the server starts"
  fi
else
  echo "✅ Database schema exists"
fi

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
