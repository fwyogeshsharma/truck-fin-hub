import { Router, Request, Response } from 'express';
import {
  getAllLoanAgreements,
  getLoanAgreementById,
  getLoanAgreementsByTrip,
  getLoanAgreementByBid,
  getLoanAgreementsByLender,
  getLoanAgreementsByBorrower,
  createLoanAgreement,
  updateLoanAgreement,
  deleteLoanAgreement,
  CreateLoanAgreementInput,
  UpdateLoanAgreementInput,
} from '../../src/db/queries/loanAgreements.ts';

const router = Router();

// GET /api/loan-agreements - Get all loan agreements or filter by query params
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tripId, bidId, lenderId, borrowerId } = req.query;

    let agreements;
    if (tripId) {
      agreements = await getLoanAgreementsByTrip(tripId as string);
    } else if (bidId) {
      const agreement = await getLoanAgreementByBid(bidId as string);
      agreements = agreement ? [agreement] : [];
    } else if (lenderId) {
      agreements = await getLoanAgreementsByLender(lenderId as string);
    } else if (borrowerId) {
      agreements = await getLoanAgreementsByBorrower(borrowerId as string);
    } else {
      agreements = await getAllLoanAgreements();
    }

    res.json(agreements);
  } catch (error: any) {
    console.error('Get loan agreements error:', error);
    res.status(500).json({ error: 'Failed to get loan agreements', message: error.message });
  }
});

// GET /api/loan-agreements/trip/:tripId - Get agreements for a specific trip
router.get('/trip/:tripId', async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const agreements = await getLoanAgreementsByTrip(tripId);
    res.json(agreements);
  } catch (error: any) {
    console.error('Get trip loan agreements error:', error);
    res.status(500).json({ error: 'Failed to get trip loan agreements', message: error.message });
  }
});

// GET /api/loan-agreements/bid/:bidId - Get agreement for a specific bid
router.get('/bid/:bidId', async (req: Request, res: Response) => {
  try {
    const { bidId } = req.params;
    const agreement = await getLoanAgreementByBid(bidId);

    if (!agreement) {
      return res.status(404).json({ error: 'Loan agreement not found' });
    }

    res.json(agreement);
  } catch (error: any) {
    console.error('Get bid loan agreement error:', error);
    res.status(500).json({ error: 'Failed to get bid loan agreement', message: error.message });
  }
});

// GET /api/loan-agreements/:id - Get a specific loan agreement
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agreement = await getLoanAgreementById(id);

    if (!agreement) {
      return res.status(404).json({ error: 'Loan agreement not found' });
    }

    res.json(agreement);
  } catch (error: any) {
    console.error('Get loan agreement error:', error);
    res.status(500).json({ error: 'Failed to get loan agreement', message: error.message });
  }
});

// POST /api/loan-agreements - Create a new loan agreement
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: CreateLoanAgreementInput = req.body;

    // Validate required fields
    const requiredFields = [
      'trip_id',
      'bid_id',
      'lender_id',
      'borrower_id',
      'contract_terms',
      'interest_rate',
      'loan_amount',
      'maturity_days'
    ];

    const missingFields = requiredFields.filter(field => !input[field as keyof CreateLoanAgreementInput]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const agreement = await createLoanAgreement(input);
    res.status(201).json(agreement);
  } catch (error: any) {
    console.error('Create loan agreement error:', error);
    res.status(500).json({ error: 'Failed to create loan agreement', message: error.message });
  }
});

// PUT /api/loan-agreements/:id - Update a loan agreement (typically for borrower signature)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input: UpdateLoanAgreementInput = req.body;

    // Check if agreement exists
    const existing = await getLoanAgreementById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Loan agreement not found' });
    }

    const updated = await updateLoanAgreement(id, input);
    res.json(updated);
  } catch (error: any) {
    console.error('Update loan agreement error:', error);
    res.status(500).json({ error: 'Failed to update loan agreement', message: error.message });
  }
});

// DELETE /api/loan-agreements/:id - Delete a loan agreement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if agreement exists
    const existing = await getLoanAgreementById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Loan agreement not found' });
    }

    await deleteLoanAgreement(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Delete loan agreement error:', error);
    res.status(500).json({ error: 'Failed to delete loan agreement', message: error.message });
  }
});

export default router;
