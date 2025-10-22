-- Migration: Sync all table structures from local to production
-- Version: 010
-- Description: Comprehensive migration to ensure all tables have correct structure
-- This migration is safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================
-- 1. USERS TABLE - Add missing columns
-- ============================================================

-- Add is_admin column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add user_type column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK(user_type IN ('individual', 'company'));

-- Add company_id if it doesn't exist (should exist from migration 004)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);

-- Add terms acceptance columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;

-- Add approval columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) CHECK(approval_status IN ('approved', 'pending', 'rejected')) DEFAULT 'approved';
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add active status if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add timestamps if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update is_admin for existing admin users
UPDATE users
SET is_admin = TRUE
WHERE role IN ('admin', 'super_admin') AND (is_admin IS NULL OR is_admin = FALSE);

-- Update user_type for existing users
UPDATE users
SET user_type = CASE
  WHEN company IS NOT NULL AND company != '' THEN 'company'
  ELSE 'individual'
END
WHERE user_type IS NULL;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add comments
COMMENT ON COLUMN users.is_admin IS 'Indicates if the user has admin privileges for their company';
COMMENT ON COLUMN users.user_type IS 'Type of user: individual or company-based (mainly for lenders)';

-- ============================================================
-- 2. COMPANIES TABLE - Ensure it exists and has correct structure
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  website VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,

  -- Address Information
  address TEXT,
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Removed industry column as it's not needed

-- Create indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_gst ON companies(gst_number);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- ============================================================
-- 3. TRANSACTION_REQUESTS TABLE - Ensure it exists
-- ============================================================

CREATE TABLE IF NOT EXISTS transaction_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  request_type VARCHAR(20) NOT NULL CHECK(request_type IN ('add_money', 'withdrawal')),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',

  -- Add money specific fields
  transaction_image_url TEXT,

  -- Withdrawal specific fields
  bank_account_id VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_ifsc_code VARCHAR(20),
  bank_name VARCHAR(255),

  -- Processing information
  transaction_id VARCHAR(255),
  processed_by VARCHAR(255),
  processed_at TIMESTAMP,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for transaction_requests
CREATE INDEX IF NOT EXISTS idx_transaction_requests_user ON transaction_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_requests_status ON transaction_requests(status);
CREATE INDEX IF NOT EXISTS idx_transaction_requests_type ON transaction_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_transaction_requests_created ON transaction_requests(created_at DESC);

-- ============================================================
-- 4. WALLETS TABLE - Ensure it exists
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  user_id VARCHAR(255) PRIMARY KEY,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(balance >= 0),
  locked_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(locked_amount >= 0),
  escrowed_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(escrowed_amount >= 0),
  total_invested NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(total_invested >= 0),
  total_returns NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK(total_returns >= 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. TRANSACTIONS TABLE - Ensure it exists
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK(type IN ('credit', 'debit')),
  amount NUMERIC(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK(category IN ('investment', 'return', 'payment', 'refund', 'fee', 'withdrawal')),
  description TEXT NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================================
-- 6. NOTIFICATIONS TABLE - Ensure it exists
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- 7. TRIPS TABLE - Ensure it exists with correct structure
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(255) PRIMARY KEY,
  load_owner_id VARCHAR(255) NOT NULL,
  load_owner_name VARCHAR(255) NOT NULL,
  load_owner_logo TEXT,
  load_owner_rating NUMERIC(2,1) CHECK(load_owner_rating >= 0 AND load_owner_rating <= 5),
  client_company VARCHAR(255),
  client_logo TEXT,
  transporter_id VARCHAR(255),
  transporter_name VARCHAR(255),
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  distance NUMERIC(10,2) NOT NULL,
  load_type VARCHAR(255) NOT NULL,
  weight NUMERIC(10,2) NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK(amount >= 20000 AND amount <= 80000),
  interest_rate NUMERIC(5,2),
  maturity_days INTEGER,
  risk_level VARCHAR(20) CHECK(risk_level IN ('low', 'medium', 'high')),
  insurance_status BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) NOT NULL CHECK(status IN ('pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled')) DEFAULT 'pending',
  lender_id VARCHAR(255),
  lender_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  funded_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (load_owner_id) REFERENCES users(id),
  FOREIGN KEY (transporter_id) REFERENCES users(id),
  FOREIGN KEY (lender_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_load_owner ON trips(load_owner_id);
CREATE INDEX IF NOT EXISTS idx_trips_lender ON trips(lender_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);

-- ============================================================
-- 8. TRIGGER FUNCTION - Ensure it exists
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transaction_requests_updated_at ON transaction_requests;
CREATE TRIGGER update_transaction_requests_updated_at BEFORE UPDATE ON transaction_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- This migration ensures all tables have the correct structure
-- and all necessary columns exist. It's safe to run multiple times.
