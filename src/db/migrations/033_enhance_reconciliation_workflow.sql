-- Migration 033: Enhance Reconciliation Workflow
-- Description: Adds support for multi-trip reconciliation and enhanced approval workflow

-- Add selected trips (stored as JSON array)
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_trip_ids JSONB;

-- Add transporter approval fields
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_approved BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_approved_at TIMESTAMP;

-- Add bank trust account request fields
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_generated BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_generated_at TIMESTAMP;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_message TEXT;

-- Add lender info (in case not already added)
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_lender_id VARCHAR(255);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_lender_name VARCHAR(255);

-- Add workflow status to track the approval stage
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'pending';
-- Possible values: pending, trust_approved, lender_approved, transporter_approved, bank_request_sent, completed

-- Add indices for efficient queries
CREATE INDEX IF NOT EXISTS idx_reconciliations_selected_lender ON reconciliations(selected_lender_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_workflow_status ON reconciliations(workflow_status);
CREATE INDEX IF NOT EXISTS idx_reconciliations_transporter_approved ON reconciliations(transporter_approved);
CREATE INDEX IF NOT EXISTS idx_reconciliations_bank_request ON reconciliations(bank_request_generated);

-- Add comments for documentation
COMMENT ON COLUMN reconciliations.selected_trip_ids IS 'Array of trip IDs selected for this reconciliation (JSON)';
COMMENT ON COLUMN reconciliations.transporter_approved IS 'Whether transporter has approved the reconciliation';
COMMENT ON COLUMN reconciliations.bank_request_generated IS 'Whether bank trust account request has been generated';
COMMENT ON COLUMN reconciliations.workflow_status IS 'Current stage in the approval workflow';
COMMENT ON COLUMN reconciliations.selected_lender_id IS 'The lender selected for the trips in this reconciliation';

SELECT 'Migration 033: Enhanced reconciliation workflow fields added successfully!' as status;
