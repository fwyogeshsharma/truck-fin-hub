import { Router, Request, Response } from 'express';
import {
  getAllPlatformFees,
  getPlatformFeesByDateRange,
  getPlatformFeesByLender,
  getPlatformFeesByBorrower,
  getPlatformFeesByTrip,
  getTotalFeesCollected,
  getTotalFeesCollectedByDateRange,
  getPlatformFeeStats,
  createPlatformFee,
} from '../../src/db/queries/platformFees.ts';

const router = Router();

// GET /api/platform-fees - Get all platform fees
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching all platform fees...');
    const fees = await getAllPlatformFees();
    console.log(`✅ Found ${fees.length} platform fee records`);
    if (fees.length > 0) {
      console.log('📋 Sample record:', JSON.stringify(fees[0], null, 2));
    }
    res.json(fees);
  } catch (error: any) {
    console.error('❌ Get all platform fees error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to get platform fees', message: error.message });
  }
});

// GET /api/platform-fees/stats - Get platform fee statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getPlatformFeeStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Get platform fee stats error:', error);
    res.status(500).json({ error: 'Failed to get platform fee stats', message: error.message });
  }
});

// GET /api/platform-fees/total - Get total fees collected
router.get('/total', async (req: Request, res: Response) => {
  try {
    const total = await getTotalFeesCollected();
    res.json({ total });
  } catch (error: any) {
    console.error('Get total fees error:', error);
    res.status(500).json({ error: 'Failed to get total fees', message: error.message });
  }
});

// GET /api/platform-fees/date-range - Get fees by date range
router.get('/date-range', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const fees = await getPlatformFeesByDateRange(
      startDate as string,
      endDate as string
    );

    const total = await getTotalFeesCollectedByDateRange(
      startDate as string,
      endDate as string
    );

    res.json({ fees, total });
  } catch (error: any) {
    console.error('Get fees by date range error:', error);
    res.status(500).json({ error: 'Failed to get fees by date range', message: error.message });
  }
});

// GET /api/platform-fees/lender/:lenderId - Get fees by lender
router.get('/lender/:lenderId', async (req: Request, res: Response) => {
  try {
    const { lenderId } = req.params;
    const fees = await getPlatformFeesByLender(lenderId);
    res.json(fees);
  } catch (error: any) {
    console.error('Get fees by lender error:', error);
    res.status(500).json({ error: 'Failed to get fees by lender', message: error.message });
  }
});

// GET /api/platform-fees/borrower/:borrowerId - Get fees by borrower
router.get('/borrower/:borrowerId', async (req: Request, res: Response) => {
  try {
    const { borrowerId } = req.params;
    const fees = await getPlatformFeesByBorrower(borrowerId);
    res.json(fees);
  } catch (error: any) {
    console.error('Get fees by borrower error:', error);
    res.status(500).json({ error: 'Failed to get fees by borrower', message: error.message });
  }
});

// GET /api/platform-fees/trip/:tripId - Get fees by trip
router.get('/trip/:tripId', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const fees = await getPlatformFeesByTrip(tripId);
    res.json(fees);
  } catch (error: any) {
    console.error('Get fees by trip error:', error);
    res.status(500).json({ error: 'Failed to get fees by trip', message: error.message });
  }
});

// POST /api/platform-fees - Create a platform fee record (internal use)
router.post('/', async (req: Request, res: Response) => {
  try {
    const fee = await createPlatformFee(req.body);
    res.status(201).json(fee);
  } catch (error: any) {
    console.error('Create platform fee error:', error);
    res.status(500).json({ error: 'Failed to create platform fee', message: error.message });
  }
});

export default router;
