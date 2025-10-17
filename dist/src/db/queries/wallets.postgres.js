// ============================================================
// DEPRECATED - USE wallets.ts INSTEAD
// This file is a duplicate kept for backward compatibility.
// All new code should import from wallets.ts
// ============================================================
import { getDatabase } from '../database.js';
/**
 * Get wallet by user ID
 */
export const getWallet = async (userId) => {
    const db = getDatabase();
    const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    let wallet = result.rows[0];
    // Create wallet if it doesn't exist
    if (!wallet) {
        const INITIAL_BALANCE = 500000; // ₹5,00,000 starting balance
        const insertResult = await db.query(`INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
       VALUES ($1, $2, 0, 0, 0, 0)
       RETURNING *`, [userId, INITIAL_BALANCE]);
        wallet = insertResult.rows[0];
    }
    return wallet;
};
/**
 * Update wallet
 */
export const updateWallet = async (userId, input) => {
    // Ensure wallet exists
    await getWallet(userId);
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (input.balance !== undefined) {
        updates.push(`balance = $${paramCount++}`);
        values.push(input.balance);
    }
    if (input.locked_amount !== undefined) {
        updates.push(`locked_amount = $${paramCount++}`);
        values.push(input.locked_amount);
    }
    if (input.escrowed_amount !== undefined) {
        updates.push(`escrowed_amount = $${paramCount++}`);
        values.push(input.escrowed_amount);
    }
    if (input.total_invested !== undefined) {
        updates.push(`total_invested = $${paramCount++}`);
        values.push(input.total_invested);
    }
    if (input.total_returns !== undefined) {
        updates.push(`total_returns = $${paramCount++}`);
        values.push(input.total_returns);
    }
    if (updates.length === 0) {
        return await getWallet(userId);
    }
    values.push(userId);
    const db = getDatabase();
    const result = await db.query(`UPDATE wallets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramCount} RETURNING *`, values);
    return result.rows[0] || await getWallet(userId);
};
/**
 * Add to balance
 */
export const addToBalance = async (userId, amount) => {
    const wallet = await getWallet(userId);
    return await updateWallet(userId, { balance: wallet.balance + amount });
};
/**
 * Deduct from balance
 */
export const deductFromBalance = async (userId, amount) => {
    const wallet = await getWallet(userId);
    if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
    }
    return await updateWallet(userId, { balance: wallet.balance - amount });
};
/**
 * Move to escrow
 */
export const moveToEscrow = async (userId, amount) => {
    const wallet = await getWallet(userId);
    if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
    }
    return await updateWallet(userId, {
        balance: wallet.balance - amount,
        escrowed_amount: wallet.escrowed_amount + amount,
    });
};
/**
 * Move from escrow to invested
 */
export const moveFromEscrowToInvested = async (userId, amount) => {
    const wallet = await getWallet(userId);
    if (wallet.escrowed_amount < amount) {
        throw new Error('Insufficient escrowed amount');
    }
    return await updateWallet(userId, {
        escrowed_amount: wallet.escrowed_amount - amount,
        total_invested: wallet.total_invested + amount,
    });
};
/**
 * Return investment with returns
 */
export const returnInvestment = async (userId, principal, returns) => {
    const wallet = await getWallet(userId);
    return await updateWallet(userId, {
        balance: wallet.balance + principal + returns,
        total_invested: wallet.total_invested - principal,
        total_returns: wallet.total_returns + returns,
    });
};
export default {
    getWallet,
    updateWallet,
    addToBalance,
    deductFromBalance,
    moveToEscrow,
    moveFromEscrowToInvested,
    returnInvestment,
};
