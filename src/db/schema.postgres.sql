-- Database Schema for Truck Finance Hub
-- PostgreSQL Database Schema
-- Version: 1.2
-- Migrated from SQLite

-- ============================================================
-- Table 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) CHECK(role IN ('load_owner', 'vehicle_owner', 'lender', 'admin', 'super_admin', 'load_agent', 'vehicle_agent', 'shipper')),
  company VARCHAR(255),
  company_id VARCHAR(255),
  company_logo TEXT,
  user_logo TEXT,
  approval_status VARCHAR(20) CHECK(approval_status IN ('approved', 'pending', 'rejected')) DEFAULT 'approved',
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  -- Lender Financial Profile
  is_admin BOOLEAN DEFAULT FALSE,
  annual_income VARCHAR(20) CHECK(annual_income IN ('below_5L', '5L_10L', '10L_25L', '25L_50L', 'above_50L')),
  investable_surplus VARCHAR(20) CHECK(investable_surplus IN ('below_1L', '1L_5L', '5L_10L', '10L_25L', 'above_25L')),
  investment_experience VARCHAR(20) CHECK(investment_experience IN ('beginner', 'intermediate', 'experienced', 'expert')),
  risk_appetite VARCHAR(20) CHECK(risk_appetite IN ('conservative', 'moderate', 'aggressive')),
  investment_horizon VARCHAR(20) CHECK(investment_horizon IN ('short', 'medium', 'long', 'flexible')),
  max_investment_per_deal VARCHAR(20) CHECK(max_investment_per_deal IN ('below_25K', '25K_50K', '50K_1L', '1L_2L', 'above_2L')),
  financial_profile_completed BOOLEAN DEFAULT FALSE,
  financial_profile_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- ============================================================
-- Table 2: trips
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
-- Table 3: trip_bids
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_bids (
  id VARCHAR(255) PRIMARY KEY,
  trip_id VARCHAR(255) NOT NULL,
  lender_id VARCHAR(255) NOT NULL,
  lender_name VARCHAR(255) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trip_bids_trip ON trip_bids(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_bids_lender ON trip_bids(lender_id);

-- ============================================================
-- Table 4: trip_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_documents (
  id VARCHAR(255) PRIMARY KEY,
  trip_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK(document_type IN ('bilty', 'ewaybill', 'advance_invoice', 'pod', 'final_invoice')),
  document_data TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(255) NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trip_documents_trip ON trip_documents(trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_documents_type ON trip_documents(trip_id, document_type);

-- ============================================================
-- Table 5: investments
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
  id VARCHAR(255) PRIMARY KEY,
  lender_id VARCHAR(255) NOT NULL,
  trip_id VARCHAR(255) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  expected_return NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK(status IN ('escrowed', 'active', 'completed', 'defaulted')) DEFAULT 'escrowed',
  invested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  maturity_date TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  FOREIGN KEY (lender_id) REFERENCES users(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE INDEX IF NOT EXISTS idx_investments_lender ON investments(lender_id);
CREATE INDEX IF NOT EXISTS idx_investments_trip ON investments(trip_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- ============================================================
-- Table 6: transactions
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
-- Table 7: wallets
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
-- Table 8: bank_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK(account_type IN ('savings', 'current')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_primary ON bank_accounts(user_id, is_primary);

-- ============================================================
-- Table 9: user_kyc
-- ============================================================
CREATE TABLE IF NOT EXISTS user_kyc (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,

  -- Personal Information
  pan_number VARCHAR(20) UNIQUE,
  pan_document TEXT,
  aadhar_number VARCHAR(20) UNIQUE,
  aadhar_document TEXT,

  -- Address Proof
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  address_proof_type VARCHAR(50) CHECK(address_proof_type IN ('aadhar', 'passport', 'voter_id', 'driving_license', 'utility_bill')),
  address_proof_document TEXT,

  -- Business/Company Documents
  gst_number VARCHAR(20) UNIQUE,
  gst_certificate TEXT,
  company_registration_number VARCHAR(50),
  company_registration_document TEXT,

  -- Vehicle Documents
  vehicle_registration_number VARCHAR(50),
  vehicle_registration_document TEXT,
  vehicle_insurance_document TEXT,
  vehicle_fitness_certificate TEXT,

  -- Verification Status
  kyc_status VARCHAR(50) NOT NULL CHECK(kyc_status IN ('pending', 'under_review', 'approved', 'rejected')) DEFAULT 'pending',
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  rejection_reason TEXT,

  -- Timestamps
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_kyc_user ON user_kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_status ON user_kyc(kyc_status);
CREATE INDEX IF NOT EXISTS idx_user_kyc_pan ON user_kyc(pan_number);
CREATE INDEX IF NOT EXISTS idx_user_kyc_aadhar ON user_kyc(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_user_kyc_gst ON user_kyc(gst_number);

-- ============================================================
-- Table 10: notifications
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
-- Create update timestamp trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_kyc_updated_at BEFORE UPDATE ON user_kyc
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
