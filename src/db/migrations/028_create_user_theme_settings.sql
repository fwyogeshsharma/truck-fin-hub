-- Migration 028: Create user_theme_settings table
-- Description: Stores per-user theme preferences and color customization
-- Date: 2025-01-07

-- Create user_theme_settings table for per-user theme customization
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

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_theme_settings_user_id ON user_theme_settings(user_id);

-- Add comment
COMMENT ON TABLE user_theme_settings IS 'Stores per-user theme preferences and color customization';

-- Log completion
SELECT 'Migration 028: user_theme_settings table created successfully!' as status;
