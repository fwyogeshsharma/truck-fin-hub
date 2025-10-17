import { Router } from 'express';
import { getBankAccount, getBankAccountsByUser, getPrimaryBankAccount, getVerifiedBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount, setPrimaryBankAccount, verifyBankAccount, } from '../../src/db/queries/bankAccounts.ts';
const router = Router();
// GET /api/bank-accounts/user/:userId - Get all bank accounts for a user
router.get('/user/:userId', (req, res) => {
    try {
        const accounts = getBankAccountsByUser(req.params.userId);
        res.json(accounts);
    }
    catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Failed to get bank accounts', message: error.message });
    }
});
// GET /api/bank-accounts/user/:userId/primary - Get primary bank account
router.get('/user/:userId/primary', (req, res) => {
    try {
        const account = getPrimaryBankAccount(req.params.userId);
        if (!account) {
            return res.status(404).json({ error: 'No primary bank account found' });
        }
        res.json(account);
    }
    catch (error) {
        console.error('Get primary account error:', error);
        res.status(500).json({ error: 'Failed to get primary account', message: error.message });
    }
});
// GET /api/bank-accounts/user/:userId/verified - Get verified bank accounts
router.get('/user/:userId/verified', (req, res) => {
    try {
        const accounts = getVerifiedBankAccounts(req.params.userId);
        res.json(accounts);
    }
    catch (error) {
        console.error('Get verified accounts error:', error);
        res.status(500).json({ error: 'Failed to get verified accounts', message: error.message });
    }
});
// GET /api/bank-accounts/:id - Get single bank account
router.get('/:id', (req, res) => {
    try {
        const account = getBankAccount(req.params.id);
        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }
        res.json(account);
    }
    catch (error) {
        console.error('Get bank account error:', error);
        res.status(500).json({ error: 'Failed to get bank account', message: error.message });
    }
});
// POST /api/bank-accounts - Create new bank account
router.post('/', (req, res) => {
    try {
        const account = createBankAccount(req.body);
        res.status(201).json(account);
    }
    catch (error) {
        console.error('Create bank account error:', error);
        res.status(500).json({ error: 'Failed to create bank account', message: error.message });
    }
});
// PUT /api/bank-accounts/:id - Update bank account
router.put('/:id', (req, res) => {
    try {
        const account = updateBankAccount(req.params.id, req.body);
        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }
        res.json(account);
    }
    catch (error) {
        console.error('Update bank account error:', error);
        res.status(500).json({ error: 'Failed to update bank account', message: error.message });
    }
});
// DELETE /api/bank-accounts/:id - Delete bank account
router.delete('/:id', (req, res) => {
    try {
        const deleted = deleteBankAccount(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Bank account not found' });
        }
        res.json({ message: 'Bank account deleted successfully' });
    }
    catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({ error: 'Failed to delete bank account', message: error.message });
    }
});
// PUT /api/bank-accounts/:id/set-primary - Set as primary account
router.put('/:id/set-primary', (req, res) => {
    try {
        const account = setPrimaryBankAccount(req.params.id);
        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }
        res.json(account);
    }
    catch (error) {
        console.error('Set primary account error:', error);
        res.status(500).json({ error: 'Failed to set primary account', message: error.message });
    }
});
// PUT /api/bank-accounts/:id/verify - Verify bank account
router.put('/:id/verify', (req, res) => {
    try {
        const account = verifyBankAccount(req.params.id);
        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }
        res.json(account);
    }
    catch (error) {
        console.error('Verify account error:', error);
        res.status(500).json({ error: 'Failed to verify account', message: error.message });
    }
});
export default router;
