-- Migration: Add terms_accepted and terms_accepted_at columns to users table
-- Date: 2025-10-07

ALTER TABLE users ADD COLUMN terms_accepted INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;
