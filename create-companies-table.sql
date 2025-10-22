-- Quick Fix: Create companies table
-- Run this on your PostgreSQL database if migrations haven't been run

-- ============================================================
-- Create companies table
-- ============================================================
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

  -- Address
  address TEXT,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',

  -- Business Info
  gst_number VARCHAR(20) UNIQUE,
  pan_number VARCHAR(20) UNIQUE,
  company_registration_number VARCHAR(50),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_gst ON companies(gst_number);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Add company_id to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- Insert some sample companies for testing
INSERT INTO companies (id, name, display_name, email, phone, address, gst_number, is_active, created_at)
VALUES
  ('company_rollingradius', 'Rolling Radius Logistics', 'Rolling Radius', 'contact@rollingradius.com', '9876543210', 'Mumbai, Maharashtra', '27AABCU9603R1ZX', TRUE, NOW()),
  ('company_abc_logistics', 'ABC Logistics Pvt Ltd', 'ABC Logistics', 'info@abclogistics.com', '9876543211', 'Delhi, NCR', '07AABCU9603R1ZY', TRUE, NOW()),
  ('company_xyz_transport', 'XYZ Transport Solutions', 'XYZ Transport', 'hello@xyztransport.com', '9876543212', 'Bangalore, Karnataka', '29AABCU9603R1ZZ', TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Companies table created successfully!' as status;
SELECT COUNT(*) as company_count FROM companies;
