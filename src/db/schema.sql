-- Database Schema for Truck Finance Hub
-- SQLite Database Schema
-- Version: 1.2

-- ============================================================
-- Table 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('load_owner', 'vehicle_owner', 'lender', 'admin', 'super_admin', 'load_agent', 'vehicle_agent')),
  company TEXT,
  company_logo TEXT,
  user_logo TEXT,
  terms_accepted INTEGER DEFAULT 0,
  terms_accepted_at TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- Table 2: trips
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  load_owner_id TEXT NOT NULL,
  load_owner_name TEXT NOT NULL,
  load_owner_logo TEXT,
  load_owner_rating REAL CHECK(load_owner_rating >= 0 AND load_owner_rating <= 5),
  client_company TEXT,
  client_logo TEXT,
  transporter_id TEXT,
  transporter_name TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance REAL NOT NULL,
  load_type TEXT NOT NULL,
  weight REAL NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 20000 AND amount <= 80000),
  interest_rate REAL,
  maturity_days INTEGER,
  risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
  insurance_status INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled')) DEFAULT 'pending',
  lender_id TEXT,
  lender_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  funded_at TEXT,
  completed_at TEXT,
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
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  lender_id TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trip_bids_trip ON trip_bids(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_bids_lender ON trip_bids(lender_id);

-- ============================================================
-- Table 4: trip_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_documents (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('bilty', 'ewaybill', 'invoice')),
  document_data TEXT NOT NULL,
  uploaded_at TEXT DEFAULT (datetime('now')),
  uploaded_by TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trip_documents_trip ON trip_documents(trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_documents_type ON trip_documents(trip_id, document_type);

-- ============================================================
-- Table 5: investments
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  lender_id TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  expected_return REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('escrowed', 'active', 'completed', 'defaulted')) DEFAULT 'escrowed',
  invested_at TEXT DEFAULT (datetime('now')),
  maturity_date TEXT NOT NULL,
  completed_at TEXT,
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
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('credit', 'debit')),
  amount REAL NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('investment', 'return', 'payment', 'refund', 'fee', 'withdrawal')),
  description TEXT NOT NULL,
  balance_after REAL NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================================
-- Table 7: wallets
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 0 CHECK(balance >= 0),
  locked_amount REAL NOT NULL DEFAULT 0 CHECK(locked_amount >= 0),
  escrowed_amount REAL NOT NULL DEFAULT 0 CHECK(escrowed_amount >= 0),
  total_invested REAL NOT NULL DEFAULT 0 CHECK(total_invested >= 0),
  total_returns REAL NOT NULL DEFAULT 0 CHECK(total_returns >= 0),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Table 8: bank_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('savings', 'current')),
  is_verified INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_primary ON bank_accounts(user_id, is_primary);

-- ============================================================
-- Table 9: user_kyc
-- ============================================================
CREATE TABLE IF NOT EXISTS user_kyc (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,

  -- Personal Information
  pan_number TEXT UNIQUE,
  pan_document TEXT,
  aadhar_number TEXT UNIQUE,
  aadhar_document TEXT,

  -- Address Proof
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  address_proof_type TEXT CHECK(address_proof_type IN ('aadhar', 'passport', 'voter_id', 'driving_license', 'utility_bill')),
  address_proof_document TEXT,

  -- Business/Company Documents
  gst_number TEXT UNIQUE,
  gst_certificate TEXT,
  company_registration_number TEXT,
  company_registration_document TEXT,

  -- Vehicle Documents
  vehicle_registration_number TEXT,
  vehicle_registration_document TEXT,
  vehicle_insurance_document TEXT,
  vehicle_fitness_certificate TEXT,

  -- Verification Status
  kyc_status TEXT NOT NULL CHECK(kyc_status IN ('pending', 'under_review', 'approved', 'rejected')) DEFAULT 'pending',
  verified_by TEXT,
  verified_at TEXT,
  rejection_reason TEXT,

  -- Timestamps
  submitted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

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
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  read INTEGER DEFAULT 0,
  action_url TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  read_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
