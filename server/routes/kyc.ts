import { Router, Request, Response } from 'express';
import {
  getUserKyc,
  getKycById,
  getAllKyc,
  getKycByStatus,
  createOrUpdateUserKyc,
  updateUserKyc,
  submitKycForReview,
  approveKyc,
  rejectKyc,
  hasApprovedKyc,
  getPendingKycCount,
  getUnderReviewKycCount,
} from '../../src/db/queries/userKyc.ts';

const router = Router();

// GET /api/kyc - Get all KYC records or filter by status
router.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let kycRecords;
    if (status) {
      kycRecords = getKycByStatus(status as any);
    } else {
      kycRecords = getAllKyc();
    }

    res.json(kycRecords);
  } catch (error: any) {
    console.error('Get KYC records error:', error);
    res.status(500).json({ error: 'Failed to get KYC records', message: error.message });
  }
});

// GET /api/kyc/stats - Get KYC statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const pendingCount = getPendingKycCount();
    const underReviewCount = getUnderReviewKycCount();

    res.json({
      pendingCount,
      underReviewCount,
    });
  } catch (error: any) {
    console.error('Get KYC stats error:', error);
    res.status(500).json({ error: 'Failed to get KYC statistics', message: error.message });
  }
});

// GET /api/kyc/:id - Get KYC by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const kyc = getKycById(req.params.id);
    if (!kyc) {
      return res.status(404).json({ error: 'KYC record not found' });
    }
    res.json(kyc);
  } catch (error: any) {
    console.error('Get KYC error:', error);
    res.status(500).json({ error: 'Failed to get KYC record', message: error.message });
  }
});

// GET /api/kyc/user/:userId - Get KYC by user ID
router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const kyc = getUserKyc(req.params.userId);
    if (!kyc) {
      return res.status(404).json({ error: 'KYC record not found' });
    }
    res.json(kyc);
  } catch (error: any) {
    console.error('Get user KYC error:', error);
    res.status(500).json({ error: 'Failed to get KYC record', message: error.message });
  }
});

// GET /api/kyc/user/:userId/status - Check if user has approved KYC
router.get('/user/:userId/status', (req: Request, res: Response) => {
  try {
    const approved = hasApprovedKyc(req.params.userId);
    res.json({ approved });
  } catch (error: any) {
    console.error('Check KYC status error:', error);
    res.status(500).json({ error: 'Failed to check KYC status', message: error.message });
  }
});

// POST /api/kyc - Create or update KYC
router.post('/', (req: Request, res: Response) => {
  try {
    const kyc = createOrUpdateUserKyc(req.body);
    res.status(201).json(kyc);
  } catch (error: any) {
    console.error('Create/Update KYC error:', error);
    res.status(500).json({ error: 'Failed to save KYC', message: error.message });
  }
});

// PUT /api/kyc/user/:userId - Update KYC
router.put('/user/:userId', (req: Request, res: Response) => {
  try {
    const kyc = updateUserKyc(req.params.userId, req.body);
    if (!kyc) {
      return res.status(404).json({ error: 'KYC record not found' });
    }
    res.json(kyc);
  } catch (error: any) {
    console.error('Update KYC error:', error);
    res.status(500).json({ error: 'Failed to update KYC', message: error.message });
  }
});

// POST /api/kyc/user/:userId/submit - Submit KYC for review
router.post('/user/:userId/submit', (req: Request, res: Response) => {
  try {
    const kyc = submitKycForReview(req.params.userId);
    if (!kyc) {
      return res.status(404).json({ error: 'KYC record not found' });
    }
    res.json(kyc);
  } catch (error: any) {
    console.error('Submit KYC error:', error);
    res.status(500).json({ error: 'Failed to submit KYC', message: error.message });
  }
});

// POST /api/kyc/user/:userId/approve - Approve KYC (Admin only)
router.post('/user/:userId/approve', (req: Request, res: Response) => {
  try {
    const { verifiedBy } = req.body;

    if (!verifiedBy) {
      return res.status(400).json({ error: 'verifiedBy is required' });
    }

    const kyc = approveKyc(req.params.userId, verifiedBy);
    if (!kyc) {
      return res.status(404).json({ error: 'KYC record not found' });
    }
    res.json(kyc);
  } catch (error: any) {
    console.error('Approve KYC error:', error);
    res.status(500).json({ error: 'Failed to approve KYC', message: error.message });
  }
});

// POST /api/kyc/user/:userId/reject - Reject KYC (Admin only)
router.post('/user/:userId/reject', (req: Request, res: Response) => {
  try {
    const { verifiedBy, rejectionReason } = req.body;

    if (!verifiedBy || !rejectionReason) {
      return res.status(400).json({ error: 'verifiedBy and rejectionReason are required' });
    }

    const kyc = rejectKyc(req.params.userId, verifiedBy, rejectionReason);
    if (!kyc) {
      return res.status(404).json({ error: 'KYC record not found' });
    }
    res.json(kyc);
  } catch (error: any) {
    console.error('Reject KYC error:', error);
    res.status(500).json({ error: 'Failed to reject KYC', message: error.message });
  }
});

export default router;
