import { getDatabase } from '../database';

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
export const getTransaction = (id: string): Transaction | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  return stmt.get(id) as Transaction | null;
};

/**
 * Get all transactions
 */
export const getAllTransactions = (): Transaction[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC');
  return stmt.all() as Transaction[];
};

/**
 * Get transactions by user
 */
export const getTransactionsByUser = (userId: string, limit?: number): Transaction[] => {
  const db = getDatabase();
  const query = `SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC${limit ? ' LIMIT ?' : ''}`;
  const stmt = db.prepare(query);
  return (limit ? stmt.all(userId, limit) : stmt.all(userId)) as Transaction[];
};

/**
 * Get transactions by user and type
 */
export const getTransactionsByUserAndType = (userId: string, type: Transaction['type']): Transaction[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE user_id = ? AND type = ? ORDER BY timestamp DESC');
  return stmt.all(userId, type) as Transaction[];
};

/**
 * Get transactions by user and category
 */
export const getTransactionsByUserAndCategory = (userId: string, category: Transaction['category']): Transaction[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE user_id = ? AND category = ? ORDER BY timestamp DESC');
  return stmt.all(userId, category) as Transaction[];
};

/**
 * Create transaction
 */
export const createTransaction = (input: CreateTransactionInput): Transaction => {
  const db = getDatabase();
  const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO transactions (
      id, user_id, type, amount, category, description, balance_after
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.user_id,
    input.type,
    input.amount,
    input.category,
    input.description,
    input.balance_after
  );

  const transaction = getTransaction(id);
  if (!transaction) {
    throw new Error('Failed to create transaction');
  }

  return transaction;
};

/**
 * Get recent transactions by user
 */
export const getRecentTransactions = (userId: string, limit: number = 10): Transaction[] => {
  return getTransactionsByUser(userId, limit);
};

/**
 * Get transaction count by user
 */
export const getTransactionCount = (userId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?');
  const result = stmt.get(userId) as { count: number };
  return result.count;
};

/**
 * Get total credited amount by user
 */
export const getTotalCreditedByUser = (userId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(amount) as total FROM transactions
    WHERE user_id = ? AND type = 'credit'
  `);
  const result = stmt.get(userId) as { total: number | null };
  return result.total || 0;
};

/**
 * Get total debited amount by user
 */
export const getTotalDebitedByUser = (userId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(amount) as total FROM transactions
    WHERE user_id = ? AND type = 'debit'
  `);
  const result = stmt.get(userId) as { total: number | null };
  return result.total || 0;
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
