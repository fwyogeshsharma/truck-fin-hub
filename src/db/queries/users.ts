import { getDatabase } from '../database';
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
  terms_accepted?: number;
  terms_accepted_at?: string;
  is_active: number;
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
  terms_accepted?: number;
  terms_accepted_at?: string;
  is_active?: number;
}

/**
 * Get user by ID
 */
export const getUserById = (id: string): User | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | null;
};

/**
 * Get user by email
 */
export const getUserByEmail = (email: string): User | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | null;
};

/**
 * Get user by user_id
 */
export const getUserByUserId = (userId: string): User | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  return stmt.get(userId) as User | null;
};

/**
 * Get user by phone
 */
export const getUserByPhone = (phone: string): User | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
  return stmt.get(phone) as User | null;
};

/**
 * Get all users
 */
export const getAllUsers = (): User[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC');
  return stmt.all() as User[];
};

/**
 * Get users by role
 */
export const getUsersByRole = (role: User['role']): User[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE role = ? AND is_active = 1 ORDER BY created_at DESC');
  return stmt.all(role) as User[];
};

/**
 * Create new user
 */
export const createUser = (input: CreateUserInput): User => {
  const db = getDatabase();

  // Check if email already exists
  const existingEmail = getUserByEmail(input.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  // Check if phone already exists
  const existingPhone = getUserByPhone(input.phone);
  if (existingPhone) {
    throw new Error('Phone number already exists');
  }

  // Check if user_id already exists
  const existingUserId = getUserByUserId(input.user_id);
  if (existingUserId) {
    throw new Error('User ID already exists');
  }

  // Hash password
  const passwordHash = bcrypt.hashSync(input.password, 10);

  // Generate ID
  const id = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO users (
      id, user_id, email, phone, name, password_hash, role, company, company_logo, user_logo, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  stmt.run(
    id,
    input.user_id,
    input.email,
    input.phone,
    input.name,
    passwordHash,
    input.role || null,
    input.company || null,
    input.company_logo || null,
    input.user_logo || null
  );

  const user = getUserById(id);
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
};

/**
 * Update user
 */
export const updateUser = (id: string, input: UpdateUserInput): User | null => {
  const db = getDatabase();

  const user = getUserById(id);
  if (!user) {
    return null;
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (input.email !== undefined) {
    updates.push('email = ?');
    values.push(input.email);
  }
  if (input.phone !== undefined) {
    updates.push('phone = ?');
    values.push(input.phone);
  }
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.role !== undefined) {
    updates.push('role = ?');
    values.push(input.role);
  }
  if (input.company !== undefined) {
    updates.push('company = ?');
    values.push(input.company);
  }
  if (input.company_logo !== undefined) {
    updates.push('company_logo = ?');
    values.push(input.company_logo);
  }
  if (input.user_logo !== undefined) {
    updates.push('user_logo = ?');
    values.push(input.user_logo);
  }
  if (input.terms_accepted !== undefined) {
    updates.push('terms_accepted = ?');
    values.push(input.terms_accepted);
  }
  if (input.terms_accepted_at !== undefined) {
    updates.push('terms_accepted_at = ?');
    values.push(input.terms_accepted_at);
  }
  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(input.is_active);
  }

  if (updates.length === 0) {
    return user;
  }

  updates.push('updated_at = datetime(\'now\')');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getUserById(id);
};

/**
 * Delete user (soft delete - set is_active to 0)
 */
export const deleteUser = (id: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Verify user password
 */
export const verifyPassword = (email: string, password: string): User | null => {
  const user = getUserByEmail(email);
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
export const updatePassword = (id: string, newPassword: string): boolean => {
  const db = getDatabase();
  const passwordHash = bcrypt.hashSync(newPassword, 10);

  const stmt = db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `);

  const result = stmt.run(passwordHash, id);
  return result.changes > 0;
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
