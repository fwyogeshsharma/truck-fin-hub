#!/bin/bash

# Database Migration Script for Docker
# This script runs all pending migrations in the PostgreSQL container

set -e

echo "🔄 Running Database Migrations..."
echo "=================================="

# Database connection details from environment or defaults
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres123}"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec logifin-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  echo "   Waiting for database..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"
echo ""

# Run the consolidated migration
echo "📝 Running migrations..."

docker exec -i logifin-postgres psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- ============================================================
-- Migration: Complete Database Setup
-- ============================================================

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  industry VARCHAR(100),
  website VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  gst_number VARCHAR(20) UNIQUE,
  pan_number VARCHAR(20) UNIQUE,
  company_registration_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_gst ON companies(gst_number);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Add user_type column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20)
  CHECK(user_type IN ('individual', 'company'));

-- Add company_id to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Set default user_type based on existing data
UPDATE users
SET user_type = CASE
  WHEN company IS NOT NULL AND company != '' THEN 'company'
  ELSE 'individual'
END
WHERE user_type IS NULL;

-- Insert sample companies for testing (if not exist)
INSERT INTO companies (id, name, display_name, email, phone, address, gst_number, is_active, created_at)
VALUES
  ('company_rollingradius', 'Rolling Radius Logistics', 'Rolling Radius', 'contact@rollingradius.com', '9876543210', 'Mumbai, Maharashtra, India', '27AABCU9603R1ZX', TRUE, NOW()),
  ('company_abc_logistics', 'ABC Logistics Pvt Ltd', 'ABC Logistics', 'info@abclogistics.com', '9876543211', 'Delhi, NCR, India', '07AABCU9603R1ZY', TRUE, NOW()),
  ('company_xyz_transport', 'XYZ Transport Solutions', 'XYZ Transport', 'hello@xyztransport.com', '9876543212', 'Bangalore, Karnataka, India', '29AABCU9603R1ZZ', TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Migration completed successfully!' as status;
EOF

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
  echo ""

  # Show table counts
  echo "📊 Database Status:"
  docker exec -i logifin-postgres psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM trips) as trips;
EOF

else
  echo "❌ Migration failed!"
  exit 1
fi

echo ""
echo "🎉 Database is ready!"
