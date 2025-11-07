import pool from '../index.ts';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedContract {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_data: Buffer;
  loan_percentage: number;
  ltv: number;
  penalty_after_due_date: number;
  contract_type: '2-party' | '3-party';
  party1_name: string;
  party2_name: string;
  party3_name?: string;
  validity_date: Date;
  trip_stage?: string;
  uploaded_at: Date;
  updated_at: Date;
}

export interface CreateUploadedContractInput {
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_data: Buffer;
  loan_percentage: number;
  ltv: number;
  penalty_after_due_date: number;
  contract_type: '2-party' | '3-party';
  party1_name: string;
  party2_name: string;
  party3_name?: string;
  validity_date: string;
  trip_stage?: string;
}

export interface UpdateUploadedContractInput {
  loan_percentage?: number;
  ltv?: number;
  penalty_after_due_date?: number;
  contract_type?: '2-party' | '3-party';
  party1_name?: string;
  party2_name?: string;
  party3_name?: string;
  validity_date?: string;
  trip_stage?: string;
}

/**
 * Get all uploaded contracts for a user
 */
export async function getUploadedContractsByUser(userId: string): Promise<UploadedContract[]> {
  const result = await pool.query(
    `SELECT * FROM uploaded_contracts WHERE user_id = $1 ORDER BY uploaded_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get a specific uploaded contract by ID
 */
export async function getUploadedContractById(id: string): Promise<UploadedContract | null> {
  const result = await pool.query(
    `SELECT * FROM uploaded_contracts WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get uploaded contracts without file data (for listing)
 */
export async function getUploadedContractsMetadataByUser(userId: string): Promise<Omit<UploadedContract, 'file_data'>[]> {
  const result = await pool.query(
    `SELECT id, user_id, file_name, file_size, file_type, loan_percentage, ltv,
     penalty_after_due_date, contract_type, party1_name, party2_name, party3_name,
     validity_date, trip_stage, uploaded_at, updated_at
     FROM uploaded_contracts WHERE user_id = $1 ORDER BY uploaded_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Create a new uploaded contract
 */
export async function createUploadedContract(input: CreateUploadedContractInput): Promise<UploadedContract> {
  const id = uuidv4();
  const now = new Date();

  const result = await pool.query(
    `INSERT INTO uploaded_contracts (
      id, user_id, file_name, file_size, file_type, file_data,
      loan_percentage, ltv, penalty_after_due_date, contract_type,
      party1_name, party2_name, party3_name, validity_date, trip_stage,
      uploaded_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      id,
      input.user_id,
      input.file_name,
      input.file_size,
      input.file_type,
      input.file_data,
      input.loan_percentage,
      input.ltv,
      input.penalty_after_due_date,
      input.contract_type,
      input.party1_name,
      input.party2_name,
      input.party3_name || null,
      input.validity_date,
      input.trip_stage || null,
      now,
      now
    ]
  );

  return result.rows[0];
}

/**
 * Update an uploaded contract
 */
export async function updateUploadedContract(
  id: string,
  input: UpdateUploadedContractInput
): Promise<UploadedContract | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.loan_percentage !== undefined) {
    updates.push(`loan_percentage = $${paramIndex++}`);
    values.push(input.loan_percentage);
  }
  if (input.ltv !== undefined) {
    updates.push(`ltv = $${paramIndex++}`);
    values.push(input.ltv);
  }
  if (input.penalty_after_due_date !== undefined) {
    updates.push(`penalty_after_due_date = $${paramIndex++}`);
    values.push(input.penalty_after_due_date);
  }
  if (input.contract_type !== undefined) {
    updates.push(`contract_type = $${paramIndex++}`);
    values.push(input.contract_type);
  }
  if (input.party1_name !== undefined) {
    updates.push(`party1_name = $${paramIndex++}`);
    values.push(input.party1_name);
  }
  if (input.party2_name !== undefined) {
    updates.push(`party2_name = $${paramIndex++}`);
    values.push(input.party2_name);
  }
  if (input.party3_name !== undefined) {
    updates.push(`party3_name = $${paramIndex++}`);
    values.push(input.party3_name);
  }
  if (input.validity_date !== undefined) {
    updates.push(`validity_date = $${paramIndex++}`);
    values.push(input.validity_date);
  }
  if (input.trip_stage !== undefined) {
    updates.push(`trip_stage = $${paramIndex++}`);
    values.push(input.trip_stage);
  }

  if (updates.length === 0) {
    return getUploadedContractById(id);
  }

  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());
  values.push(id);

  const result = await pool.query(
    `UPDATE uploaded_contracts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Delete an uploaded contract
 */
export async function deleteUploadedContract(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM uploaded_contracts WHERE id = $1`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Delete all uploaded contracts for a user
 */
export async function deleteUploadedContractsByUser(userId: string): Promise<number> {
  const result = await pool.query(
    `DELETE FROM uploaded_contracts WHERE user_id = $1`,
    [userId]
  );
  return result.rowCount || 0;
}
