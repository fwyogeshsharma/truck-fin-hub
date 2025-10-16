-- Migration: Create companies table
-- Version: 004
-- Description: Separate companies table to store company information

-- ============================================================
-- Table: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  industry VARCHAR(100),
  website VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),

  -- Address Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',

  -- Business Information
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_gst ON companies(gst_number);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Apply update timestamp trigger
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update users table to use company_id instead of company name
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
