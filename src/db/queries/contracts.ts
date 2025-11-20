import { getDatabase } from '../database.js';

export interface Contract {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  file_data?: string;
  loan_percentage: number;
  ltv: number;
  penalty_after_due_date: number;
  contract_type: '2-party' | '3-party';
  validity_date: string;
  trip_stage?: string;
  party1_user_id: string;
  party1_name: string;
  party2_user_id: string;
  party2_name: string;
  party3_user_id?: string;
  party3_name?: string;
  party4_user_id: string;
  party4_name: string;
  status: 'active' | 'expired' | 'cancelled' | 'archived';
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContractInput {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  file_data?: string;
  loan_percentage: number;
  ltv: number;
  penalty_after_due_date: number;
  contract_type: '2-party' | '3-party';
  validity_date: string;
  trip_stage?: string;
  party1_user_id: string;
  party1_name: string;
  party2_user_id: string;
  party2_name: string;
  party3_user_id?: string;
  party3_name?: string;
  uploaded_by: string;
}

/**
 * Get all contracts
 */
export async function getAllContracts(): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    'SELECT * FROM contracts ORDER BY created_at DESC'
  );
  return result.rows;
}

/**
 * Get active contracts
 */
export async function getActiveContracts(): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    "SELECT * FROM contracts WHERE status = 'active' ORDER BY created_at DESC"
  );
  return result.rows;
}

/**
 * Get contract by ID
 */
export async function getContractById(id: string): Promise<Contract | null> {
  const db = await getDatabase();
  const result = await db.query(
    'SELECT * FROM contracts WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get contracts uploaded by a specific user
 */
export async function getContractsByUploader(uploaderId: string): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    'SELECT * FROM contracts WHERE uploaded_by = $1 ORDER BY created_at DESC',
    [uploaderId]
  );
  return result.rows;
}

/**
 * Get contracts where a user is any party
 */
export async function getContractsByParty(userId: string): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT * FROM contracts
     WHERE party1_user_id = $1
        OR party2_user_id = $1
        OR party3_user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get contracts between specific parties
 */
export async function getContractsBetweenParties(
  party1Id: string,
  party2Id: string
): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT * FROM contracts
     WHERE (party1_user_id = $1 AND party2_user_id = $2)
        OR (party1_user_id = $2 AND party2_user_id = $1)
     ORDER BY created_at DESC`,
    [party1Id, party2Id]
  );
  return result.rows;
}

/**
 * Create a new contract
 */
export async function createContract(input: CreateContractInput): Promise<Contract> {
  const db = await getDatabase();
  const {
    id,
    file_name,
    file_type,
    file_size,
    file_url,
    file_data,
    loan_percentage,
    ltv,
    penalty_after_due_date,
    contract_type,
    validity_date,
    trip_stage,
    party1_user_id,
    party1_name,
    party2_user_id,
    party2_name,
    party3_user_id,
    party3_name,
    uploaded_by,
  } = input;

  const result = await db.query(
    `INSERT INTO contracts (
      id, file_name, file_type, file_size, file_url, file_data,
      loan_percentage, ltv, penalty_after_due_date,
      contract_type, validity_date, trip_stage,
      party1_user_id, party1_name,
      party2_user_id, party2_name,
      party3_user_id, party3_name,
      uploaded_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING *`,
    [
      id, file_name, file_type, file_size, file_url, file_data,
      loan_percentage, ltv, penalty_after_due_date,
      contract_type, validity_date, trip_stage,
      party1_user_id, party1_name,
      party2_user_id, party2_name,
      party3_user_id, party3_name,
      uploaded_by,
    ]
  );

  return result.rows[0];
}

/**
 * Update contract status
 */
export async function updateContractStatus(
  id: string,
  status: 'active' | 'expired' | 'cancelled' | 'archived'
): Promise<Contract | null> {
  const db = await getDatabase();
  const result = await db.query(
    'UPDATE contracts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}

/**
 * Delete a contract
 */
export async function deleteContract(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.query(
    'DELETE FROM contracts WHERE id = $1',
    [id]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Get contracts count
 */
export async function getContractsCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.query('SELECT COUNT(*) FROM contracts');
  return parseInt(result.rows[0].count);
}

/**
 * Get active contracts count
 */
export async function getActiveContractsCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.query(
    "SELECT COUNT(*) FROM contracts WHERE status = 'active'"
  );
  return parseInt(result.rows[0].count);
}

/**
 * Get contracts expiring soon (within specified days)
 */
export async function getContractsExpiringSoon(days: number = 30): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT * FROM contracts
     WHERE status = 'active'
       AND validity_date <= CURRENT_DATE + INTERVAL '${days} days'
       AND validity_date >= CURRENT_DATE
     ORDER BY validity_date ASC`,
  );
  return result.rows;
}

/**
 * Get expired contracts
 */
export async function getExpiredContracts(): Promise<Contract[]> {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT * FROM contracts
     WHERE status = 'active'
       AND validity_date < CURRENT_DATE
     ORDER BY validity_date DESC`
  );
  return result.rows;
}

/**
 * Auto-expire contracts past their validity date
 */
export async function autoExpireContracts(): Promise<number> {
  const db = await getDatabase();
  const result = await db.query(
    `UPDATE contracts
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'active'
       AND validity_date < CURRENT_DATE`
  );
  return result.rowCount || 0;
}

/**
 * Get contract statistics for a user
 */
export async function getUserContractStats(userId: string) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT
      COUNT(*) as total_contracts,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
      COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_contracts,
      COUNT(CASE WHEN party1_user_id = $1 THEN 1 END) as as_party1,
      COUNT(CASE WHEN party2_user_id = $1 THEN 1 END) as as_party2,
      COUNT(CASE WHEN party3_user_id = $1 THEN 1 END) as as_party3
     FROM contracts
     WHERE party1_user_id = $1
        OR party2_user_id = $1
        OR party3_user_id = $1`,
    [userId]
  );
  return result.rows[0];
}
