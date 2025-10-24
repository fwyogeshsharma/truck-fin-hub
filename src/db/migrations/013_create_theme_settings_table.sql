-- Migration: Create theme settings table
-- This table stores customizable theme colors that can be changed by super admin

CREATE TABLE IF NOT EXISTS theme_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Insert default theme colors
INSERT INTO theme_settings (setting_key, setting_value, updated_by) VALUES
  ('primary_color', '#3b82f6', 'system'),
  ('primary_color_dark', '#2563eb', 'system'),
  ('secondary_color', '#10b981', 'system'),
  ('accent_color', '#f59e0b', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_theme_settings_key ON theme_settings(setting_key);

-- Add comment
COMMENT ON TABLE theme_settings IS 'Stores customizable theme colors and settings for the application';
