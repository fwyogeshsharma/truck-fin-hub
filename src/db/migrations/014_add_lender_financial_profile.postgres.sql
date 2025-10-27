-- Migration: Add Lender Financial Profile Columns (PostgreSQL)
-- Version: 014
-- Description: Adds financial profile fields to users table for lender investment capacity assessment
-- Date: 2025-01-27

-- PostgreSQL version
-- Add financial profile columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_income VARCHAR(20) CHECK(annual_income IN ('below_5L', '5L_10L', '10L_25L', '25L_50L', 'above_50L'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investable_surplus VARCHAR(20) CHECK(investable_surplus IN ('below_1L', '1L_5L', '5L_10L', '10L_25L', 'above_25L'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_experience VARCHAR(20) CHECK(investment_experience IN ('beginner', 'intermediate', 'experienced', 'expert'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_appetite VARCHAR(20) CHECK(risk_appetite IN ('conservative', 'moderate', 'aggressive'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR(20) CHECK(investment_horizon IN ('short', 'medium', 'long', 'flexible'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_investment_per_deal VARCHAR(20) CHECK(max_investment_per_deal IN ('below_25K', '25K_50K', '50K_1L', '1L_2L', 'above_2L'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_profile_updated_at TIMESTAMP;

-- Create indexes for faster filtering by financial profile completion status
CREATE INDEX IF NOT EXISTS idx_users_financial_profile_completed ON users(financial_profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_risk_appetite ON users(risk_appetite);
CREATE INDEX IF NOT EXISTS idx_users_investment_experience ON users(investment_experience);

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN users.annual_income IS 'Lender annual income range for investment capacity assessment';
COMMENT ON COLUMN users.investable_surplus IS 'Lender available surplus funds for investments';
COMMENT ON COLUMN users.investment_experience IS 'Lender experience level with investments';
COMMENT ON COLUMN users.risk_appetite IS 'Lender comfort level with investment risk';
COMMENT ON COLUMN users.investment_horizon IS 'Lender preferred investment duration';
COMMENT ON COLUMN users.max_investment_per_deal IS 'Maximum amount lender willing to invest per trip';
COMMENT ON COLUMN users.financial_profile_completed IS 'Whether lender has completed the financial questionnaire';
COMMENT ON COLUMN users.financial_profile_updated_at IS 'Timestamp when financial profile was last updated';
