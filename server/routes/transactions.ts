import { Router, Request, Response } from 'express';
import {
  getAllTransactions,
  getTransaction,
  getTransactionsByUser,
  getTransactionsByUserAndType,
  getTransactionsByUserAndCategory,
  createTransaction,
  getRecentTransactions,
  getTransactionCount,
  getTotalCreditedByUser,
  getTotalDebitedByUser,
} from '../../src/db/queries/transactions.ts';

const router = Router();

// GET /api/transactions - Get all transactions or filter by query params
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, category, limit } = req.query;

    let transactions;
    if (userId && type) {
      transactions = await getTransactionsByUserAndType(userId as string, type as any);
    } else if (userId && category) {
      transactions = await getTransactionsByUserAndCategory(userId as string, category as any);
    } else if (userId) {
      transactions = await getTransactionsByUser(userId as string, limit ? parseInt(limit as string) : undefined);
    } else {
      transactions = await getAllTransactions();
    }

    res.json(transactions);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions', message: error.message });
  }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transaction = await getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error: any) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction', message: error.message });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🔵 [POST /api/transactions] Received body:', JSON.stringify(req.body, null, 2));
    const { user_id, type, amount, category, description, balance_after } = req.body;

    // Validate required fields
    if (!user_id || !type || !amount || !category || !description) {
      console.error('❌ [POST /api/transactions] Missing fields:', {
        has_user_id: !!user_id,
        has_type: !!type,
        has_amount: !!amount,
        has_category: !!category,
        has_description: !!description
      });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'user_id, type, amount, category, and description are required',
        received: Object.keys(req.body)
      });
    }

    let finalBalanceAfter = balance_after;

    // If balance_after is not provided, calculate it from wallet
    if (finalBalanceAfter === undefined) {
      const { getWallet } = await import('../../src/db/queries/wallets.ts');
      const wallet = await getWallet(user_id);

      if (type === 'credit') {
        finalBalanceAfter = wallet.balance + Number(amount);
      } else {
        finalBalanceAfter = wallet.balance - Number(amount);
      }
    }

    const transaction = await createTransaction({
      user_id,
      type,
      amount: Number(amount),
      category,
      description,
      balance_after: Number(finalBalanceAfter),
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction', message: error.message });
  }
});

// GET /api/transactions/user/:userId/recent - Get recent transactions
router.get('/user/:userId/recent', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const transactions = await getRecentTransactions(req.params.userId, limit);
    res.json(transactions);
  } catch (error: any) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Failed to get recent transactions', message: error.message });
  }
});

// GET /api/transactions/user/:userId/stats - Get user transaction statistics
router.get('/user/:userId/stats', async (req: Request, res: Response) => {
  try {
    const count = await getTransactionCount(req.params.userId);
    const totalCredited = await getTotalCreditedByUser(req.params.userId);
    const totalDebited = await getTotalDebitedByUser(req.params.userId);

    res.json({
      count,
      totalCredited,
      totalDebited,
      netAmount: totalCredited - totalDebited,
    });
  } catch (error: any) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics', message: error.message });
  }
});

export default router;
