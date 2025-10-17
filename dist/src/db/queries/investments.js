import { getDatabase } from '../database.js';
/**
 * Get investment by ID
 */
export const getInvestment = async (id) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments WHERE id = $1', [id]);
    const investment = result.rows[0];
    if (!investment)
        return null;
    return {
        ...investment,
        amount: Number(investment.amount),
        interest_rate: Number(investment.interest_rate),
        expected_return: Number(investment.expected_return),
    };
};
/**
 * Get all investments
 */
export const getAllInvestments = async () => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments ORDER BY invested_at DESC');
    return result.rows.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
        interest_rate: Number(inv.interest_rate),
        expected_return: Number(inv.expected_return),
    }));
};
/**
 * Get investments by lender
 */
export const getInvestmentsByLender = async (lenderId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments WHERE lender_id = $1 ORDER BY invested_at DESC', [lenderId]);
    return result.rows.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
        interest_rate: Number(inv.interest_rate),
        expected_return: Number(inv.expected_return),
    }));
};
/**
 * Get investments by trip
 */
export const getInvestmentsByTrip = async (tripId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments WHERE trip_id = $1 ORDER BY invested_at DESC', [tripId]);
    return result.rows.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
        interest_rate: Number(inv.interest_rate),
        expected_return: Number(inv.expected_return),
    }));
};
/**
 * Get investments by status
 */
export const getInvestmentsByStatus = async (status) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments WHERE status = $1 ORDER BY invested_at DESC', [status]);
    return result.rows.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
        interest_rate: Number(inv.interest_rate),
        expected_return: Number(inv.expected_return),
    }));
};
/**
 * Get investments by lender and status
 */
export const getInvestmentsByLenderAndStatus = async (lenderId, status) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments WHERE lender_id = $1 AND status = $2 ORDER BY invested_at DESC', [lenderId, status]);
    return result.rows.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
        interest_rate: Number(inv.interest_rate),
        expected_return: Number(inv.expected_return),
    }));
};
/**
 * Get investments by trip and lender
 */
export const getInvestmentsByTripAndLender = async (tripId, lenderId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM investments WHERE trip_id = $1 AND lender_id = $2 ORDER BY invested_at DESC', [tripId, lenderId]);
    return result.rows.map(inv => ({
        ...inv,
        amount: Number(inv.amount),
        interest_rate: Number(inv.interest_rate),
        expected_return: Number(inv.expected_return),
    }));
};
/**
 * Create investment
 */
export const createInvestment = async (input) => {
    const db = await getDatabase();
    const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.query(`
    INSERT INTO investments (
      id, lender_id, trip_id, amount, interest_rate, expected_return, status, maturity_date
    ) VALUES ($1, $2, $3, $4, $5, $6, 'escrowed', $7)
  `, [
        id,
        input.lender_id,
        input.trip_id,
        input.amount,
        input.interest_rate,
        input.expected_return,
        input.maturity_date
    ]);
    const investment = await getInvestment(id);
    if (!investment) {
        throw new Error('Failed to create investment');
    }
    return investment;
};
/**
 * Update investment status
 */
export const updateInvestmentStatus = async (id, status) => {
    const db = await getDatabase();
    const investment = await getInvestment(id);
    if (!investment)
        return null;
    if (status === 'completed') {
        await db.query(`
      UPDATE investments SET status = $1, completed_at = NOW() WHERE id = $2
    `, [status, id]);
    }
    else {
        await db.query(`
      UPDATE investments SET status = $1 WHERE id = $2
    `, [status, id]);
    }
    return await getInvestment(id);
};
/**
 * Update investment
 */
export const updateInvestment = async (id, updates) => {
    const db = await getDatabase();
    const investment = await getInvestment(id);
    if (!investment)
        return null;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    });
    if (fields.length === 0)
        return investment;
    values.push(id);
    await db.query(`
    UPDATE investments SET ${fields.join(', ')} WHERE id = $${paramIndex}
  `, values);
    return await getInvestment(id);
};
/**
 * Delete investment
 */
export const deleteInvestment = async (id) => {
    const db = await getDatabase();
    const result = await db.query('DELETE FROM investments WHERE id = $1', [id]);
    return result.rowCount > 0;
};
/**
 * Get active investments count by lender
 */
export const getActiveInvestmentsCount = async (lenderId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT COUNT(*) as count FROM investments WHERE lender_id = $1 AND status = $2', [lenderId, 'active']);
    return parseInt(result.rows[0].count);
};
/**
 * Get total invested amount by lender
 */
export const getTotalInvestedByLender = async (lenderId) => {
    const db = await getDatabase();
    const result = await db.query(`
    SELECT SUM(amount) as total FROM investments
    WHERE lender_id = $1 AND status IN ('active', 'completed')
  `, [lenderId]);
    return Number(result.rows[0].total) || 0;
};
/**
 * Get total returns by lender
 */
export const getTotalReturnsByLender = async (lenderId) => {
    const db = await getDatabase();
    const result = await db.query(`
    SELECT SUM(expected_return) as total FROM investments
    WHERE lender_id = $1 AND status = 'completed'
  `, [lenderId]);
    return Number(result.rows[0].total) || 0;
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
