import { getDatabase } from '../database.js';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  name: string;
  password_hash: string;
  role?: 'load_owner' | 'vehicle_owner' | 'lender' | 'admin' | 'super_admin' | 'load_agent' | 'vehicle_agent';
  company?: string;
  company_logo?: string;
  user_logo?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  user_id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  role?: User['role'];
  company?: string;
  company_logo?: string;
  user_logo?: string;
}

export interface UpdateUserInput {
  email?: string;
  phone?: string;
  name?: string;
  role?: User['role'];
  company?: string;
  company_logo?: string;
  user_logo?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  is_active?: boolean;
}

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

/**
 * Get user by user_id
 */
export const getUserByUserId = async (userId: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

/**
 * Get user by phone
 */
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
  return result.rows[0] || null;
};

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC'
  );
  return result.rows;
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: User['role']): Promise<User[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM users WHERE role = $1 AND is_active = TRUE ORDER BY created_at DESC',
    [role]
  );
  return result.rows;
};

/**
 * Create new user
 */
export const createUser = async (input: CreateUserInput): Promise<User> => {
  // Check if email already exists
  const existingEmail = await getUserByEmail(input.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  // Check if phone already exists
  const existingPhone = await getUserByPhone(input.phone);
  if (existingPhone) {
    throw new Error('Phone number already exists');
  }

  // Check if user_id already exists
  const existingUserId = await getUserByUserId(input.user_id);
  if (existingUserId) {
    throw new Error('User ID already exists');
  }

  // Hash password
  const passwordHash = bcrypt.hashSync(input.password, 10);

  // Generate ID
  const id = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const db = getDatabase();
  const result = await db.query(
    `INSERT INTO users (
      id, user_id, email, phone, name, password_hash, role, company, company_logo, user_logo, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
    RETURNING *`,
    [
      id,
      input.user_id,
      input.email,
      input.phone,
      input.name,
      passwordHash,
      input.role || null,
      input.company || null,
      input.company_logo || null,
      input.user_logo || null,
    ]
  );

  return result.rows[0];
};

/**
 * Update user
 */
export const updateUser = async (id: string, input: UpdateUserInput): Promise<User | null> => {
  const user = await getUserById(id);
  if (!user) {
    return null;
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.email !== undefined) {
    updates.push(`email = $${paramCount++}`);
    values.push(input.email);
  }
  if (input.phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(input.phone);
  }
  if (input.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(input.name);
  }
  if (input.role !== undefined) {
    updates.push(`role = $${paramCount++}`);
    values.push(input.role);
  }
  if (input.company !== undefined) {
    updates.push(`company = $${paramCount++}`);
    values.push(input.company);
  }
  if (input.company_logo !== undefined) {
    updates.push(`company_logo = $${paramCount++}`);
    values.push(input.company_logo);
  }
  if (input.user_logo !== undefined) {
    updates.push(`user_logo = $${paramCount++}`);
    values.push(input.user_logo);
  }
  if (input.terms_accepted !== undefined) {
    updates.push(`terms_accepted = $${paramCount++}`);
    values.push(input.terms_accepted);
  }
  if (input.terms_accepted_at !== undefined) {
    updates.push(`terms_accepted_at = $${paramCount++}`);
    values.push(input.terms_accepted_at);
  }
  if (input.is_active !== undefined) {
    updates.push(`is_active = $${paramCount++}`);
    values.push(input.is_active);
  }

  if (updates.length === 0) {
    return user;
  }

  values.push(id);

  const db = getDatabase();
  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete user (soft delete - set is_active to FALSE)
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  const db = getDatabase();
  const result = await db.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
};

/**
 * Verify user password
 */
export const verifyPassword = async (email: string, password: string): Promise<User | null> => {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return user;
};

/**
 * Update user password
 */
export const updatePassword = async (id: string, newPassword: string): Promise<boolean> => {
  const db = getDatabase();
  const passwordHash = bcrypt.hashSync(newPassword, 10);

  const result = await db.query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [passwordHash, id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * Find user by name (searches both name and company fields)
 */
export const findUserByName = async (name: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM users WHERE (name ILIKE $1 OR company ILIKE $1) AND is_active = TRUE LIMIT 1',
    [name]
  );
  return result.rows[0] || null;
};

/**
 * Find load owner by name (company or name)
 */
export const findLoadOwnerByName = async (name: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM users WHERE (name ILIKE $1 OR company ILIKE $1)
     AND role = 'load_owner' AND is_active = TRUE LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};

/**
 * Find transporter by name (company or name)
 */
export const findTransporterByName = async (name: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM users WHERE (name ILIKE $1 OR company ILIKE $1)
     AND role = 'vehicle_owner' AND is_active = TRUE LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};

export default {
  getUserById,
  getUserByEmail,
  getUserByUserId,
  getUserByPhone,
  getAllUsers,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  verifyPassword,
  updatePassword,
};
