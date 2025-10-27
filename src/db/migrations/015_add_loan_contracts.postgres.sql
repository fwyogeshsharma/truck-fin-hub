-- Migration: Add Loan Contracts and Agreements (PostgreSQL)
-- Version: 015
-- Description: Adds contract templates, loan agreements, and signature functionality
-- Date: 2025-01-27

-- ============================================================
-- Table: loan_contract_templates
-- Stores reusable contract templates for lenders
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_contract_templates (
  id VARCHAR(255) PRIMARY KEY,
  lender_id VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  terms_and_conditions TEXT NOT NULL,
  interest_rate_clause TEXT,
  repayment_clause TEXT,
  late_payment_clause TEXT,
  default_clause TEXT,
  custom_clauses JSONB, -- JSON array of custom clauses
  lender_signature_image TEXT, -- Base64 or URL to signature image
  is_default BOOLEAN DEFAULT FALSE, -- Whether this is the lender's default template
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loan_contract_templates_lender ON loan_contract_templates(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_contract_templates_default ON loan_contract_templates(lender_id, is_default);

COMMENT ON TABLE loan_contract_templates IS 'Reusable contract templates created by lenders';
COMMENT ON COLUMN loan_contract_templates.is_default IS 'Whether this template is used by default for new bids';

-- ============================================================
-- Table: loan_agreements
-- Stores actual loan agreements for each bid/trip
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_agreements (
  id VARCHAR(255) PRIMARY KEY,
  trip_id VARCHAR(255) NOT NULL,
  bid_id VARCHAR(255) NOT NULL,
  lender_id VARCHAR(255) NOT NULL,
  borrower_id VARCHAR(255) NOT NULL,

  -- Contract Content
  contract_terms TEXT NOT NULL, -- Full contract text
  interest_rate NUMERIC(5,2) NOT NULL,
  loan_amount NUMERIC(10,2) NOT NULL,
  maturity_days INTEGER NOT NULL,

  -- Terms Clauses
  terms_and_conditions TEXT,
  interest_rate_clause TEXT,
  repayment_clause TEXT,
  late_payment_clause TEXT,
  default_clause TEXT,
  custom_clauses JSONB, -- JSON array

  -- Signatures
  lender_signature_image TEXT, -- Lender's signature
  lender_signed_at TIMESTAMP,
  borrower_signature_image TEXT, -- Borrower's signature
  borrower_signed_at TIMESTAMP,

  -- Status
  status VARCHAR(50) CHECK(status IN ('pending_borrower', 'accepted', 'rejected')) DEFAULT 'pending_borrower',
  contract_accepted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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

COMMENT ON TABLE loan_agreements IS 'Loan contracts between lenders and borrowers for specific trips';
COMMENT ON COLUMN loan_agreements.status IS 'pending_borrower: waiting for borrower signature, accepted: both signed, rejected: borrower rejected';

-- Add contract reference to trip_bids
ALTER TABLE trip_bids ADD COLUMN IF NOT EXISTS contract_id VARCHAR(255);
ALTER TABLE trip_bids ADD COLUMN IF NOT EXISTS has_contract BOOLEAN DEFAULT FALSE;

-- Add contract acceptance fields to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contract_id VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS borrower_signature_image TEXT;

COMMENT ON COLUMN trips.contract_accepted IS 'Whether the borrower has accepted and signed the loan contract';
