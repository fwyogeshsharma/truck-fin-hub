-- Migration: Add is_admin boolean field to users table
-- This field indicates whether a user has admin privileges for their company

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update existing admin and super_admin role users to have is_admin = true
UPDATE users
SET is_admin = TRUE
WHERE role IN ('admin', 'super_admin');

-- Create an index for faster queries on is_admin
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Add comment to column
COMMENT ON COLUMN users.is_admin IS 'Indicates if the user has admin privileges for their company';
