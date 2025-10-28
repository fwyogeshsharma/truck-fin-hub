-- Migration: Add repayment fields and 'repaid' status to trips table
-- Date: 2025-10-28

-- Add 'repaid' to status check constraint
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK(status IN ('pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled', 'repaid'));

-- Add repayment tracking fields
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repaid_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_amount NUMERIC(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_principal NUMERIC(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_interest NUMERIC(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_days INTEGER;

-- Create index for repaid trips
CREATE INDEX IF NOT EXISTS idx_trips_repaid_at ON trips(repaid_at);

-- Add comments for documentation
COMMENT ON COLUMN trips.repaid_at IS 'Timestamp when the loan was fully repaid';
COMMENT ON COLUMN trips.repayment_amount IS 'Total amount repaid (principal + interest)';
COMMENT ON COLUMN trips.repayment_principal IS 'Principal amount repaid';
COMMENT ON COLUMN trips.repayment_interest IS 'Interest amount paid';
COMMENT ON COLUMN trips.repayment_days IS 'Actual number of days for which interest was calculated';
