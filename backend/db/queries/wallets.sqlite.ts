import { getDatabase } from '../database';

export interface Wallet {
  user_id: string;
  balance: number;
  locked_amount: number;
  escrowed_amount: number;
  total_invested: number;
  total_returns: number;
  updated_at: string;
}

export interface UpdateWalletInput {
  balance?: number;
  locked_amount?: number;
  escrowed_amount?: number;
  total_invested?: number;
  total_returns?: number;
}

/**
 * Get wallet by user ID
 */
export const getWallet = (userId: string): Wallet => {
  const db = getDatabase();
  let stmt = db.prepare('SELECT * FROM wallets WHERE user_id = ?');
  let wallet = stmt.get(userId) as Wallet | undefined;

  // Create wallet if it doesn't exist
  if (!wallet) {
    const INITIAL_BALANCE = 500000; // ₹5,00,000 starting balance

    stmt = db.prepare(`
      INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
      VALUES (?, ?, 0, 0, 0, 0)
    `);
    stmt.run(userId, INITIAL_BALANCE);

    wallet = {
      user_id: userId,
      balance: INITIAL_BALANCE,
      locked_amount: 0,
      escrowed_amount: 0,
      total_invested: 0,
      total_returns: 0,
      updated_at: new Date().toISOString(),
    };
  }

  return wallet;
};

/**
 * Update wallet
 */
export const updateWallet = (userId: string, input: UpdateWalletInput): Wallet => {
  const db = getDatabase();

  // Ensure wallet exists
  getWallet(userId);

  const updates: string[] = [];
  const values: any[] = [];

  if (input.balance !== undefined) {
    updates.push('balance = ?');
    values.push(input.balance);
  }
  if (input.locked_amount !== undefined) {
    updates.push('locked_amount = ?');
    values.push(input.locked_amount);
  }
  if (input.escrowed_amount !== undefined) {
    updates.push('escrowed_amount = ?');
    values.push(input.escrowed_amount);
  }
  if (input.total_invested !== undefined) {
    updates.push('total_invested = ?');
    values.push(input.total_invested);
  }
  if (input.total_returns !== undefined) {
    updates.push('total_returns = ?');
    values.push(input.total_returns);
  }

  if (updates.length === 0) {
    return getWallet(userId);
  }

  updates.push('updated_at = datetime(\'now\')');
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE wallets SET ${updates.join(', ')} WHERE user_id = ?
  `);

  stmt.run(...values);

  return getWallet(userId);
};

/**
 * Add to balance
 */
export const addToBalance = (userId: string, amount: number): Wallet => {
  const wallet = getWallet(userId);
  return updateWallet(userId, { balance: wallet.balance + amount });
};

/**
 * Deduct from balance
 */
export const deductFromBalance = (userId: string, amount: number): Wallet => {
  const wallet = getWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  return updateWallet(userId, { balance: wallet.balance - amount });
};

/**
 * Move to escrow
 */
export const moveToEscrow = (userId: string, amount: number): Wallet => {
  const wallet = getWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  return updateWallet(userId, {
    balance: wallet.balance - amount,
    escrowed_amount: wallet.escrowed_amount + amount,
  });
};

/**
 * Move from escrow to invested
 */
export const moveFromEscrowToInvested = (userId: string, amount: number): Wallet => {
  const wallet = getWallet(userId);
  if (wallet.escrowed_amount < amount) {
    throw new Error('Insufficient escrowed amount');
  }
  return updateWallet(userId, {
    escrowed_amount: wallet.escrowed_amount - amount,
    total_invested: wallet.total_invested + amount,
  });
};

/**
 * Return investment with returns
 */
export const returnInvestment = (userId: string, principal: number, returns: number): Wallet => {
  const wallet = getWallet(userId);
  return updateWallet(userId, {
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
