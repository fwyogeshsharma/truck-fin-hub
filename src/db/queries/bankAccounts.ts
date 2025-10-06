import { getDatabase } from '../database';

export interface BankAccount {
  id: string;
  user_id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  account_type: 'savings' | 'current';
  is_verified: number;
  is_primary: number;
  created_at: string;
}

export interface CreateBankAccountInput {
  user_id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  account_type: 'savings' | 'current';
  is_primary?: boolean;
}

export interface UpdateBankAccountInput {
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  account_type?: 'savings' | 'current';
  is_verified?: boolean;
  is_primary?: boolean;
}

/**
 * Get bank account by ID
 */
export const getBankAccount = (id: string): BankAccount | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM bank_accounts WHERE id = ?');
  return stmt.get(id) as BankAccount | null;
};

/**
 * Get all bank accounts for a user
 */
export const getBankAccountsByUser = (userId: string): BankAccount[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC');
  return stmt.all(userId) as BankAccount[];
};

/**
 * Get primary bank account for a user
 */
export const getPrimaryBankAccount = (userId: string): BankAccount | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ? AND is_primary = 1 LIMIT 1');
  return stmt.get(userId) as BankAccount | null;
};

/**
 * Get verified bank accounts for a user
 */
export const getVerifiedBankAccounts = (userId: string): BankAccount[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM bank_accounts WHERE user_id = ? AND is_verified = 1 ORDER BY is_primary DESC, created_at DESC');
  return stmt.all(userId) as BankAccount[];
};

/**
 * Create bank account
 */
export const createBankAccount = (input: CreateBankAccountInput): BankAccount => {
  const db = getDatabase();
  const id = `ba-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // If setting as primary, unset other primary accounts
  if (input.is_primary) {
    const unsetStmt = db.prepare('UPDATE bank_accounts SET is_primary = 0 WHERE user_id = ?');
    unsetStmt.run(input.user_id);
  }

  const stmt = db.prepare(`
    INSERT INTO bank_accounts (
      id, user_id, account_holder_name, account_number, ifsc_code, bank_name, account_type, is_primary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.user_id,
    input.account_holder_name,
    input.account_number,
    input.ifsc_code,
    input.bank_name,
    input.account_type,
    input.is_primary ? 1 : 0
  );

  const account = getBankAccount(id);
  if (!account) {
    throw new Error('Failed to create bank account');
  }

  return account;
};

/**
 * Update bank account
 */
export const updateBankAccount = (id: string, input: UpdateBankAccountInput): BankAccount | null => {
  const db = getDatabase();

  const account = getBankAccount(id);
  if (!account) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.account_holder_name !== undefined) {
    updates.push('account_holder_name = ?');
    values.push(input.account_holder_name);
  }
  if (input.account_number !== undefined) {
    updates.push('account_number = ?');
    values.push(input.account_number);
  }
  if (input.ifsc_code !== undefined) {
    updates.push('ifsc_code = ?');
    values.push(input.ifsc_code);
  }
  if (input.bank_name !== undefined) {
    updates.push('bank_name = ?');
    values.push(input.bank_name);
  }
  if (input.account_type !== undefined) {
    updates.push('account_type = ?');
    values.push(input.account_type);
  }
  if (input.is_verified !== undefined) {
    updates.push('is_verified = ?');
    values.push(input.is_verified ? 1 : 0);
  }
  if (input.is_primary !== undefined) {
    // If setting as primary, unset other primary accounts
    if (input.is_primary) {
      const unsetStmt = db.prepare('UPDATE bank_accounts SET is_primary = 0 WHERE user_id = ?');
      unsetStmt.run(account.user_id);
    }
    updates.push('is_primary = ?');
    values.push(input.is_primary ? 1 : 0);
  }

  if (updates.length === 0) return account;

  values.push(id);

  const stmt = db.prepare(`
    UPDATE bank_accounts SET ${updates.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getBankAccount(id);
};

/**
 * Delete bank account
 */
export const deleteBankAccount = (id: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM bank_accounts WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Set bank account as primary
 */
export const setPrimaryBankAccount = (id: string): BankAccount | null => {
  const account = getBankAccount(id);
  if (!account) return null;

  return updateBankAccount(id, { is_primary: true });
};

/**
 * Verify bank account
 */
export const verifyBankAccount = (id: string): BankAccount | null => {
  return updateBankAccount(id, { is_verified: true });
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
