-- Seed Data for Truck Finance Hub
-- This file contains initial data for testing and development
-- SQLite Database Seeds
-- Version: 1.0

-- NOTE: Super admin is automatically created by database.ts
-- Email: Alok@faberwork.com
-- Password: Alok12345
-- User ID: SA001

-- ============================================================
-- Sample Users
-- ============================================================

-- Load Owner 1
INSERT OR IGNORE INTO users (
  id, user_id, email, phone, name, password_hash, role, company, is_active
) VALUES (
  'u-lo-001',
  'LO001',
  'loadowner1@example.com',
  '9876543210',
  'Rajesh Transport',
  '$2b$10$YourHashedPasswordHere', -- Password: Test@1234
  'load_owner',
  'Rajesh Transport Co.',
  1
);

-- Load Owner 2
INSERT OR IGNORE INTO users (
  id, user_id, email, phone, name, password_hash, role, company, is_active
) VALUES (
  'u-lo-002',
  'LO002',
  'loadowner2@example.com',
  '9876543211',
  'Sharma Logistics',
  '$2b$10$YourHashedPasswordHere', -- Password: Test@1234
  'load_owner',
  'Sharma Logistics Pvt Ltd',
  1
);

-- Vehicle Owner 1
INSERT OR IGNORE INTO users (
  id, user_id, email, phone, name, password_hash, role, is_active
) VALUES (
  'u-vo-001',
  'VO001',
  'vehicleowner1@example.com',
  '9876543212',
  'Amit Singh',
  '$2b$10$YourHashedPasswordHere', -- Password: Test@1234
  'vehicle_owner',
  1
);

-- Lender 1
INSERT OR IGNORE INTO users (
  id, user_id, email, phone, name, password_hash, role, company, is_active
) VALUES (
  'u-l-001',
  'L001',
  'lender1@example.com',
  '9876543213',
  'Priya Investments',
  '$2b$10$YourHashedPasswordHere', -- Password: Test@1234
  'lender',
  'Priya Investment Group',
  1
);

-- Lender 2
INSERT OR IGNORE INTO users (
  id, user_id, email, phone, name, password_hash, role, is_active
) VALUES (
  'u-l-002',
  'L002',
  'lender2@example.com',
  '9876543214',
  'Vikram Capital',
  '$2b$10$YourHashedPasswordHere', -- Password: Test@1234
  'lender',
  1
);

-- Admin User
INSERT OR IGNORE INTO users (
  id, user_id, email, phone, name, password_hash, role, is_active
) VALUES (
  'u-admin-001',
  'ADM001',
  'admin@example.com',
  '9876543215',
  'Admin User',
  '$2b$10$YourHashedPasswordHere', -- Password: Test@1234
  'admin',
  1
);

-- ============================================================
-- Sample Wallets (for existing users)
-- ============================================================

-- Super Admin Wallet
INSERT OR IGNORE INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('sa-001', 0, 0, 0, 0, 0);

-- Load Owner 1 Wallet
INSERT OR IGNORE INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('u-lo-001', 50000, 0, 0, 0, 0);

-- Load Owner 2 Wallet
INSERT OR IGNORE INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('u-lo-002', 75000, 0, 0, 0, 0);

-- Vehicle Owner 1 Wallet
INSERT OR IGNORE INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('u-vo-001', 25000, 0, 0, 0, 0);

-- Lender 1 Wallet
INSERT OR IGNORE INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('u-l-001', 500000, 0, 100000, 200000, 15000);

-- Lender 2 Wallet
INSERT OR IGNORE INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('u-l-002', 300000, 0, 50000, 100000, 8000);

-- ============================================================
-- Sample Trips
-- ============================================================

-- Trip 1: Pending
INSERT OR IGNORE INTO trips (
  id, load_owner_id, load_owner_name, origin, destination, distance,
  load_type, weight, amount, maturity_days, risk_level, insurance_status, status
) VALUES (
  'trip-001',
  'u-lo-001',
  'Rajesh Transport',
  'Mumbai',
  'Delhi',
  1400,
  'Electronics',
  5000,
  45000,
  30,
  'low',
  1,
  'pending'
);

-- Trip 2: Funded
INSERT OR IGNORE INTO trips (
  id, load_owner_id, load_owner_name, origin, destination, distance,
  load_type, weight, amount, maturity_days, risk_level, insurance_status, status,
  lender_id, lender_name, funded_at
) VALUES (
  'trip-002',
  'u-lo-001',
  'Rajesh Transport',
  'Delhi',
  'Bangalore',
  2200,
  'Textiles',
  8000,
  60000,
  25,
  'medium',
  1,
  'funded',
  'u-l-001',
  'Priya Investments',
  datetime('now', '-5 days')
);

-- Trip 3: In Transit
INSERT OR IGNORE INTO trips (
  id, load_owner_id, load_owner_name, origin, destination, distance,
  load_type, weight, amount, maturity_days, risk_level, insurance_status, status,
  lender_id, lender_name, funded_at
) VALUES (
  'trip-003',
  'u-lo-002',
  'Sharma Logistics',
  'Chennai',
  'Kolkata',
  1700,
  'Auto Parts',
  6000,
  52000,
  20,
  'low',
  1,
  'in_transit',
  'u-l-002',
  'Vikram Capital',
  datetime('now', '-3 days')
);

