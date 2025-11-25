-- Migration 031: Add Selected Trips Fields to Reconciliation
-- Description: Adds fields to store multiple selected trips with lender info

-- Add columns for storing selected trips and lender at upload time
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_trip_ids TEXT[];
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_lender_id VARCHAR(255);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_lender_name VARCHAR(255);

-- Add workflow status for multi-party approval flow
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_approved BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_approved_at TIMESTAMP;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_generated BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_message TEXT;

-- Add index for workflow queries
CREATE INDEX IF NOT EXISTS idx_reconciliations_workflow_status ON reconciliations(workflow_status);
CREATE INDEX IF NOT EXISTS idx_reconciliations_selected_lender ON reconciliations(selected_lender_id);

-- Add comments
COMMENT ON COLUMN reconciliations.selected_trip_ids IS 'Array of trip IDs selected by transporter during upload';
COMMENT ON COLUMN reconciliations.selected_lender_id IS 'Lender ID selected by transporter during upload';
COMMENT ON COLUMN reconciliations.selected_lender_name IS 'Lender name for display purposes';
COMMENT ON COLUMN reconciliations.workflow_status IS 'Workflow status: pending, trust_approved, lender_approved, transporter_approved, completed';
COMMENT ON COLUMN reconciliations.transporter_approved IS 'Whether transporter has approved after trust account approval';
COMMENT ON COLUMN reconciliations.bank_request_generated IS 'Whether bank request has been generated after all approvals';

SELECT 'Migration 031: Selected trips fields added to reconciliation successfully!' as status;
