import { getDatabase } from '../database.js';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  category: 'investment' | 'return' | 'payment' | 'refund' | 'fee' | 'withdrawal';
  description: string;
  balance_after: number;
  timestamp: string;
}

export interface CreateTransactionInput {
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  category: Transaction['category'];
  description: string;
  balance_after: number;
}

/**
 * Get transaction by ID
 */
export const getTransaction = async (id: string): Promise<Transaction | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);
  const txn = result.rows[0];
  if (!txn) return null;

  return {
    ...txn,
    amount: Number(txn.amount),
    balance_after: Number(txn.balance_after),
  };
};

/**
 * Get all transactions
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM transactions ORDER BY timestamp DESC');
  return result.rows.map(txn => ({
    ...txn,
    amount: Number(txn.amount),
    balance_after: Number(txn.balance_after),
  }));
};

/**
 * Get transactions by user
 */
export const getTransactionsByUser = async (userId: string, limit?: number): Promise<Transaction[]> => {
  const db = getDatabase();
  const query = limit
    ? 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2'
    : 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC';
  const params = limit ? [userId, limit] : [userId];
  const result = await db.query(query, params);
  return result.rows.map(txn => ({
    ...txn,
    amount: Number(txn.amount),
    balance_after: Number(txn.balance_after),
  }));
};

/**
 * Get transactions by user and type
 */
export const getTransactionsByUserAndType = async (
  userId: string,
  type: Transaction['type']
): Promise<Transaction[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM transactions WHERE user_id = $1 AND type = $2 ORDER BY timestamp DESC',
    [userId, type]
  );
  return result.rows.map(txn => ({
    ...txn,
    amount: Number(txn.amount),
    balance_after: Number(txn.balance_after),
  }));
};

/**
 * Get transactions by user and category
 */
export const getTransactionsByUserAndCategory = async (
  userId: string,
  category: Transaction['category']
): Promise<Transaction[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM transactions WHERE user_id = $1 AND category = $2 ORDER BY timestamp DESC',
    [userId, category]
  );
  return result.rows.map(txn => ({
    ...txn,
    amount: Number(txn.amount),
    balance_after: Number(txn.balance_after),
  }));
};

/**
 * Create transaction
 */
export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  const db = getDatabase();
  const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result = await db.query(
    `INSERT INTO transactions (
      id, user_id, type, amount, category, description, balance_after
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      id,
      input.user_id,
      input.type,
      input.amount,
      input.category,
      input.description,
      input.balance_after,
    ]
  );

  const transaction = result.rows[0];
  if (!transaction) {
    throw new Error('Failed to create transaction');
  }

  return {
    ...transaction,
    amount: Number(transaction.amount),
    balance_after: Number(transaction.balance_after),
  };
};

/**
 * Get recent transactions by user
 */
export const getRecentTransactions = async (userId: string, limit: number = 10): Promise<Transaction[]> => {
  return await getTransactionsByUser(userId, limit);
};

/**
 * Get transaction count by user
 */
export const getTransactionCount = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const result = await db.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1', [userId]);
  return parseInt(result.rows[0]?.count || '0');
};

/**
 * Get total credited amount by user
 */
export const getTotalCreditedByUser = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT SUM(amount) as total FROM transactions
    WHERE user_id = $1 AND type = 'credit'`,
    [userId]
  );
  return Number(result.rows[0]?.total) || 0;
};

/**
 * Get total debited amount by user
 */
export const getTotalDebitedByUser = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT SUM(amount) as total FROM transactions
    WHERE user_id = $1 AND type = 'debit'`,
    [userId]
  );
  return Number(result.rows[0]?.total) || 0;
};

export default {
  getTransaction,
  getAllTransactions,
  getTransactionsByUser,
  getTransactionsByUserAndType,
  getTransactionsByUserAndCategory,
  createTransaction,
  getRecentTransactions,
  getTransactionCount,
  getTotalCreditedByUser,
  getTotalDebitedByUser,
};
