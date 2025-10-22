-- Migration: Add user_type column to users table
-- This allows tracking whether a lender is individual or company-based

ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) CHECK(user_type IN ('individual', 'company'));

-- Set default user_type based on existing data
-- If user has a company, mark as company, otherwise individual
UPDATE users
SET user_type = CASE
  WHEN company IS NOT NULL AND company != '' THEN 'company'
  ELSE 'individual'
END
WHERE user_type IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

COMMENT ON COLUMN users.user_type IS 'Type of user: individual or company-based (mainly for lenders)';
