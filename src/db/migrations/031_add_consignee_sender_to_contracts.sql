-- Migration 031: Add consignee_sender field to contracts table
-- Adds a field to store consignee or sender information for contracts

-- Add consignee_sender column to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS consignee_sender VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN contracts.consignee_sender IS 'Name of the consignee or sender involved in the contract';

-- Update contract_type constraint to only allow '2-party'
ALTER TABLE contracts
DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

ALTER TABLE contracts
ADD CONSTRAINT contracts_contract_type_check
CHECK (contract_type IN ('2-party'));

-- Update comment for contract_type
COMMENT ON COLUMN contracts.contract_type IS 'Type of contract: 2-party (+ LogiFin as facilitator)';
