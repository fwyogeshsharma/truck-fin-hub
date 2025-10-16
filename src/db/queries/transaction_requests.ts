import { getDatabase } from '../database.js';

export interface TransactionRequest {
  id: string;
  user_id: string;
  request_type: 'add_money' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  transaction_image_url?: string;
  bank_account_id?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_name?: string;
  logifin_account_number?: string;
  logifin_ifsc_code?: string;
  logifin_account_holder?: string;
  processed_by?: string;
  processed_at?: string;
  transaction_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequestInput {
  user_id: string;
  request_type: 'add_money' | 'withdrawal';
  amount: number;
  transaction_image_url?: string;
  bank_account_id?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_name?: string;
}

export interface ProcessTransactionRequestInput {
  status: 'approved' | 'rejected';
  processed_by: string;
  transaction_id?: string;
  admin_notes?: string;
}

/**
 * Create a new transaction request
 */
export const createTransactionRequest = async (
  input: CreateTransactionRequestInput
): Promise<TransactionRequest> => {
  const db = getDatabase();

  const result = await db.query(
    `INSERT INTO transaction_requests (
      user_id, request_type, amount, transaction_image_url,
      bank_account_id, bank_account_number, bank_ifsc_code, bank_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      input.user_id,
      input.request_type,
      input.amount,
      input.transaction_image_url || null,
      input.bank_account_id || null,
      input.bank_account_number || null,
      input.bank_ifsc_code || null,
      input.bank_name || null,
    ]
  );

  return result.rows[0];
};

/**
 * Get transaction request by ID
 */
export const getTransactionRequestById = async (id: string): Promise<TransactionRequest | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM transaction_requests WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Get all transaction requests for a user
 */
export const getTransactionRequestsByUserId = async (userId: string): Promise<TransactionRequest[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM transaction_requests WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

/**
 * Get all transaction requests (for super admin)
 */
export const getAllTransactionRequests = async (
  status?: 'pending' | 'approved' | 'rejected'
): Promise<TransactionRequest[]> => {
  const db = getDatabase();

  if (status) {
    const result = await db.query(
      'SELECT * FROM transaction_requests WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows;
  }

  const result = await db.query('SELECT * FROM transaction_requests ORDER BY created_at DESC');
  return result.rows;
};

/**
 * Get pending transaction requests
 */
export const getPendingTransactionRequests = async (): Promise<TransactionRequest[]> => {
  return getAllTransactionRequests('pending');
};

/**
 * Process a transaction request (approve or reject)
 */
export const processTransactionRequest = async (
  id: string,
  input: ProcessTransactionRequestInput
): Promise<TransactionRequest | null> => {
  const db = getDatabase();

  const result = await db.query(
    `UPDATE transaction_requests
     SET status = $1, processed_by = $2, transaction_id = $3, admin_notes = $4,
         processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [input.status, input.processed_by, input.transaction_id || null, input.admin_notes || null, id]
  );

  return result.rows[0] || null;
};

/**
 * Get transaction requests with user details (for admin view)
 */
export const getTransactionRequestsWithUserDetails = async (
  status?: 'pending' | 'approved' | 'rejected'
): Promise<any[]> => {
  const db = getDatabase();

  let query = `
    SELECT
      tr.*,
      u.name as user_name,
      u.email as user_email,
      u.user_id as user_display_id,
      u.role as user_role
    FROM transaction_requests tr
    JOIN users u ON tr.user_id = u.id
  `;

  if (status) {
    query += ` WHERE tr.status = $1`;
  }

  query += ` ORDER BY tr.created_at DESC`;

  const result = status
    ? await db.query(query, [status])
    : await db.query(query);

  return result.rows;
};

/**
 * Delete a transaction request
 */
export const deleteTransactionRequest = async (id: string): Promise<boolean> => {
  const db = getDatabase();
  const result = await db.query('DELETE FROM transaction_requests WHERE id = $1', [id]);
  return result.rowCount > 0;
};

export default {
  createTransactionRequest,
  getTransactionRequestById,
  getTransactionRequestsByUserId,
  getAllTransactionRequests,
  getPendingTransactionRequests,
  processTransactionRequest,
  getTransactionRequestsWithUserDetails,
  deleteTransactionRequest,
};
