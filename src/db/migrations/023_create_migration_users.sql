-- Migration: Verify Users for Migration 024
-- Date: 2025-10-30
-- Description: Verifies existing users and prepares wallets for migration 024

-- Verify users exist
DO $$
DECLARE
  v_transporter_name TEXT;
  v_lender_name TEXT;
BEGIN
  -- Check transporter exists
  SELECT name INTO v_transporter_name FROM users WHERE id = 'u-1761660716425-uiowj5sbt';
  IF v_transporter_name IS NULL THEN
    RAISE EXCEPTION 'Transporter user u-1761660716425-uiowj5sbt does not exist!';
  END IF;

  -- Check lender exists
  SELECT name INTO v_lender_name FROM users WHERE id = 'u-1761816242012-6x0isqt5u';
  IF v_lender_name IS NULL THEN
    RAISE EXCEPTION 'Lender user u-1761816242012-6x0isqt5u does not exist!';
  END IF;

  RAISE NOTICE '✅ Users verified:';
  RAISE NOTICE '   Transporter: % (ID: u-1761660716425-uiowj5sbt)', v_transporter_name;
  RAISE NOTICE '   Lender: % (ID: u-1761816242012-6x0isqt5u)', v_lender_name;
END $$;

-- Create wallets for both users
INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns, updated_at)
VALUES
  ('u-1761660716425-uiowj5sbt', 0, 0, 0, 0, 0, CURRENT_TIMESTAMP),
  ('u-1761816242012-6x0isqt5u', 25000000, 0, 0, 0, 0, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  updated_at = EXCLUDED.updated_at;

-- Display user information
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Wallets initialized successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Users for Migration:';
END $$;

SELECT
  id,
  name,
  email,
  phone,
  role,
  company
FROM users
WHERE id IN ('u-1761660716425-uiowj5sbt', 'u-1761816242012-6x0isqt5u');
