-- Migration: Create Users for Migration 024
-- Date: 2025-10-30
-- Description: Creates the transporter and lender users needed for migration 024

-- Insert Transporter User (Sanjay)
INSERT INTO users (
  id,
  name,
  email,
  phone,
  password,
  role,
  company,
  created_at
) VALUES (
  'u-1761660716425-uiowj5sbt',
  'Sanjay',
  'sanjay@gmail.com',
  '1234567890',
  '$2b$10$YourHashedPasswordHere', -- You'll need to hash the actual password
  'transporter',
  'SanjayLogi',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Insert Lender User (Sandeep Kumar)
INSERT INTO users (
  id,
  name,
  email,
  phone,
  password,
  role,
  company,
  created_at
) VALUES (
  'u-1761816242012-6x0isqt5u',
  'Sandeep Kumar',
  'sandeepkumar@gmail.com',
  '7340223333',
  '$2b$10$YourHashedPasswordHere', -- You'll need to hash the actual password
  'lender',
  'dev foundation',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Create wallets for both users
INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns, updated_at)
VALUES
  ('u-1761660716425-uiowj5sbt', 0, 0, 0, 0, 0, CURRENT_TIMESTAMP),
  ('u-1761816242012-6x0isqt5u', 25000000, 0, 0, 0, 0, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  updated_at = EXCLUDED.updated_at;

-- Verify users were created
DO $$
BEGIN
  RAISE NOTICE '✅ Users created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Created Users:';
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
