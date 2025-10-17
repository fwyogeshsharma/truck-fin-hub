// ============================================================
// DEPRECATED - USE users.ts INSTEAD
// This file is a duplicate kept for backward compatibility.
// All new code should import from users.ts
// ============================================================
import { getDatabase } from '../database.js';
import bcrypt from 'bcryptjs';
/**
 * Get user by ID
 */
export const getUserById = async (id) => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
};
/**
 * Get user by email
 */
export const getUserByEmail = async (email) => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};
/**
 * Get user by user_id
 */
export const getUserByUserId = async (userId) => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
};
/**
 * Get user by phone
 */
export const getUserByPhone = async (phone) => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0] || null;
};
/**
 * Get all users
 */
export const getAllUsers = async () => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC');
    return result.rows;
};
/**
 * Get users by role
 */
export const getUsersByRole = async (role) => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM users WHERE role = $1 AND is_active = TRUE ORDER BY created_at DESC', [role]);
    return result.rows;
};
/**
 * Create new user
 */
export const createUser = async (input) => {
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
    const result = await db.query(`INSERT INTO users (
      id, user_id, email, phone, name, password_hash, role, company, company_logo, user_logo, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
    RETURNING *`, [
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
    ]);
    return result.rows[0];
};
/**
 * Update user
 */
export const updateUser = async (id, input) => {
    const user = await getUserById(id);
    if (!user) {
        return null;
    }
    const updates = [];
    const values = [];
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
    const result = await db.query(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`, values);
    return result.rows[0] || null;
};
/**
 * Delete user (soft delete - set is_active to FALSE)
 */
export const deleteUser = async (id) => {
    const db = getDatabase();
    const result = await db.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
};
/**
 * Verify user password
 */
export const verifyPassword = async (email, password) => {
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
export const updatePassword = async (id, newPassword) => {
    const db = getDatabase();
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const result = await db.query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [passwordHash, id]);
    return (result.rowCount || 0) > 0;
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
