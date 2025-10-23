import { getDatabase } from '../database.js';

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
export const getWallet = async (userId: string): Promise<Wallet> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  let wallet = result.rows[0];

  // Create wallet if it doesn't exist
  if (!wallet) {
    // No initial balance - wallets start at 0
    // Users must request to add money through super admin verification
    const INITIAL_BALANCE = 0;

    const insertResult = await db.query(
      `INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
       VALUES ($1, $2, 0, 0, 0, 0)
       RETURNING *`,
      [userId, INITIAL_BALANCE]
    );

    wallet = insertResult.rows[0];
  }

  // Ensure numeric fields are numbers, not strings
  return {
    ...wallet,
    balance: Number(wallet.balance),
    locked_amount: Number(wallet.locked_amount),
    escrowed_amount: Number(wallet.escrowed_amount),
    total_invested: Number(wallet.total_invested),
    total_returns: Number(wallet.total_returns),
  };
};

/**
 * Update wallet
 */
export const updateWallet = async (userId: string, input: UpdateWalletInput): Promise<Wallet> => {
  // Ensure wallet exists
  await getWallet(userId);

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.balance !== undefined) {
    updates.push(`balance = $${paramCount++}`);
    values.push(Number(input.balance));
  }
  if (input.locked_amount !== undefined) {
    updates.push(`locked_amount = $${paramCount++}`);
    values.push(Number(input.locked_amount));
  }
  if (input.escrowed_amount !== undefined) {
    updates.push(`escrowed_amount = $${paramCount++}`);
    values.push(Number(input.escrowed_amount));
  }
  if (input.total_invested !== undefined) {
    updates.push(`total_invested = $${paramCount++}`);
    values.push(Number(input.total_invested));
  }
  if (input.total_returns !== undefined) {
    updates.push(`total_returns = $${paramCount++}`);
    values.push(Number(input.total_returns));
  }

  if (updates.length === 0) {
    return await getWallet(userId);
  }

  values.push(userId);

  const db = getDatabase();
  const result = await db.query(
    `UPDATE wallets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramCount} RETURNING *`,
    values
  );

  const wallet = result.rows[0];
  if (!wallet) return await getWallet(userId);

  return {
    ...wallet,
    balance: Number(wallet.balance),
    locked_amount: Number(wallet.locked_amount),
    escrowed_amount: Number(wallet.escrowed_amount),
    total_invested: Number(wallet.total_invested),
    total_returns: Number(wallet.total_returns),
  };
};

/**
 * Add to balance
 */
export const addToBalance = async (userId: string, amount: number): Promise<Wallet> => {
  const wallet = await getWallet(userId);
  return await updateWallet(userId, { balance: wallet.balance + amount });
};

/**
 * Deduct from balance
 */
export const deductFromBalance = async (userId: string, amount: number): Promise<Wallet> => {
  const wallet = await getWallet(userId);
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  return await updateWallet(userId, { balance: wallet.balance - amount });
};

/**
 * Move to escrow
 */
export const moveToEscrow = async (userId: string, amount: number): Promise<Wallet> => {
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
export const moveFromEscrowToInvested = async (userId: string, amount: number): Promise<Wallet> => {
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
export const returnInvestment = async (userId: string, principal: number, returns: number): Promise<Wallet> => {
  const wallet = await getWallet(userId);
  return await updateWallet(userId, {
    balance: wallet.balance + principal + returns,
    total_invested: wallet.total_invested - principal,
    total_returns: wallet.total_returns + returns,
  });
};

/**
 * Move balance to escrow for withdrawal request
 */
export const moveToEscrowForWithdrawal = async (userId: string, amount: number): Promise<Wallet> => {
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
 * Release escrow (return to balance) - for rejected withdrawal requests
 */
export const releaseEscrowToBalance = async (userId: string, amount: number): Promise<Wallet> => {
  const wallet = await getWallet(userId);
  if (wallet.escrowed_amount < amount) {
    throw new Error('Insufficient escrowed amount');
  }
  return await updateWallet(userId, {
    balance: wallet.balance + amount,
    escrowed_amount: wallet.escrowed_amount - amount,
  });
};

/**
 * Deduct from escrowed amount (for approved withdrawal)
 */
export const deductFromEscrow = async (userId: string, amount: number): Promise<Wallet> => {
  const wallet = await getWallet(userId);
  if (wallet.escrowed_amount < amount) {
    throw new Error('Insufficient escrowed amount');
  }
  return await updateWallet(userId, {
    escrowed_amount: wallet.escrowed_amount - amount,
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
  moveToEscrowForWithdrawal,
  releaseEscrowToBalance,
  deductFromEscrow,
};
