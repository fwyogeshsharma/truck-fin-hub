-- Migration 027: Create Contracts Table
-- Stores uploaded contracts with party information and contract details

CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(255) PRIMARY KEY,

  -- File information
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL, -- S3 URL or file storage path
  file_data TEXT, -- Optional: base64 encoded file data for small files

  -- Contract financial details
  loan_percentage NUMERIC(5,2) NOT NULL CHECK(loan_percentage >= 0 AND loan_percentage <= 100),
  ltv NUMERIC(5,2) NOT NULL CHECK(ltv >= 0 AND ltv <= 100), -- Loan to Value ratio
  penalty_after_due_date NUMERIC(5,2) NOT NULL CHECK(penalty_after_due_date >= 0), -- Penalty percentage

  -- Contract metadata
  contract_type VARCHAR(20) CHECK(contract_type IN ('2-party', '3-party')) NOT NULL,
  validity_date DATE NOT NULL,
  trip_stage VARCHAR(50), -- Optional: pending, bilty, advance_invoice, pod, final_invoice, funded, completed

  -- Party 1 (Primary Party)
  party1_user_id VARCHAR(255) NOT NULL,
  party1_name VARCHAR(500) NOT NULL,

  -- Party 2 (Secondary Party)
  party2_user_id VARCHAR(255) NOT NULL,
  party2_name VARCHAR(500) NOT NULL,

  -- Party 3 (Third Party - optional for 3-party contracts)
  party3_user_id VARCHAR(255),
  party3_name VARCHAR(500),

  -- Party 4 (LogiFin - Platform Facilitator - always present)
  party4_user_id VARCHAR(255) NOT NULL DEFAULT 'logifin-platform',
  party4_name VARCHAR(500) NOT NULL DEFAULT 'LogiFin Hub Private Limited - Platform Facilitator',

  -- Status and tracking
  status VARCHAR(50) CHECK(status IN ('active', 'expired', 'cancelled', 'archived')) DEFAULT 'active',
  uploaded_by VARCHAR(255) NOT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (party1_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (party2_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (party3_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_uploaded_by ON contracts(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_contracts_party1 ON contracts(party1_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_party2 ON contracts(party2_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_party3 ON contracts(party3_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_validity_date ON contracts(validity_date);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- Create index for searching by multiple parties
CREATE INDEX IF NOT EXISTS idx_contracts_all_parties ON contracts(party1_user_id, party2_user_id, party3_user_id);

-- Add comments for documentation
COMMENT ON TABLE contracts IS 'Stores all uploaded contracts with party information and contract terms';
COMMENT ON COLUMN contracts.file_url IS 'Storage path or URL to the contract file (PDF/image)';
COMMENT ON COLUMN contracts.loan_percentage IS 'Percentage of loan as per agreement terms';
COMMENT ON COLUMN contracts.ltv IS 'Loan to Value ratio as specified in contract';
COMMENT ON COLUMN contracts.penalty_after_due_date IS 'Penalty percentage per month/week after due date';
COMMENT ON COLUMN contracts.contract_type IS 'Type of contract: 2-party (+ LogiFin) or 3-party (+ LogiFin)';
COMMENT ON COLUMN contracts.trip_stage IS 'Optional: Preferred loan disbursement stage for the contract';
COMMENT ON COLUMN contracts.party1_user_id IS 'User ID of Party 1 (Primary Party)';
COMMENT ON COLUMN contracts.party2_user_id IS 'User ID of Party 2 (Secondary Party)';
COMMENT ON COLUMN contracts.party3_user_id IS 'User ID of Party 3 (Third Party - for 3-party contracts)';
COMMENT ON COLUMN contracts.party4_user_id IS 'User ID of Party 4 (LogiFin - Platform Facilitator)';
COMMENT ON COLUMN contracts.status IS 'Contract status: active, expired, cancelled, or archived';
COMMENT ON COLUMN contracts.uploaded_by IS 'User ID of the person who uploaded the contract';

-- Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_contracts_updated_at ON contracts;
CREATE TRIGGER trigger_update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Create a view for active contracts with party details
CREATE OR REPLACE VIEW active_contracts_view AS
SELECT
  c.id,
  c.file_name,
  c.file_type,
  c.contract_type,
  c.loan_percentage,
  c.ltv,
  c.penalty_after_due_date,
  c.validity_date,
  c.trip_stage,
  c.status,

  -- Party 1 details
  c.party1_user_id,
  c.party1_name,
  u1.email AS party1_email,
  u1.role AS party1_role,

  -- Party 2 details
  c.party2_user_id,
  c.party2_name,
  u2.email AS party2_email,
  u2.role AS party2_role,

  -- Party 3 details (if applicable)
  c.party3_user_id,
  c.party3_name,
  u3.email AS party3_email,
  u3.role AS party3_role,

  -- Party 4 details (LogiFin)
  c.party4_name,

  -- Metadata
  c.uploaded_by,
  uploader.name AS uploaded_by_name,
  c.created_at,
  c.updated_at
FROM contracts c
LEFT JOIN users u1 ON c.party1_user_id = u1.id
LEFT JOIN users u2 ON c.party2_user_id = u2.id
LEFT JOIN users u3 ON c.party3_user_id = u3.id
LEFT JOIN users uploader ON c.uploaded_by = uploader.id
WHERE c.status = 'active';

COMMENT ON VIEW active_contracts_view IS 'View of active contracts with expanded party information for easy querying';
