import { Router, Request, Response } from 'express';
import {
  getWallet,
  updateWallet,
  addToBalance,
  deductFromBalance,
  moveToEscrow,
  moveFromEscrowToInvested,
  returnInvestment,
} from '../../db/queries/wallets.ts';
import { createTransaction } from '../../db/queries/transactions.ts';

const router = Router();

// GET /api/wallets/:userId - Get wallet
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const wallet = getWallet(req.params.userId);
    res.json(wallet);
  } catch (error: any) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet', message: error.message });
  }
});

// PUT /api/wallets/:userId - Update wallet
router.put('/:userId', (req: Request, res: Response) => {
  try {
    const wallet = updateWallet(req.params.userId, req.body);
    res.json(wallet);
  } catch (error: any) {
    console.error('Update wallet error:', error);
    res.status(500).json({ error: 'Failed to update wallet', message: error.message });
  }
});

// POST /api/wallets/:userId/add-money - Add money to wallet
router.post('/:userId/add-money', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = addToBalance(req.params.userId, amount);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'credit',
      amount,
      category: 'payment',
      description: `Added ₹${amount} to wallet`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    console.error('Add money error:', error);
    res.status(500).json({ error: 'Failed to add money', message: error.message });
  }
});

// POST /api/wallets/:userId/withdraw - Withdraw from wallet
router.post('/:userId/withdraw', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = deductFromBalance(req.params.userId, amount);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'debit',
      amount,
      category: 'withdrawal',
      description: `Withdrawn ₹${amount} from wallet`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    console.error('Withdraw error:', error);
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to withdraw', message: error.message });
  }
});

// POST /api/wallets/:userId/escrow - Move money to escrow
router.post('/:userId/escrow', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = moveToEscrow(req.params.userId, amount);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'debit',
      amount,
      category: 'investment',
      description: `Moved ₹${amount} to escrow`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    console.error('Escrow error:', error);
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to move to escrow', message: error.message });
  }
});

// POST /api/wallets/:userId/invest - Move from escrow to invested
router.post('/:userId/invest', (req: Request, res: Response) => {
  try {
    const { amount, tripId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = moveFromEscrowToInvested(req.params.userId, amount);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'debit',
      amount,
      category: 'investment',
      description: tripId ? `Invested ₹${amount} in trip ${tripId}` : `Invested ₹${amount}`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    console.error('Invest error:', error);
    if (error.message.includes('Insufficient')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to invest', message: error.message });
  }
});

// POST /api/wallets/:userId/return - Return investment with returns
router.post('/:userId/return', (req: Request, res: Response) => {
  try {
    const { principal, returns } = req.body;

    if (!principal || principal <= 0) {
      return res.status(400).json({ error: 'Valid principal amount required' });
    }

    const wallet = returnInvestment(req.params.userId, principal, returns || 0);

    // Create transaction record
    createTransaction({
      user_id: req.params.userId,
      type: 'credit',
      amount: principal + (returns || 0),
      category: 'return',
      description: `Investment returned: ₹${principal} + ₹${returns || 0} returns`,
      balance_after: wallet.balance,
    });

    res.json(wallet);
  } catch (error: any) {
    console.error('Return investment error:', error);
    res.status(500).json({ error: 'Failed to return investment', message: error.message });
  }
});

export default router;
