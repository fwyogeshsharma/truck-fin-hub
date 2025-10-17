import { Router } from 'express';
import { getAllInvestments, getInvestment, getInvestmentsByLender, getInvestmentsByTrip, getInvestmentsByStatus, getInvestmentsByLenderAndStatus, getInvestmentsByTripAndLender, createInvestment, updateInvestmentStatus, updateInvestment, deleteInvestment, getActiveInvestmentsCount, getTotalInvestedByLender, getTotalReturnsByLender, } from '../../src/db/queries/investments.ts';
const router = Router();
// GET /api/investments - Get all investments or filter by query params
router.get('/', async (req, res) => {
    try {
        const { lenderId, tripId, status } = req.query;
        let investments;
        if (lenderId && tripId) {
            investments = await getInvestmentsByTripAndLender(tripId, lenderId);
        }
        else if (lenderId && status) {
            investments = await getInvestmentsByLenderAndStatus(lenderId, status);
        }
        else if (lenderId) {
            investments = await getInvestmentsByLender(lenderId);
        }
        else if (tripId) {
            investments = await getInvestmentsByTrip(tripId);
        }
        else if (status) {
            investments = await getInvestmentsByStatus(status);
        }
        else {
            investments = await getAllInvestments();
        }
        res.json(investments);
    }
    catch (error) {
        console.error('Get investments error:', error);
        res.status(500).json({ error: 'Failed to get investments', message: error.message });
    }
});
// GET /api/investments/:id - Get single investment
router.get('/:id', async (req, res) => {
    try {
        const investment = await getInvestment(req.params.id);
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        res.json(investment);
    }
    catch (error) {
        console.error('Get investment error:', error);
        res.status(500).json({ error: 'Failed to get investment', message: error.message });
    }
});
// POST /api/investments - Create new investment
router.post('/', async (req, res) => {
    try {
        const investment = await createInvestment(req.body);
        res.status(201).json(investment);
    }
    catch (error) {
        console.error('Create investment error:', error);
        res.status(500).json({ error: 'Failed to create investment', message: error.message });
    }
});
// PUT /api/investments/:id - Update investment
router.put('/:id', async (req, res) => {
    try {
        const investment = await updateInvestment(req.params.id, req.body);
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        res.json(investment);
    }
    catch (error) {
        console.error('Update investment error:', error);
        res.status(500).json({ error: 'Failed to update investment', message: error.message });
    }
});
// PUT /api/investments/:id/status - Update investment status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const investment = await updateInvestmentStatus(req.params.id, status);
        if (!investment) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        res.json(investment);
    }
    catch (error) {
        console.error('Update investment status error:', error);
        res.status(500).json({ error: 'Failed to update status', message: error.message });
    }
});
// DELETE /api/investments/:id - Delete investment
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await deleteInvestment(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Investment not found' });
        }
        res.json({ message: 'Investment deleted successfully' });
    }
    catch (error) {
        console.error('Delete investment error:', error);
        res.status(500).json({ error: 'Failed to delete investment', message: error.message });
    }
});
// GET /api/investments/stats/:lenderId - Get lender statistics
router.get('/stats/:lenderId', async (req, res) => {
    try {
        const activeCount = await getActiveInvestmentsCount(req.params.lenderId);
        const totalInvested = await getTotalInvestedByLender(req.params.lenderId);
        const totalReturns = await getTotalReturnsByLender(req.params.lenderId);
        res.json({
            activeCount,
            totalInvested,
            totalReturns,
        });
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics', message: error.message });
    }
});
export default router;
