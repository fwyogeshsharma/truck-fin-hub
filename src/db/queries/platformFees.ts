import { getDatabase } from '../database.js';

export interface PlatformFee {
  id: string;
  trip_id: string;
  lender_id: string;
  lender_name: string;
  borrower_id: string;
  borrower_name: string;
  loan_amount: number;
  fee_percentage: number;
  fee_amount: number;
  collected_at: string;
  super_admin_transaction_id?: string;
  borrower_transaction_id?: string;
  created_at: string;
}

export interface CreatePlatformFeeInput {
  trip_id: string;
  lender_id: string;
  lender_name: string;
  borrower_id: string;
  borrower_name: string;
  loan_amount: number;
  fee_percentage: number;
  fee_amount: number;
  super_admin_transaction_id?: string;
  borrower_transaction_id?: string;
}

/**
 * Create a platform fee record
 */
export const createPlatformFee = async (input: CreatePlatformFeeInput): Promise<PlatformFee> => {
  const db = getDatabase();
  const result = await db.query(
    `INSERT INTO platform_fees (
      trip_id,
      lender_id,
      lender_name,
      borrower_id,
      borrower_name,
      loan_amount,
      fee_percentage,
      fee_amount,
      super_admin_transaction_id,
      borrower_transaction_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      input.trip_id,
      input.lender_id,
      input.lender_name,
      input.borrower_id,
      input.borrower_name,
      input.loan_amount,
      input.fee_percentage,
      input.fee_amount,
      input.super_admin_transaction_id || null,
      input.borrower_transaction_id || null,
    ]
  );
  return result.rows[0];
};

/**
 * Get all platform fees
 */
export const getAllPlatformFees = async (): Promise<PlatformFee[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM platform_fees ORDER BY collected_at DESC'
  );
  return result.rows;
};

/**
 * Get platform fees by date range
 */
export const getPlatformFeesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<PlatformFee[]> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT * FROM platform_fees
     WHERE collected_at >= $1 AND collected_at <= $2
     ORDER BY collected_at DESC`,
    [startDate, endDate]
  );
  return result.rows;
};

/**
 * Get platform fees by lender
 */
export const getPlatformFeesByLender = async (lenderId: string): Promise<PlatformFee[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM platform_fees WHERE lender_id = $1 ORDER BY collected_at DESC',
    [lenderId]
  );
  return result.rows;
};

/**
 * Get platform fees by borrower
 */
export const getPlatformFeesByBorrower = async (borrowerId: string): Promise<PlatformFee[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM platform_fees WHERE borrower_id = $1 ORDER BY collected_at DESC',
    [borrowerId]
  );
  return result.rows;
};

/**
 * Get platform fees by trip
 */
export const getPlatformFeesByTrip = async (tripId: string): Promise<PlatformFee[]> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM platform_fees WHERE trip_id = $1',
    [tripId]
  );
  return result.rows;
};

/**
 * Get total fees collected
 */
export const getTotalFeesCollected = async (): Promise<number> => {
  const db = getDatabase();
  const result = await db.query(
    'SELECT COALESCE(SUM(fee_amount), 0) as total FROM platform_fees'
  );
  return parseFloat(result.rows[0]?.total || '0');
};

/**
 * Get total fees collected by date range
 */
export const getTotalFeesCollectedByDateRange = async (
  startDate: string,
  endDate: string
): Promise<number> => {
  const db = getDatabase();
  const result = await db.query(
    `SELECT COALESCE(SUM(fee_amount), 0) as total FROM platform_fees
     WHERE collected_at >= $1 AND collected_at <= $2`,
    [startDate, endDate]
  );
  return parseFloat(result.rows[0]?.total || '0');
};

/**
 * Get platform fee statistics
 */
export const getPlatformFeeStats = async (): Promise<{
  total_fees: number;
  total_transactions: number;
  average_fee: number;
  total_loan_amount: number;
}> => {
  const db = getDatabase();
  const result = await db.query(`
    SELECT
      COALESCE(SUM(fee_amount), 0) as total_fees,
      COUNT(*) as total_transactions,
      COALESCE(AVG(fee_amount), 0) as average_fee,
      COALESCE(SUM(loan_amount), 0) as total_loan_amount
    FROM platform_fees
  `);

  const row = result.rows[0];
  return {
    total_fees: parseFloat(row.total_fees || '0'),
    total_transactions: parseInt(row.total_transactions || '0'),
    average_fee: parseFloat(row.average_fee || '0'),
    total_loan_amount: parseFloat(row.total_loan_amount || '0'),
  };
};
