import { getDatabase } from '../database.js';

export interface ThemeSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  updated_at: string;
  updated_by: string | null;
}

export interface ThemeColors {
  primary_color: string;
  primary_color_dark: string;
  secondary_color: string;
  accent_color: string;
}

/**
 * Get all theme settings
 */
export const getAllThemeSettings = async (): Promise<ThemeSetting[]> => {
  const db = await getDatabase();
  const result = await db.query('SELECT * FROM theme_settings ORDER BY setting_key');
  return result.rows;
};

/**
 * Get theme colors formatted as an object
 */
export const getThemeColors = async (): Promise<ThemeColors> => {
  const db = await getDatabase();
  const result = await db.query('SELECT setting_key, setting_value FROM theme_settings');

  const colors: any = {
    primary_color: '#3b82f6',
    primary_color_dark: '#2563eb',
    secondary_color: '#10b981',
    accent_color: '#f59e0b',
  };

  result.rows.forEach((row: any) => {
    colors[row.setting_key] = row.setting_value;
  });

  return colors;
};

/**
 * Get a specific theme setting by key
 */
export const getThemeSetting = async (key: string): Promise<string | null> => {
  const db = await getDatabase();
  const result = await db.query(
    'SELECT setting_value FROM theme_settings WHERE setting_key = $1',
    [key]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].setting_value;
};

/**
 * Update a theme setting
 */
export const updateThemeSetting = async (
  key: string,
  value: string,
  updatedBy: string
): Promise<ThemeSetting> => {
  const db = await getDatabase();

  const result = await db.query(
    `UPDATE theme_settings
     SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
     WHERE setting_key = $3
     RETURNING *`,
    [value, updatedBy, key]
  );

  if (result.rows.length === 0) {
    // If setting doesn't exist, create it
    const insertResult = await db.query(
      `INSERT INTO theme_settings (setting_key, setting_value, updated_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [key, value, updatedBy]
    );
    return insertResult.rows[0];
  }

  return result.rows[0];
};

/**
 * Update multiple theme settings at once
 */
export const updateThemeColors = async (
  colors: Partial<ThemeColors>,
  updatedBy: string
): Promise<ThemeColors> => {
  const db = await getDatabase();

  const updates = Object.entries(colors).map(([key, value]) =>
    updateThemeSetting(key, value, updatedBy)
  );

  await Promise.all(updates);
  return await getThemeColors();
};

export default {
  getAllThemeSettings,
  getThemeColors,
  getThemeSetting,
  updateThemeSetting,
  updateThemeColors,
};
