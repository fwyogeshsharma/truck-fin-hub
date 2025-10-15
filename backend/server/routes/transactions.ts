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
} from '../../db/queries/transactions.ts';

const router = Router();

// GET /api/transactions - Get all transactions or filter by query params
router.get('/', (req: Request, res: Response) => {
  try {
    const { userId, type, category, limit } = req.query;

    let transactions;
    if (userId && type) {
      transactions = getTransactionsByUserAndType(userId as string, type as any);
    } else if (userId && category) {
      transactions = getTransactionsByUserAndCategory(userId as string, category as any);
    } else if (userId) {
      transactions = getTransactionsByUser(userId as string, limit ? parseInt(limit as string) : undefined);
    } else {
      transactions = getAllTransactions();
    }

    res.json(transactions);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions', message: error.message });
  }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', (req: Request, res: Response) => {
  try {
    const transaction = getTransaction(req.params.id);
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
router.post('/', (req: Request, res: Response) => {
  try {
    const transaction = createTransaction(req.body);
    res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction', message: error.message });
  }
});

// GET /api/transactions/user/:userId/recent - Get recent transactions
router.get('/user/:userId/recent', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const transactions = getRecentTransactions(req.params.userId, limit);
    res.json(transactions);
  } catch (error: any) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Failed to get recent transactions', message: error.message });
  }
});

// GET /api/transactions/user/:userId/stats - Get user transaction statistics
router.get('/user/:userId/stats', (req: Request, res: Response) => {
  try {
    const count = getTransactionCount(req.params.userId);
    const totalCredited = getTotalCreditedByUser(req.params.userId);
    const totalDebited = getTotalDebitedByUser(req.params.userId);

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
