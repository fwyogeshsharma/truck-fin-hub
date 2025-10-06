import { getDatabase } from '../database';

export interface Investment {
  id: string;
  lender_id: string;
  trip_id: string;
  amount: number;
  interest_rate: number;
  expected_return: number;
  status: 'escrowed' | 'active' | 'completed' | 'defaulted';
  invested_at: string;
  maturity_date: string;
  completed_at?: string;
}

export interface CreateInvestmentInput {
  lender_id: string;
  trip_id: string;
  amount: number;
  interest_rate: number;
  expected_return: number;
  maturity_date: string;
}

/**
 * Get investment by ID
 */
export const getInvestment = (id: string): Investment | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE id = ?');
  return stmt.get(id) as Investment | null;
};

/**
 * Get all investments
 */
export const getAllInvestments = (): Investment[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments ORDER BY invested_at DESC');
  return stmt.all() as Investment[];
};

/**
 * Get investments by lender
 */
export const getInvestmentsByLender = (lenderId: string): Investment[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE lender_id = ? ORDER BY invested_at DESC');
  return stmt.all(lenderId) as Investment[];
};

/**
 * Get investments by trip
 */
export const getInvestmentsByTrip = (tripId: string): Investment[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE trip_id = ? ORDER BY invested_at DESC');
  return stmt.all(tripId) as Investment[];
};

/**
 * Get investments by status
 */
export const getInvestmentsByStatus = (status: Investment['status']): Investment[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE status = ? ORDER BY invested_at DESC');
  return stmt.all(status) as Investment[];
};

/**
 * Get investments by lender and status
 */
export const getInvestmentsByLenderAndStatus = (lenderId: string, status: Investment['status']): Investment[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE lender_id = ? AND status = ? ORDER BY invested_at DESC');
  return stmt.all(lenderId, status) as Investment[];
};

/**
 * Get investments by trip and lender
 */
export const getInvestmentsByTripAndLender = (tripId: string, lenderId: string): Investment[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE trip_id = ? AND lender_id = ? ORDER BY invested_at DESC');
  return stmt.all(tripId, lenderId) as Investment[];
};

/**
 * Create investment
 */
export const createInvestment = (input: CreateInvestmentInput): Investment => {
  const db = getDatabase();
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO investments (
      id, lender_id, trip_id, amount, interest_rate, expected_return, status, maturity_date
    ) VALUES (?, ?, ?, ?, ?, ?, 'escrowed', ?)
  `);

  stmt.run(
    id,
    input.lender_id,
    input.trip_id,
    input.amount,
    input.interest_rate,
    input.expected_return,
    input.maturity_date
  );

  const investment = getInvestment(id);
  if (!investment) {
    throw new Error('Failed to create investment');
  }

  return investment;
};

/**
 * Update investment status
 */
export const updateInvestmentStatus = (id: string, status: Investment['status']): Investment | null => {
  const db = getDatabase();

  const investment = getInvestment(id);
  if (!investment) return null;

  const updates = ['status = ?'];
  const values: any[] = [status];

  if (status === 'completed') {
    updates.push('completed_at = datetime(\'now\')');
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE investments SET ${updates.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getInvestment(id);
};

/**
 * Update investment
 */
export const updateInvestment = (id: string, updates: Partial<Investment>): Investment | null => {
  const db = getDatabase();

  const investment = getInvestment(id);
  if (!investment) return null;

  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return investment;

  values.push(id);

  const stmt = db.prepare(`
    UPDATE investments SET ${fields.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);

  return getInvestment(id);
};

/**
 * Delete investment
 */
export const deleteInvestment = (id: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM investments WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Get active investments count by lender
 */
export const getActiveInvestmentsCount = (lenderId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM investments WHERE lender_id = ? AND status = ?');
  const result = stmt.get(lenderId, 'active') as { count: number };
  return result.count;
};

/**
 * Get total invested amount by lender
 */
export const getTotalInvestedByLender = (lenderId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(amount) as total FROM investments
    WHERE lender_id = ? AND status IN ('active', 'completed')
  `);
  const result = stmt.get(lenderId) as { total: number | null };
  return result.total || 0;
};

/**
 * Get total returns by lender
 */
export const getTotalReturnsByLender = (lenderId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(expected_return) as total FROM investments
    WHERE lender_id = ? AND status = 'completed'
  `);
  const result = stmt.get(lenderId) as { total: number | null };
  return result.total || 0;
};

export default {
  getInvestment,
  getAllInvestments,
  getInvestmentsByLender,
  getInvestmentsByTrip,
  getInvestmentsByStatus,
  getInvestmentsByLenderAndStatus,
  getInvestmentsByTripAndLender,
  createInvestment,
  updateInvestmentStatus,
  updateInvestment,
  deleteInvestment,
  getActiveInvestmentsCount,
  getTotalInvestedByLender,
  getTotalReturnsByLender,
};
