-- Migration 033: Fix selected_trip_ids column type
-- Description: Ensures selected_trip_ids is TEXT[] type, handles existing JSONB columns

-- Check if column exists and is wrong type, then fix it
DO $$
BEGIN
  -- Check if the column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reconciliations' AND column_name = 'selected_trip_ids'
  ) THEN
    -- Check if it's not already TEXT[]
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reconciliations'
      AND column_name = 'selected_trip_ids'
      AND data_type = 'ARRAY'
    ) THEN
      -- Drop and recreate with correct type
      ALTER TABLE reconciliations DROP COLUMN IF EXISTS selected_trip_ids;
      ALTER TABLE reconciliations ADD COLUMN selected_trip_ids TEXT[];
      RAISE NOTICE 'Recreated selected_trip_ids as TEXT[]';
    ELSE
      RAISE NOTICE 'selected_trip_ids already has correct type';
    END IF;
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE reconciliations ADD COLUMN selected_trip_ids TEXT[];
    RAISE NOTICE 'Created selected_trip_ids as TEXT[]';
  END IF;
END $$;

-- Ensure other columns exist
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_lender_id VARCHAR(255);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS selected_lender_name VARCHAR(255);
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS transporter_approved_at TIMESTAMP;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE reconciliations ADD COLUMN IF NOT EXISTS bank_request_message TEXT;

SELECT 'Migration 033: Fixed selected_trip_ids type successfully!' as status;
