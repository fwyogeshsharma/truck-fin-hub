import { Router, Request, Response } from 'express';
import {
  getWallet,
  updateWallet,
  addToBalance,
  deductFromBalance,
  moveToEscrow,
  moveFromEscrowToInvested,
  returnInvestment,
} from '../../src/db/queries/wallets.ts';
import { createTransaction } from '../../src/db/queries/transactions.ts';

const router = Router();

// GET /api/wallets/:userId - Get wallet
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const wallet = await getWallet(req.params.userId);
    res.json(wallet);
  } catch (error: any) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet', message: error.message });
  }
});

// PUT /api/wallets/:userId - Update wallet
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    console.log('PUT /api/wallets/:userId - Request body:', JSON.stringify(req.body));
    console.log('PUT /api/wallets/:userId - User ID:', req.params.userId);
    const wallet = await updateWallet(req.params.userId, req.body);
    console.log('PUT /api/wallets/:userId - Updated wallet:', JSON.stringify(wallet));
    res.json(wallet);
  } catch (error: any) {
    console.error('Update wallet error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update wallet', message: error.message });
  }
});

// POST /api/wallets/:userId/add-money - Add money to wallet
router.post('/:userId/add-money', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await addToBalance(req.params.userId, amount);

    // Create transaction record
    await createTransaction({
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
router.post('/:userId/withdraw', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await deductFromBalance(req.params.userId, amount);

    // Create transaction record
    await createTransaction({
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
router.post('/:userId/escrow', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await moveToEscrow(req.params.userId, amount);

    // Create transaction record
    await createTransaction({
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
router.post('/:userId/invest', async (req: Request, res: Response) => {
  try {
    const { amount, tripId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const wallet = await moveFromEscrowToInvested(req.params.userId, amount);

    // Create transaction record
    await createTransaction({
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
router.post('/:userId/return', async (req: Request, res: Response) => {
  try {
    const { principal, returns } = req.body;

    if (!principal || principal <= 0) {
      return res.status(400).json({ error: 'Valid principal amount required' });
    }

    const wallet = await returnInvestment(req.params.userId, principal, returns || 0);

    // Create transaction record
    await createTransaction({
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
