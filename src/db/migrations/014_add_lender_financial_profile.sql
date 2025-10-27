-- Migration: Add Lender Financial Profile Columns
-- Version: 014
-- Description: Adds financial profile fields to users table for lender investment capacity assessment
-- Date: 2025-01-27

-- SQLite version
-- Add financial profile columns to users table
ALTER TABLE users ADD COLUMN annual_income TEXT CHECK(annual_income IN ('below_5L', '5L_10L', '10L_25L', '25L_50L', 'above_50L'));
ALTER TABLE users ADD COLUMN investable_surplus TEXT CHECK(investable_surplus IN ('below_1L', '1L_5L', '5L_10L', '10L_25L', 'above_25L'));
ALTER TABLE users ADD COLUMN investment_experience TEXT CHECK(investment_experience IN ('beginner', 'intermediate', 'experienced', 'expert'));
ALTER TABLE users ADD COLUMN risk_appetite TEXT CHECK(risk_appetite IN ('conservative', 'moderate', 'aggressive'));
ALTER TABLE users ADD COLUMN investment_horizon TEXT CHECK(investment_horizon IN ('short', 'medium', 'long', 'flexible'));
ALTER TABLE users ADD COLUMN max_investment_per_deal TEXT CHECK(max_investment_per_deal IN ('below_25K', '25K_50K', '50K_1L', '1L_2L', 'above_2L'));
ALTER TABLE users ADD COLUMN financial_profile_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN financial_profile_updated_at TEXT;

-- Create index for faster filtering by financial profile completion status
CREATE INDEX IF NOT EXISTS idx_users_financial_profile_completed ON users(financial_profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_risk_appetite ON users(risk_appetite);
CREATE INDEX IF NOT EXISTS idx_users_investment_experience ON users(investment_experience);
