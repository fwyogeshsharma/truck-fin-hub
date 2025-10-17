import { getDatabase } from '../database.js';
/**
 * Get bank account by ID
 */
export const getBankAccount = async (id) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM bank_accounts WHERE id = $1', [id]);
    return result.rows[0] || null;
};
/**
 * Get all bank accounts for a user
 */
export const getBankAccountsByUser = async (userId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM bank_accounts WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC', [userId]);
    return result.rows;
};
/**
 * Get primary bank account for a user
 */
export const getPrimaryBankAccount = async (userId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM bank_accounts WHERE user_id = $1 AND is_primary = TRUE LIMIT 1', [userId]);
    return result.rows[0] || null;
};
/**
 * Get verified bank accounts for a user
 */
export const getVerifiedBankAccounts = async (userId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM bank_accounts WHERE user_id = $1 AND is_verified = TRUE ORDER BY is_primary DESC, created_at DESC', [userId]);
    return result.rows;
};
/**
 * Create bank account
 */
export const createBankAccount = async (input) => {
    const db = await getDatabase();
    const id = `ba-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // If setting as primary, unset other primary accounts
    if (input.is_primary) {
        await db.query('UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = $1', [input.user_id]);
    }
    await db.query(`
    INSERT INTO bank_accounts (
      id, user_id, account_holder_name, account_number, ifsc_code, bank_name, account_type, is_primary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
        id,
        input.user_id,
        input.account_holder_name,
        input.account_number,
        input.ifsc_code,
        input.bank_name,
        input.account_type,
        input.is_primary || false
    ]);
    const account = await getBankAccount(id);
    if (!account) {
        throw new Error('Failed to create bank account');
    }
    return account;
};
/**
 * Update bank account
 */
export const updateBankAccount = async (id, input) => {
    const db = await getDatabase();
    const account = await getBankAccount(id);
    if (!account)
        return null;
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (input.account_holder_name !== undefined) {
        updates.push(`account_holder_name = $${paramIndex}`);
        values.push(input.account_holder_name);
        paramIndex++;
    }
    if (input.account_number !== undefined) {
        updates.push(`account_number = $${paramIndex}`);
        values.push(input.account_number);
        paramIndex++;
    }
    if (input.ifsc_code !== undefined) {
        updates.push(`ifsc_code = $${paramIndex}`);
        values.push(input.ifsc_code);
        paramIndex++;
    }
    if (input.bank_name !== undefined) {
        updates.push(`bank_name = $${paramIndex}`);
        values.push(input.bank_name);
        paramIndex++;
    }
    if (input.account_type !== undefined) {
        updates.push(`account_type = $${paramIndex}`);
        values.push(input.account_type);
        paramIndex++;
    }
    if (input.is_verified !== undefined) {
        updates.push(`is_verified = $${paramIndex}`);
        values.push(input.is_verified);
        paramIndex++;
    }
    if (input.is_primary !== undefined) {
        // If setting as primary, unset other primary accounts
        if (input.is_primary) {
            await db.query('UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = $1', [account.user_id]);
        }
        updates.push(`is_primary = $${paramIndex}`);
        values.push(input.is_primary);
        paramIndex++;
    }
    if (updates.length === 0)
        return account;
    values.push(id);
    await db.query(`
    UPDATE bank_accounts SET ${updates.join(', ')} WHERE id = $${paramIndex}
  `, values);
    return await getBankAccount(id);
};
/**
 * Delete bank account
 */
export const deleteBankAccount = async (id) => {
    const db = await getDatabase();
    const result = await db.query('DELETE FROM bank_accounts WHERE id = $1', [id]);
    return result.rowCount > 0;
};
/**
 * Set bank account as primary
 */
export const setPrimaryBankAccount = async (id) => {
    const account = await getBankAccount(id);
    if (!account)
        return null;
    return await updateBankAccount(id, { is_primary: true });
};
/**
 * Verify bank account
 */
export const verifyBankAccount = async (id) => {
    return await updateBankAccount(id, { is_verified: true });
};
export default {
    getBankAccount,
    getBankAccountsByUser,
    getPrimaryBankAccount,
    getVerifiedBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setPrimaryBankAccount,
    verifyBankAccount,
};
