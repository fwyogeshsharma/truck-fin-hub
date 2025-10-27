-- Migration: Add Loan Contracts and Agreements
-- Version: 015
-- Description: Adds contract templates, loan agreements, and signature functionality
-- Date: 2025-01-27

-- ============================================================
-- Table: loan_contract_templates
-- Stores reusable contract templates for lenders
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_contract_templates (
  id TEXT PRIMARY KEY,
  lender_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  terms_and_conditions TEXT NOT NULL,
  interest_rate_clause TEXT,
  repayment_clause TEXT,
  late_payment_clause TEXT,
  default_clause TEXT,
  custom_clauses TEXT, -- JSON array of custom clauses
  lender_signature_image TEXT, -- Base64 or URL to signature image
  is_default INTEGER DEFAULT 0, -- Whether this is the lender's default template
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loan_contract_templates_lender ON loan_contract_templates(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_contract_templates_default ON loan_contract_templates(lender_id, is_default);

-- ============================================================
-- Table: loan_agreements
-- Stores actual loan agreements for each bid/trip
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_agreements (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  bid_id TEXT NOT NULL,
  lender_id TEXT NOT NULL,
  borrower_id TEXT NOT NULL,

  -- Contract Content
  contract_terms TEXT NOT NULL, -- Full contract text
  interest_rate REAL NOT NULL,
  loan_amount REAL NOT NULL,
  maturity_days INTEGER NOT NULL,

  -- Terms Clauses
  terms_and_conditions TEXT,
  interest_rate_clause TEXT,
  repayment_clause TEXT,
  late_payment_clause TEXT,
  default_clause TEXT,
  custom_clauses TEXT, -- JSON array

  -- Signatures
  lender_signature_image TEXT, -- Lender's signature
  lender_signed_at TEXT,
  borrower_signature_image TEXT, -- Borrower's signature
  borrower_signed_at TEXT,

  -- Status
  status TEXT CHECK(status IN ('pending_borrower', 'accepted', 'rejected')) DEFAULT 'pending_borrower',
  contract_accepted INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (bid_id) REFERENCES trip_bids(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id),
  FOREIGN KEY (borrower_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_loan_agreements_trip ON loan_agreements(trip_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_bid ON loan_agreements(bid_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_lender ON loan_agreements(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_borrower ON loan_agreements(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_status ON loan_agreements(status);

-- Add contract reference to trip_bids
ALTER TABLE trip_bids ADD COLUMN contract_id TEXT;
ALTER TABLE trip_bids ADD COLUMN has_contract INTEGER DEFAULT 0;

-- Add contract acceptance fields to trips
ALTER TABLE trips ADD COLUMN contract_id TEXT;
ALTER TABLE trips ADD COLUMN contract_accepted INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN contract_accepted_at TEXT;
ALTER TABLE trips ADD COLUMN borrower_signature_image TEXT;
