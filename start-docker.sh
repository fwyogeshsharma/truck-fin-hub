#!/bin/bash

# Exit on any error
set -e

# Configuration
export COMPOSE_HTTP_TIMEOUT=300

echo "🚀 Starting LogiFin Docker Deployment"
echo "===================================="
echo ""

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f

# Build and start services
echo ""
echo "🔨 Building and starting services..."
echo "   - PostgreSQL Database"
echo "   - Backend API Server"
echo ""

docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Run database migrations
echo ""
echo "🔄 Running Database Migrations..."
echo "=================================="

# Wait for PostgreSQL to be ready
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"

until docker exec logifin-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  echo "   Waiting for database..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run migrations
docker exec -i logifin-postgres psql -U "$DB_USER" -d "$DB_NAME" << 'EOFMIGRATION'
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  gst_number VARCHAR(20) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Add user_type and company_id columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20)
  CHECK(user_type IN ('individual', 'company'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Set default user_type
UPDATE users SET user_type = CASE
  WHEN company IS NOT NULL AND company != '' THEN 'company'
  ELSE 'individual'
END WHERE user_type IS NULL;

-- Insert sample companies
INSERT INTO companies (id, name, display_name, email, phone, address, is_active)
VALUES
  ('company_rr', 'Rolling Radius', 'Rolling Radius', 'contact@rr.com', '9876543210', 'Mumbai, India', TRUE),
  ('company_abc', 'ABC Logistics', 'ABC Logistics', 'info@abc.com', '9876543211', 'Delhi, India', TRUE),
  ('company_xyz', 'XYZ Transport', 'XYZ Transport', 'hello@xyz.com', '9876543212', 'Bangalore, India', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT 'Migrations completed!' as status;
EOFMIGRATION

echo "✅ Migrations completed!"

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Show logs
echo ""
echo "📋 Recent Logs:"
docker-compose logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Services available at:"
echo "   - Backend API: http://localhost:4000/api"
echo "   - Health Check: http://localhost:4000/api/health"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - View backend logs: docker-compose logs -f backend"
echo "   - View database logs: docker-compose logs -f postgres"
echo "   - Stop services: docker-compose down"
echo "   - Restart backend: docker-compose restart backend"
echo ""
