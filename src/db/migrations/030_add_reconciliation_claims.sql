-- Migration 030: Add Reconciliation Claims Fields
-- Description: Adds claim-related fields to reconciliation table

-- Add claim-related columns to reconciliations table
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS claim_requested BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS claim_requested_at TIMESTAMP;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS claim_amount NUMERIC(15,2);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS lender_id VARCHAR(255);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS lender_name VARCHAR(255);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS lender_claim_amount NUMERIC(15,2);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_claim_amount NUMERIC(15,2);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS lender_approved BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS lender_approved_at TIMESTAMP;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS payment_notification_sent BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS payment_notification_message TEXT;

-- Add foreign key for lender (drop first if exists to avoid duplicate constraint error)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reconciliations_lender') THEN
    ALTER TABLE reconciliations DROP CONSTRAINT fk_reconciliations_lender;
  END IF;
END
$$;

ALTER TABLE reconciliations ADD CONSTRAINT fk_reconciliations_lender
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for claim queries
CREATE INDEX IF NOT EXISTS idx_reconciliations_claim_requested ON reconciliations(claim_requested);
CREATE INDEX IF NOT EXISTS idx_reconciliations_lender ON reconciliations(lender_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_lender_approved ON reconciliations(lender_approved);

-- Add comments
COMMENT ON COLUMN reconciliations.claim_requested IS 'Whether transporter has requested claim after approval';
COMMENT ON COLUMN reconciliations.claim_amount IS 'Total claim amount calculated';
COMMENT ON COLUMN reconciliations.lender_claim_amount IS 'Amount to be paid to lender';
COMMENT ON COLUMN reconciliations.transporter_claim_amount IS 'Amount to be paid to transporter';
COMMENT ON COLUMN reconciliations.lender_approved IS 'Whether lender has approved the claim';

SELECT 'Migration 030: Reconciliation claims fields added successfully!' as status;
