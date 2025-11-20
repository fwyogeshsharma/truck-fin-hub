import { getDatabase } from '../database.js';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  user_id: string;
  email: string;
  phone: string;
  name: string;
  password_hash: string;
  role?: 'load_owner' | 'vehicle_owner' | 'lender' | 'admin' | 'super_admin' | 'load_agent' | 'vehicle_agent' | 'shipper' | 'trust_account';
  company?: string;  // Deprecated: use company_id and join with companies table
  company_id?: string;  // Foreign key to companies table
  company_logo?: string;  // Deprecated: use companies.logo
  user_logo?: string;
  approval_status?: 'approved' | 'pending' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  is_admin?: boolean;  // Indicates if user has admin privileges for their company
  is_active: boolean;
  // Lender Financial Profile
  annual_income?: 'below_5L' | '5L_10L' | '10L_25L' | '25L_50L' | 'above_50L';
  investable_surplus?: 'below_1L' | '1L_5L' | '5L_10L' | '10L_25L' | 'above_25L';
  investment_experience?: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  risk_appetite?: 'conservative' | 'moderate' | 'aggressive';
  investment_horizon?: 'short' | 'medium' | 'long' | 'flexible';
  max_investment_per_deal?: 'below_25K' | '25K_50K' | '50K_1L' | '1L_2L' | 'above_2L';
  financial_profile_completed?: boolean;
  financial_profile_updated_at?: string;
  created_at: string;
  updated_at: string;
  // Joined company data
  companyData?: {
    id: string;
    name: string;
    display_name: string;
    logo?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateUserInput {
  user_id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  role?: User['role'];
  company?: string;  // Deprecated: use company_id
  company_id?: string;  // Foreign key to companies table
  company_logo?: string;  // Deprecated
  user_logo?: string;
}

export interface UpdateUserInput {
  email?: string;
  phone?: string;
  name?: string;
  role?: User['role'];
  company?: string;  // Deprecated: use company_id
  company_id?: string;  // Foreign key to companies table
  company_logo?: string;  // Deprecated
  user_logo?: string;
  approval_status?: 'approved' | 'pending' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
  is_admin?: boolean;  // Admin privileges for company
  is_active?: boolean;
  // Lender Financial Profile
  annual_income?: 'below_5L' | '5L_10L' | '10L_25L' | '25L_50L' | 'above_50L';
  investable_surplus?: 'below_1L' | '1L_5L' | '5L_10L' | '10L_25L' | 'above_25L';
  investment_experience?: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  risk_appetite?: 'conservative' | 'moderate' | 'aggressive';
  investment_horizon?: 'short' | 'medium' | 'long' | 'flexible';
  max_investment_per_deal?: 'below_25K' | '25K_50K' | '50K_1L' | '1L_2L' | 'above_2L';
  financial_profile_completed?: boolean;
  financial_profile_updated_at?: string;
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
 * Get all users (excluding company records and joining with companies table)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT
      u.*,
      c.id as company_data_id,
      c.name as company_data_name,
      c.display_name as company_data_display_name,
      c.logo as company_data_logo,
      c.email as company_data_email,
      c.phone as company_data_phone
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.is_active = TRUE AND u.id NOT LIKE 'company-%' AND u.company_id IS NOT NULL
    ORDER BY u.created_at DESC`
  );

  // Transform the flat result into nested structure
  return result.rows.map(row => ({
    ...row,
    companyData: row.company_data_id ? {
      id: row.company_data_id,
      name: row.company_data_name,
      display_name: row.company_data_display_name,
      logo: row.company_data_logo,
      email: row.company_data_email,
      phone: row.company_data_phone,
    } : undefined,
    // Remove the flat company_data_* fields
    company_data_id: undefined,
    company_data_name: undefined,
    company_data_display_name: undefined,
    company_data_logo: undefined,
    company_data_email: undefined,
    company_data_phone: undefined,
  }));
};

/**
 * Get users by role (excluding company records and joining with companies table)
 */
export const getUsersByRole = async (role: User['role']): Promise<User[]> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT
      u.*,
      c.id as company_data_id,
      c.name as company_data_name,
      c.display_name as company_data_display_name,
      c.logo as company_data_logo,
      c.email as company_data_email,
      c.phone as company_data_phone
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.role = $1 AND u.is_active = TRUE AND u.id NOT LIKE 'company-%' AND u.company_id IS NOT NULL
    ORDER BY u.created_at DESC`,
    [role]
  );

  // Transform the flat result into nested structure
  return result.rows.map(row => ({
    ...row,
    companyData: row.company_data_id ? {
      id: row.company_data_id,
      name: row.company_data_name,
      display_name: row.company_data_display_name,
      logo: row.company_data_logo,
      email: row.company_data_email,
      phone: row.company_data_phone,
    } : undefined,
    company_data_id: undefined,
    company_data_name: undefined,
    company_data_display_name: undefined,
    company_data_logo: undefined,
    company_data_email: undefined,
    company_data_phone: undefined,
  }));
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
      id, user_id, email, phone, name, password_hash, role, company, company_id, company_logo, user_logo, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
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
      input.company_id || null,
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
  if (input.company_id !== undefined) {
    updates.push(`company_id = $${paramCount++}`);
    values.push(input.company_id);
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
  if (input.is_admin !== undefined) {
    updates.push(`is_admin = $${paramCount++}`);
    values.push(input.is_admin);
  }
  if (input.approval_status !== undefined) {
    updates.push(`approval_status = $${paramCount++}`);
    values.push(input.approval_status);
  }
  // Only update approved_by if it has a valid value (not null/undefined)
  // This prevents foreign key constraint violation
  if (input.approved_by !== undefined && input.approved_by !== null) {
    updates.push(`approved_by = $${paramCount++}`);
    values.push(input.approved_by);
  }
  if (input.approved_at !== undefined) {
    updates.push(`approved_at = $${paramCount++}`);
    values.push(input.approved_at);
  }
  if (input.rejection_reason !== undefined) {
    updates.push(`rejection_reason = $${paramCount++}`);
    values.push(input.rejection_reason);
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
 * Excludes company records from users table
 */
export const findUserByName = async (name: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM users
     WHERE (name ILIKE $1 OR company ILIKE $1)
     AND is_active = TRUE
     AND id NOT LIKE 'company-%'
     LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};

/**
 * Find load owner by name (company or name)
 * Excludes company records from users table
 */
export const findLoadOwnerByName = async (name: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM users WHERE (name ILIKE $1 OR company ILIKE $1)
     AND role = 'load_owner' AND is_active = TRUE AND id NOT LIKE 'company-%' LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};

/**
 * Find transporter by name (company or name)
 * Excludes company records from users table
 */
export const findTransporterByName = async (name: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM users WHERE (name ILIKE $1 OR company ILIKE $1)
     AND role = 'vehicle_owner' AND is_active = TRUE AND id NOT LIKE 'company-%' LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};

/**
 * Get pending user approval requests
 * Optionally filter by company_id for company admins
 */
export const getPendingUserApprovals = async (companyId?: string): Promise<User[]> => {
  const db = getDatabase();
  let query = `SELECT * FROM users WHERE approval_status = 'pending' AND is_active = TRUE AND company_id IS NOT NULL`;
  const values: any[] = [];

  if (companyId) {
    query += ` AND company_id = $1`;
    values.push(companyId);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Approve a user
 */
export const approveUser = async (userId: string, approvedBy: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `UPDATE users
     SET approval_status = 'approved',
         approved_by = $1,
         approved_at = CURRENT_TIMESTAMP,
         rejection_reason = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [approvedBy, userId]
  );
  return result.rows[0] || null;
};

/**
 * Reject a user
 */
export const rejectUser = async (userId: string, rejectedBy: string, reason: string): Promise<User | null> => {
  const db = getDatabase();
  const result = await db.query(
    `UPDATE users
     SET approval_status = 'rejected',
         approved_by = $1,
         approved_at = CURRENT_TIMESTAMP,
         rejection_reason = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [rejectedBy, reason, userId]
  );
  return result.rows[0] || null;
};

/**
 * Get users by company ID
 */
export const getUsersByCompanyId = async (companyId: string): Promise<User[]> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM users WHERE company_id = $1 AND is_active = TRUE ORDER BY created_at ASC`,
    [companyId]
  );
  return result.rows;
};

/**
 * Check if user is the first user of a company
 */
export const isFirstUserOfCompany = async (companyId: string): Promise<boolean> => {
  const users = await getUsersByCompanyId(companyId);
  return users.length === 0;
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
  getPendingUserApprovals,
  approveUser,
  rejectUser,
  getUsersByCompanyId,
  isFirstUserOfCompany,
};
