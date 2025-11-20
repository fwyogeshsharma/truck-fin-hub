-- Migration: Add 'trust_account' role to users table
-- Description: Adds a new role type 'trust_account' to the system for managing trust accounts
-- Date: 2025-01-20

-- Step 1: Drop the existing CHECK constraint on the role column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add the new CHECK constraint including 'trust_account' role
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK(role IN ('load_owner', 'vehicle_owner', 'lender', 'admin', 'super_admin', 'load_agent', 'vehicle_agent', 'trust_account'));

-- Step 3: Create an index for the new role (if needed for performance)
-- The existing index idx_users_role will automatically include the new role

-- Optional: Insert a comment to document the new role
COMMENT ON COLUMN users.role IS 'User role: load_owner, vehicle_owner, lender, admin, super_admin, load_agent, vehicle_agent, trust_account';
