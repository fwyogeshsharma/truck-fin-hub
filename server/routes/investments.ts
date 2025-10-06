import { Router, Request, Response } from 'express';
import {
  getAllInvestments,
  getInvestment,
  getInvestmentsByLender,
  getInvestmentsByTrip,
  getInvestmentsByStatus,
  getInvestmentsByLenderAndStatus,
  createInvestment,
  updateInvestmentStatus,
  updateInvestment,
  deleteInvestment,
  getActiveInvestmentsCount,
  getTotalInvestedByLender,
  getTotalReturnsByLender,
} from '../../src/db/queries/investments.ts';

const router = Router();

// GET /api/investments - Get all investments or filter by query params
router.get('/', (req: Request, res: Response) => {
  try {
    const { lenderId, tripId, status } = req.query;

    let investments;
    if (lenderId && status) {
      investments = getInvestmentsByLenderAndStatus(lenderId as string, status as any);
    } else if (lenderId) {
      investments = getInvestmentsByLender(lenderId as string);
    } else if (tripId) {
      investments = getInvestmentsByTrip(tripId as string);
    } else if (status) {
      investments = getInvestmentsByStatus(status as any);
    } else {
      investments = getAllInvestments();
    }

    res.json(investments);
  } catch (error: any) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Failed to get investments', message: error.message });
  }
});

// GET /api/investments/:id - Get single investment
router.get('/:id', (req: Request, res: Response) => {
  try {
    const investment = getInvestment(req.params.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(investment);
  } catch (error: any) {
    console.error('Get investment error:', error);
    res.status(500).json({ error: 'Failed to get investment', message: error.message });
  }
});

// POST /api/investments - Create new investment
router.post('/', (req: Request, res: Response) => {
  try {
    const investment = createInvestment(req.body);
    res.status(201).json(investment);
  } catch (error: any) {
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment', message: error.message });
  }
});

// PUT /api/investments/:id - Update investment
router.put('/:id', (req: Request, res: Response) => {
  try {
    const investment = updateInvestment(req.params.id, req.body);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(investment);
  } catch (error: any) {
    console.error('Update investment error:', error);
    res.status(500).json({ error: 'Failed to update investment', message: error.message });
  }
});

// PUT /api/investments/:id/status - Update investment status
router.put('/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const investment = updateInvestmentStatus(req.params.id, status);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(investment);
  } catch (error: any) {
    console.error('Update investment status error:', error);
    res.status(500).json({ error: 'Failed to update status', message: error.message });
  }
});

// DELETE /api/investments/:id - Delete investment
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteInvestment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted successfully' });
  } catch (error: any) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Failed to delete investment', message: error.message });
  }
});

// GET /api/investments/stats/:lenderId - Get lender statistics
router.get('/stats/:lenderId', (req: Request, res: Response) => {
  try {
    const activeCount = getActiveInvestmentsCount(req.params.lenderId);
    const totalInvested = getTotalInvestedByLender(req.params.lenderId);
    const totalReturns = getTotalReturnsByLender(req.params.lenderId);

    res.json({
      activeCount,
      totalInvested,
      totalReturns,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics', message: error.message });
  }
});

export default router;
