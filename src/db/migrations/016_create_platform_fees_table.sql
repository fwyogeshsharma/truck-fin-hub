-- Migration: Create platform_fees table
-- Description: Track all platform fees collected from loan disbursements

CREATE TABLE IF NOT EXISTS platform_fees (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trip_id TEXT NOT NULL,
  lender_id TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  loan_amount REAL NOT NULL,
  fee_percentage REAL NOT NULL,
  fee_amount REAL NOT NULL,
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  super_admin_transaction_id TEXT,
  borrower_transaction_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (lender_id) REFERENCES users(id),
  FOREIGN KEY (borrower_id) REFERENCES users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_platform_fees_trip_id ON platform_fees(trip_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_lender_id ON platform_fees(lender_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_borrower_id ON platform_fees(borrower_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);
