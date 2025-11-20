-- Migration 029: Add Reconciliation Table
-- Description: Creates table for transporter reconciliation documents

-- Create reconciliation table
CREATE TABLE IF NOT EXISTS reconciliations (
  id VARCHAR(255) PRIMARY KEY,
  transporter_id VARCHAR(255) NOT NULL,
  transporter_name VARCHAR(255) NOT NULL,
  trust_account_id VARCHAR(255) NOT NULL,
  trust_account_name VARCHAR(255) NOT NULL,
  trip_id VARCHAR(255),
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  document_data TEXT NOT NULL,
  document_size INTEGER NOT NULL,
  description TEXT,
  reconciliation_amount NUMERIC(15,2),
  reconciliation_date DATE,
  status VARCHAR(50) CHECK(status IN ('pending', 'reviewed', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trust_account_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reconciliations_transporter ON reconciliations(transporter_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_trust_account ON reconciliations(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_trip ON reconciliations(trip_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_status ON reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_reconciliations_created_at ON reconciliations(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE reconciliations IS 'Stores reconciliation documents uploaded by transporters for trust accounts';
COMMENT ON COLUMN reconciliations.transporter_id IS 'User ID of the transporter who uploaded the document';
COMMENT ON COLUMN reconciliations.trust_account_id IS 'User ID of the trust account who should review this';
COMMENT ON COLUMN reconciliations.trip_id IS 'Optional trip ID if reconciliation is related to a specific trip';
COMMENT ON COLUMN reconciliations.status IS 'Status: pending, reviewed, approved, rejected';
COMMENT ON COLUMN reconciliations.reconciliation_amount IS 'Amount mentioned in the reconciliation';
COMMENT ON COLUMN reconciliations.reconciliation_date IS 'Date of the reconciliation transaction';

SELECT 'Migration 029: Reconciliation table created successfully!' as status;
