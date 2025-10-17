import { Router } from 'express';
import { getAllTransactions, getTransaction, getTransactionsByUser, getTransactionsByUserAndType, getTransactionsByUserAndCategory, createTransaction, getRecentTransactions, getTransactionCount, getTotalCreditedByUser, getTotalDebitedByUser, } from '../../src/db/queries/transactions.ts';
const router = Router();
// GET /api/transactions - Get all transactions or filter by query params
router.get('/', async (req, res) => {
    try {
        const { userId, type, category, limit } = req.query;
        let transactions;
        if (userId && type) {
            transactions = await getTransactionsByUserAndType(userId, type);
        }
        else if (userId && category) {
            transactions = await getTransactionsByUserAndCategory(userId, category);
        }
        else if (userId) {
            transactions = await getTransactionsByUser(userId, limit ? parseInt(limit) : undefined);
        }
        else {
            transactions = await getAllTransactions();
        }
        res.json(transactions);
    }
    catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions', message: error.message });
    }
});
// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
    try {
        const transaction = await getTransaction(req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    }
    catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Failed to get transaction', message: error.message });
    }
});
// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
    try {
        const transaction = await createTransaction(req.body);
        res.status(201).json(transaction);
    }
    catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Failed to create transaction', message: error.message });
    }
});
// GET /api/transactions/user/:userId/recent - Get recent transactions
router.get('/user/:userId/recent', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const transactions = await getRecentTransactions(req.params.userId, limit);
        res.json(transactions);
    }
    catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({ error: 'Failed to get recent transactions', message: error.message });
    }
});
// GET /api/transactions/user/:userId/stats - Get user transaction statistics
router.get('/user/:userId/stats', async (req, res) => {
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
    }
    catch (error) {
        console.error('Get transaction stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics', message: error.message });
    }
});
export default router;
