-- Migration 032: Rename party4 columns to party3 (Trust Account Manager as Party 3)
-- Changes party3 to be the trust account user managing the contract

-- Update existing contracts to set party3 as the uploader (trust account manager)
UPDATE contracts
SET
  party3_user_id = uploaded_by,
  party3_name = (SELECT name FROM users WHERE id = uploaded_by)
WHERE party3_user_id IS NULL;

-- Make party3 required (since it will always be the trust account manager)
ALTER TABLE contracts
ALTER COLUMN party3_user_id SET NOT NULL;

ALTER TABLE contracts
ALTER COLUMN party3_name SET NOT NULL;

-- Drop party4 columns (no longer needed)
ALTER TABLE contracts
DROP COLUMN IF EXISTS party4_user_id,
DROP COLUMN IF EXISTS party4_name;

-- Update comments
COMMENT ON COLUMN contracts.party3_user_id IS 'User ID of Party 3 (Trust Account Manager - the user who created/manages this contract)';
COMMENT ON COLUMN contracts.party3_name IS 'Name of Party 3 (Trust Account Manager - the user who created/manages this contract)';

-- Update the active_contracts_view to remove party4 references
DROP VIEW IF EXISTS active_contracts_view;

CREATE OR REPLACE VIEW active_contracts_view AS
SELECT
  c.id,
  c.file_name,
  c.file_type,
  c.contract_type,
  c.loan_percentage,
  c.ltv,
  c.penalty_after_due_date,
  c.consignee_sender,
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

  -- Party 3 details (LogiFin)
  c.party3_user_id,
  c.party3_name,

  -- Metadata
  c.uploaded_by,
  uploader.name AS uploaded_by_name,
  c.created_at,
  c.updated_at
FROM contracts c
LEFT JOIN users u1 ON c.party1_user_id = u1.id
LEFT JOIN users u2 ON c.party2_user_id = u2.id
LEFT JOIN users uploader ON c.uploaded_by = uploader.id
WHERE c.status = 'active';

COMMENT ON VIEW active_contracts_view IS 'View of active contracts with expanded party information (Party 3 is LogiFin)';
