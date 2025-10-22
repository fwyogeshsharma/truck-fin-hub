#!/bin/sh
set -e

echo "🔍 DEBUG MODE"
echo "PORT from env: ${PORT}"
echo "NODE_ENV: ${NODE_ENV}"

# Skip migrations for now
echo "⏭️  Skipping migrations for debug..."

# Start server with explicit port
export PORT=4000
echo "🚀 Starting server on PORT $PORT"

exec npx tsx server/index.ts