-- ============================================================
-- Sample Trip Bids
-- ============================================================

-- Bids for Trip 1
INSERT OR IGNORE INTO trip_bids (
  id, trip_id, lender_id, lender_name, amount, interest_rate
) VALUES (
  'bid-001',
  'trip-001',
  'u-l-001',
  'Priya Investments',
  45000,
  12.5
);

INSERT OR IGNORE INTO trip_bids (
  id, trip_id, lender_id, lender_name, amount, interest_rate
) VALUES (
  'bid-002',
  'trip-001',
  'u-l-002',
  'Vikram Capital',
  45000,
  11.8
);

-- ============================================================
-- Sample Investments
-- ============================================================

-- Investment 1: Active
INSERT OR IGNORE INTO investments (
  id, lender_id, trip_id, amount, interest_rate, expected_return,
  status, maturity_date
) VALUES (
  'inv-001',
  'u-l-001',
  'trip-002',
  60000,
  12.0,
  7200,
  'active',
  datetime('now', '+20 days')
);

-- Investment 2: Active
INSERT OR IGNORE INTO investments (
  id, lender_id, trip_id, amount, interest_rate, expected_return,
  status, maturity_date
) VALUES (
  'inv-002',
  'u-l-002',
  'trip-003',
  52000,
  11.5,
  5980,
  'active',
  datetime('now', '+15 days')
);

-- ============================================================
-- Sample Transactions
-- ============================================================

-- Transaction for Lender 1: Investment
INSERT OR IGNORE INTO transactions (
  id, user_id, type, amount, category, description, balance_after
) VALUES (
  'txn-001',
  'u-l-001',
  'debit',
  60000,
  'investment',
  'Investment in trip trip-002',
  440000
);

-- Transaction for Lender 2: Investment
INSERT OR IGNORE INTO transactions (
  id, user_id, type, amount, category, description, balance_after
) VALUES (
  'txn-002',
  'u-l-002',
  'debit',
  52000,
  'investment',
  'Investment in trip trip-003',
  248000
);

-- Transaction for Load Owner 1: Payment received
INSERT OR IGNORE INTO transactions (
  id, user_id, type, amount, category, description, balance_after
) VALUES (
  'txn-003',
  'u-lo-001',
  'credit',
  60000,
  'payment',
  'Payment received for trip trip-002',
  110000
);

-- ============================================================
-- Sample Bank Accounts
-- ============================================================

-- Bank Account for Lender 1
INSERT OR IGNORE INTO bank_accounts (
  id, user_id, account_holder_name, account_number, ifsc_code, bank_name,
  account_type, is_verified, is_primary
) VALUES (
  'ba-001',
  'u-l-001',
  'Priya Sharma',
  '123456789012',
  'HDFC0001234',
  'HDFC Bank',
  'savings',
  1,
  1
);

-- Bank Account for Load Owner 1
INSERT OR IGNORE INTO bank_accounts (
  id, user_id, account_holder_name, account_number, ifsc_code, bank_name,
  account_type, is_verified, is_primary
) VALUES (
  'ba-002',
  'u-lo-001',
  'Rajesh Kumar',
  '987654321098',
  'ICIC0002345',
  'ICICI Bank',
  'current',
  1,
  1
);

-- ============================================================
-- Sample KYC Records
-- ============================================================

-- KYC for Super Admin (Approved)
INSERT OR IGNORE INTO user_kyc (
  id, user_id, pan_number, aadhar_number, address_line1, city, state, pincode,
  kyc_status, verified_by, verified_at
) VALUES (
  'kyc-001',
  'sa-001',
  'XXXXX1234X',
  '123412341234',
  '123 Admin Street',
  'Mumbai',
  'Maharashtra',
  '400001',
  'approved',
  'sa-001',
  datetime('now', '-30 days')
);

-- KYC for Lender 1 (Approved)
INSERT OR IGNORE INTO user_kyc (
  id, user_id, pan_number, aadhar_number, address_line1, city, state, pincode,
  kyc_status, verified_by, verified_at
) VALUES (
  'kyc-002',
  'u-l-001',
  'XXXXX5678X',
  '567856785678',
  '456 Lender Avenue',
  'Delhi',
  'Delhi',
  '110001',
  'approved',
  'sa-001',
  datetime('now', '-25 days')
);

-- KYC for Load Owner 1 (Under Review)
INSERT OR IGNORE INTO user_kyc (
  id, user_id, pan_number, aadhar_number, gst_number, address_line1, city, state, pincode,
  kyc_status, submitted_at
) VALUES (
  'kyc-003',
  'u-lo-001',
  'XXXXX9012X',
  '901290129012',
  '27XXXXX1234X1Z5',
  '789 Transport Road',
  'Bangalore',
  'Karnataka',
  '560001',
  'under_review',
  datetime('now', '-5 days')
);

-- ============================================================
-- End of Seeds
-- ============================================================
