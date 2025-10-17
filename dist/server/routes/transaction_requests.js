import { Router } from 'express';
import { createTransactionRequest, getTransactionRequestById, getTransactionRequestsByUserId, getPendingTransactionRequests, processTransactionRequest, getTransactionRequestsWithUserDetails, } from '../../src/db/queries/transaction_requests.js';
import { addToBalance, deductFromBalance, getWallet } from '../../src/db/queries/wallets.js';
import { createTransaction } from '../../src/db/queries/transactions.js';
const router = Router();
// POST /api/transaction-requests - Create new transaction request
router.post('/', async (req, res) => {
    try {
        const { user_id, request_type, amount, transaction_image_url, bank_account_id, bank_account_number, bank_ifsc_code, bank_name, } = req.body;
        if (!user_id || !request_type || !amount) {
            return res.status(400).json({ error: 'User ID, request type, and amount are required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }
        // Validate request type
        if (!['add_money', 'withdrawal'].includes(request_type)) {
            return res.status(400).json({ error: 'Invalid request type' });
        }
        // For add money, transaction image is required
        if (request_type === 'add_money' && !transaction_image_url) {
            return res.status(400).json({ error: 'Transaction image is required for add money requests' });
        }
        // For withdrawal, bank account details are required
        if (request_type === 'withdrawal' && (!bank_account_id || !bank_account_number || !bank_ifsc_code)) {
            return res.status(400).json({ error: 'Bank account details are required for withdrawal requests' });
        }
        const transactionRequest = await createTransactionRequest({
            user_id,
            request_type,
            amount,
            transaction_image_url,
            bank_account_id,
            bank_account_number,
            bank_ifsc_code,
            bank_name,
        });
        res.status(201).json(transactionRequest);
    }
    catch (error) {
        console.error('Create transaction request error:', error);
        res.status(500).json({ error: 'Failed to create transaction request', message: error.message });
    }
});
// GET /api/transaction-requests - Get all transaction requests (super admin only)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const transactionRequests = await getTransactionRequestsWithUserDetails(status);
        res.json(transactionRequests);
    }
    catch (error) {
        console.error('Get transaction requests error:', error);
        res.status(500).json({ error: 'Failed to get transaction requests', message: error.message });
    }
});
// GET /api/transaction-requests/pending - Get pending transaction requests
router.get('/pending', async (req, res) => {
    try {
        const transactionRequests = await getPendingTransactionRequests();
        res.json(transactionRequests);
    }
    catch (error) {
        console.error('Get pending transaction requests error:', error);
        res.status(500).json({ error: 'Failed to get pending requests', message: error.message });
    }
});
// GET /api/transaction-requests/user/:userId - Get transaction requests for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const transactionRequests = await getTransactionRequestsByUserId(userId);
        res.json(transactionRequests);
    }
    catch (error) {
        console.error('Get user transaction requests error:', error);
        res.status(500).json({ error: 'Failed to get user requests', message: error.message });
    }
});
// GET /api/transaction-requests/:id - Get specific transaction request
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transactionRequest = await getTransactionRequestById(id);
        if (!transactionRequest) {
            return res.status(404).json({ error: 'Transaction request not found' });
        }
        res.json(transactionRequest);
    }
    catch (error) {
        console.error('Get transaction request error:', error);
        res.status(500).json({ error: 'Failed to get transaction request', message: error.message });
    }
});
// PUT /api/transaction-requests/:id/process - Process transaction request (approve/reject)
router.put('/:id/process', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, processed_by, transaction_id, admin_notes } = req.body;
        if (!status || !processed_by) {
            return res.status(400).json({ error: 'Status and processed_by are required' });
        }
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be either approved or rejected' });
        }
        // Get the transaction request
        const transactionRequest = await getTransactionRequestById(id);
        if (!transactionRequest) {
            return res.status(404).json({ error: 'Transaction request not found' });
        }
        if (transactionRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Transaction request has already been processed' });
        }
        // For approval, transaction_id is required for add money requests
        if (status === 'approved' && transactionRequest.request_type === 'add_money' && !transaction_id) {
            return res.status(400).json({ error: 'Transaction ID is required for approving add money requests' });
        }
        // Process the request
        const updatedRequest = await processTransactionRequest(id, {
            status,
            processed_by,
            transaction_id,
            admin_notes,
        });
        // If approved, update the wallet and create transaction
        if (status === 'approved') {
            if (transactionRequest.request_type === 'add_money') {
                // Add money to wallet
                await addToBalance(transactionRequest.user_id, Number(transactionRequest.amount));
                // Get updated wallet balance
                const wallet = await getWallet(transactionRequest.user_id);
                // Create transaction record
                await createTransaction({
                    user_id: transactionRequest.user_id,
                    type: 'credit',
                    amount: Number(transactionRequest.amount),
                    category: 'payment',
                    description: `Wallet top-up via bank transfer (Ref: ${transaction_id})`,
                    balance_after: wallet.balance,
                });
            }
            else if (transactionRequest.request_type === 'withdrawal') {
                // Deduct from wallet
                await deductFromBalance(transactionRequest.user_id, Number(transactionRequest.amount));
                // Get updated wallet balance
                const wallet = await getWallet(transactionRequest.user_id);
                // Create transaction record
                await createTransaction({
                    user_id: transactionRequest.user_id,
                    type: 'debit',
                    amount: Number(transactionRequest.amount),
                    category: 'payment',
                    description: `Withdrawal to ${transactionRequest.bank_name} A/C ${transactionRequest.bank_account_number?.slice(-4)}`,
                    balance_after: wallet.balance,
                });
            }
        }
        res.json({
            message: `Transaction request ${status} successfully`,
            transactionRequest: updatedRequest,
        });
    }
    catch (error) {
        console.error('Process transaction request error:', error);
        res.status(500).json({ error: 'Failed to process transaction request', message: error.message });
    }
});
export default router;
