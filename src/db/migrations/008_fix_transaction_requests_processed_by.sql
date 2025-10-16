-- Fix processed_by foreign key constraint to allow super admin (who is not in database)
-- Drop the existing foreign key constraint
ALTER TABLE transaction_requests DROP CONSTRAINT IF EXISTS transaction_requests_processed_by_fkey;

-- Make processed_by nullable without foreign key constraint
-- This allows super admin (mock user) to process requests
ALTER TABLE transaction_requests ALTER COLUMN processed_by DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN transaction_requests.processed_by IS 'ID of admin/super admin who processed the request (can be mock user not in database)';
