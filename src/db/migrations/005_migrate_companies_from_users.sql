-- Migration: Move company records from users table to companies table
-- Version: 005
-- Description: Extract all company records (where id starts with 'company-') from users table and migrate to companies table

-- ============================================================
-- Step 1: Insert company records from users into companies table
-- ============================================================
INSERT INTO companies (
  id,
  name,
  display_name,
  logo,
  email,
  phone,
  is_active,
  is_verified,
  created_at,
  updated_at
)
SELECT
  id,                           -- id (e.g., 'company-ina-energy')
  COALESCE(company, name),      -- name (use company field or name)
  COALESCE(company, name),      -- display_name
  company_logo,                 -- logo
  email,                        -- email
  phone,                        -- phone
  is_active,                    -- is_active
  false,                        -- is_verified (default to false)
  created_at,                   -- created_at
  updated_at                    -- updated_at
FROM users
WHERE id LIKE 'company-%'       -- Only select records with id starting with 'company-'
ON CONFLICT (id) DO NOTHING;    -- Skip if already exists

-- ============================================================
-- Step 2: Update users who belong to these companies
-- ============================================================
-- Set company_id for users who have a matching company name
UPDATE users u
SET company_id = c.id
FROM companies c
WHERE u.company = c.name
  AND u.id NOT LIKE 'company-%'
  AND u.company_id IS NULL;

-- ============================================================
-- Step 3: Update foreign key references in trips table
-- ============================================================
-- Update trips.load_owner_id to point to actual users instead of company records
-- For now, we'll skip deletion of company records if they're referenced by trips
-- This needs manual cleanup based on business logic

-- Check if there are any trips referencing company records
DO $$
DECLARE
  trip_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trip_count
  FROM trips
  WHERE load_owner_id LIKE 'company-%' OR transporter_id LIKE 'company-%';

  IF trip_count > 0 THEN
    RAISE NOTICE 'Warning: % trips are still referencing company records in users table', trip_count;
    RAISE NOTICE 'These references need to be manually updated before company records can be deleted';
  END IF;
END $$;

-- ============================================================
-- Step 4: Delete company records from users table (only if safe)
-- ============================================================
-- Only delete company records that are NOT referenced by any foreign keys
DELETE FROM users
WHERE id LIKE 'company-%'
  AND id NOT IN (
    SELECT DISTINCT load_owner_id FROM trips WHERE load_owner_id LIKE 'company-%'
    UNION
    SELECT DISTINCT transporter_id FROM trips WHERE transporter_id LIKE 'company-%'
    UNION
    SELECT DISTINCT verified_by FROM companies WHERE verified_by LIKE 'company-%'
  );

-- ============================================================
-- Step 5: Clean up old company fields in users table (optional)
-- ============================================================
-- We'll keep company and company_logo fields for backward compatibility
-- but they should eventually be removed once all code is updated
-- ALTER TABLE users DROP COLUMN IF EXISTS company;
-- ALTER TABLE users DROP COLUMN IF EXISTS company_logo;
