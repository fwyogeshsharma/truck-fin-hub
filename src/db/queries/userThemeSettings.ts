import pool from '../index.ts';
import { v4 as uuidv4 } from 'uuid';

export interface UserThemeSettings {
  id: string;
  user_id: string;
  mode: 'light' | 'dark' | 'system';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserThemeSettingsInput {
  user_id: string;
  mode: 'light' | 'dark' | 'system';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

export interface UpdateUserThemeSettingsInput {
  mode?: 'light' | 'dark' | 'system';
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

/**
 * Get theme settings for a user
 */
export async function getUserThemeSettings(userId: string): Promise<UserThemeSettings | null> {
  const result = await pool.query(
    `SELECT * FROM user_theme_settings WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Create theme settings for a user
 */
export async function createUserThemeSettings(input: CreateUserThemeSettingsInput): Promise<UserThemeSettings> {
  const id = uuidv4();
  const now = new Date();

  const result = await pool.query(
    `INSERT INTO user_theme_settings (
      id, user_id, mode, primary_color, secondary_color, accent_color,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id,
      input.user_id,
      input.mode,
      input.primary_color,
      input.secondary_color,
      input.accent_color,
      now,
      now
    ]
  );

  return result.rows[0];
}

/**
 * Update theme settings for a user
 */
export async function updateUserThemeSettings(
  userId: string,
  input: UpdateUserThemeSettingsInput
): Promise<UserThemeSettings | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.mode !== undefined) {
    updates.push(`mode = $${paramIndex++}`);
    values.push(input.mode);
  }
  if (input.primary_color !== undefined) {
    updates.push(`primary_color = $${paramIndex++}`);
    values.push(input.primary_color);
  }
  if (input.secondary_color !== undefined) {
    updates.push(`secondary_color = $${paramIndex++}`);
    values.push(input.secondary_color);
  }
  if (input.accent_color !== undefined) {
    updates.push(`accent_color = $${paramIndex++}`);
    values.push(input.accent_color);
  }

  if (updates.length === 0) {
    return getUserThemeSettings(userId);
  }

  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());
  values.push(userId);

  const result = await pool.query(
    `UPDATE user_theme_settings SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Upsert (create or update) theme settings for a user
 */
export async function upsertUserThemeSettings(
  userId: string,
  input: CreateUserThemeSettingsInput | UpdateUserThemeSettingsInput
): Promise<UserThemeSettings> {
  const existing = await getUserThemeSettings(userId);

  if (existing) {
    const updated = await updateUserThemeSettings(userId, input);
    return updated!;
  } else {
    const fullInput = input as CreateUserThemeSettingsInput;
    fullInput.user_id = userId;
    return createUserThemeSettings(fullInput);
  }
}

/**
 * Delete theme settings for a user
 */
export async function deleteUserThemeSettings(userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM user_theme_settings WHERE user_id = $1`,
    [userId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Reset theme settings to default for a user
 */
export async function resetUserThemeSettings(userId: string): Promise<UserThemeSettings> {
  const defaultSettings: CreateUserThemeSettingsInput = {
    user_id: userId,
    mode: 'light',
    primary_color: '#084570',
    secondary_color: '#1D923C',
    accent_color: '#1D923C'
  };

  return upsertUserThemeSettings(userId, defaultSettings);
}
