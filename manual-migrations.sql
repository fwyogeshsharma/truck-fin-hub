-- =============================================================================
-- LogiFin Manual Migration Script
-- =============================================================================
-- This script creates the missing tables for user_theme_settings and uploaded_contracts
-- Run this if you need to manually apply migrations to your PostgreSQL database
--
-- Usage:
--   psql -U postgres -d logifin -f manual-migrations.sql
-- OR
--   docker exec -i logifin-postgres psql -U postgres -d logifin < manual-migrations.sql
-- =============================================================================

\echo ''
\echo '🚀 Starting LogiFin Database Migrations'
\echo '========================================'
\echo ''

-- =============================================================================
-- Migration 028: Create user_theme_settings table
-- =============================================================================
\echo '📝 Migration 028: Creating user_theme_settings table...'

CREATE TABLE IF NOT EXISTS user_theme_settings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK(mode IN ('light', 'dark', 'system')) DEFAULT 'light',
  primary_color VARCHAR(50) NOT NULL DEFAULT '#084570',
  secondary_color VARCHAR(50) NOT NULL DEFAULT '#1D923C',
  accent_color VARCHAR(50) NOT NULL DEFAULT '#1D923C',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_theme_settings_user_id ON user_theme_settings(user_id);

COMMENT ON TABLE user_theme_settings IS 'Stores per-user theme preferences and color customization';

\echo '✅ Migration 028: user_theme_settings table created'
\echo ''

-- =============================================================================
-- Migration 029: Create uploaded_contracts table
-- =============================================================================
\echo '📝 Migration 029: Creating uploaded_contracts table...'

CREATE TABLE IF NOT EXISTS uploaded_contracts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_data BYTEA NOT NULL,
  loan_percentage NUMERIC(5,2) NOT NULL,
  ltv NUMERIC(5,2) NOT NULL,
  penalty_after_due_date NUMERIC(5,2) NOT NULL,
  contract_type VARCHAR(20) NOT NULL CHECK(contract_type IN ('2-party', '3-party')),
  party1_name VARCHAR(255) NOT NULL,
  party2_name VARCHAR(255) NOT NULL,
  party3_name VARCHAR(255),
  validity_date DATE NOT NULL,
  trip_stage VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_uploaded_contracts_user_id ON uploaded_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_contracts_uploaded_at ON uploaded_contracts(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_contracts_contract_type ON uploaded_contracts(contract_type);

COMMENT ON TABLE uploaded_contracts IS 'Stores uploaded contract documents with metadata and file data';
COMMENT ON COLUMN uploaded_contracts.file_data IS 'Binary contract file data (PDF/image)';
COMMENT ON COLUMN uploaded_contracts.loan_percentage IS 'Percentage of loan as per agreement terms';
COMMENT ON COLUMN uploaded_contracts.ltv IS 'Loan to Value ratio';
COMMENT ON COLUMN uploaded_contracts.penalty_after_due_date IS 'Penalty percentage after due date';
COMMENT ON COLUMN uploaded_contracts.trip_stage IS 'Optional: Preferred trip stage for loan disbursement';

\echo '✅ Migration 029: uploaded_contracts table created'
\echo ''

-- =============================================================================
-- Verify tables were created
-- =============================================================================
\echo '📊 Verifying tables...'
\echo ''

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_theme_settings')
    THEN '✅ user_theme_settings table exists'
    ELSE '❌ user_theme_settings table NOT found'
  END as user_theme_status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uploaded_contracts')
    THEN '✅ uploaded_contracts table exists'
    ELSE '❌ uploaded_contracts table NOT found'
  END as uploaded_contracts_status;

\echo ''
\echo '✅ All migrations completed successfully!'
\echo ''
\echo 'Next steps:'
\echo '1. Restart your backend server (docker compose restart backend)'
\echo '2. Reload your Settings page in the browser'
\echo '3. The API errors should now be resolved'
\echo ''
