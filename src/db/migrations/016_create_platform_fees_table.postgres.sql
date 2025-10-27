-- Migration: Create platform_fees table (PostgreSQL)
-- Description: Track all platform fees collected from loan disbursements

CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL,
  lender_id TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  loan_amount DECIMAL(15, 2) NOT NULL,
  fee_percentage DECIMAL(5, 3) NOT NULL,
  fee_amount DECIMAL(15, 2) NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  super_admin_transaction_id TEXT,
  borrower_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_platform_fees_trip_id ON platform_fees(trip_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_lender_id ON platform_fees(lender_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_borrower_id ON platform_fees(borrower_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);

-- Add foreign key constraints
ALTER TABLE platform_fees
  ADD CONSTRAINT fk_platform_fees_trip
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;

ALTER TABLE platform_fees
  ADD CONSTRAINT fk_platform_fees_lender
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE platform_fees
  ADD CONSTRAINT fk_platform_fees_borrower
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE;
