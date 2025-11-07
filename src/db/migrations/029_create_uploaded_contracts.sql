-- Migration 029: Create uploaded_contracts table
-- Description: Stores uploaded contract documents with metadata
-- Date: 2025-01-07

-- Create uploaded_contracts table for storing contract files
CREATE TABLE IF NOT EXISTS uploaded_contracts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_data BYTEA NOT NULL,
  loan_percentage NUMERIC(5,2) NOT NULL,
  ltv NUMERIC(5,2) NOT NULL,
  penalty_after_due_date NUMERIC(5,2) NOT NULL,
  contract_type VARCHAR(20) NOT NULL CHECK(contract_type IN ('2-party', '3-party')),
  party1_name VARCHAR(255) NOT NULL,
  party2_name VARCHAR(255) NOT NULL,
  party3_name VARCHAR(255),
  validity_date DATE NOT NULL,
  trip_stage VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_uploaded_contracts_user_id ON uploaded_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_contracts_uploaded_at ON uploaded_contracts(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_contracts_contract_type ON uploaded_contracts(contract_type);

-- Add comments
COMMENT ON TABLE uploaded_contracts IS 'Stores uploaded contract documents with metadata and file data';
COMMENT ON COLUMN uploaded_contracts.file_data IS 'Binary contract file data (PDF/image)';
COMMENT ON COLUMN uploaded_contracts.loan_percentage IS 'Percentage of loan as per agreement terms';
COMMENT ON COLUMN uploaded_contracts.ltv IS 'Loan to Value ratio';
COMMENT ON COLUMN uploaded_contracts.penalty_after_due_date IS 'Penalty percentage after due date';
COMMENT ON COLUMN uploaded_contracts.trip_stage IS 'Optional: Preferred trip stage for loan disbursement';

-- Log completion
SELECT 'Migration 029: uploaded_contracts table created successfully!' as status;
