import { Router, Request, Response } from 'express';
import {
  getAllContracts,
  getActiveContracts,
  getContractById,
  getContractsByUploader,
  getContractsByParty,
  getContractsBetweenParties,
  createContract,
  updateContract,
  updateContractStatus,
  deleteContract,
  getContractsCount,
  getActiveContractsCount,
  getContractsExpiringSoon,
  getExpiredContracts,
  autoExpireContracts,
  getUserContractStats,
  CreateContractInput,
  UpdateContractInput,
} from '@/db/queries/contracts';

const router = Router();

// GET /api/contracts - Get all contracts or active ones
router.get('/', async (req: Request, res: Response) => {
  try {
    const { active, uploader, party, party1, party2 } = req.query;

    let contracts;

    if (uploader) {
      // Get contracts uploaded by a specific user
      contracts = await getContractsByUploader(uploader as string);
    } else if (party) {
      // Get contracts where user is any party
      contracts = await getContractsByParty(party as string);
    } else if (party1 && party2) {
      // Get contracts between specific parties
      contracts = await getContractsBetweenParties(party1 as string, party2 as string);
    } else if (active === 'true') {
      // Get only active contracts
      contracts = await getActiveContracts();
    } else {
      // Get all contracts
      contracts = await getAllContracts();
    }

    res.json(contracts);
  } catch (error: any) {
    console.error('Get contracts error:', error);
    res.status(500).json({ error: 'Failed to get contracts', message: error.message });
  }
});

// GET /api/contracts/count - Get contracts count
router.get('/count', async (req: Request, res: Response) => {
  try {
    const { active } = req.query;

    const count = active === 'true'
      ? await getActiveContractsCount()
      : await getContractsCount();

    res.json({ count });
  } catch (error: any) {
    console.error('Get contracts count error:', error);
    res.status(500).json({ error: 'Failed to get contracts count', message: error.message });
  }
});

// GET /api/contracts/expiring - Get contracts expiring soon
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const contracts = await getContractsExpiringSoon(days);
    res.json(contracts);
  } catch (error: any) {
    console.error('Get expiring contracts error:', error);
    res.status(500).json({ error: 'Failed to get expiring contracts', message: error.message });
  }
});

// GET /api/contracts/expired - Get expired contracts
router.get('/expired', async (req: Request, res: Response) => {
  try {
    const contracts = await getExpiredContracts();
    res.json(contracts);
  } catch (error: any) {
    console.error('Get expired contracts error:', error);
    res.status(500).json({ error: 'Failed to get expired contracts', message: error.message });
  }
});

// POST /api/contracts/auto-expire - Auto-expire contracts past validity
router.post('/auto-expire', async (req: Request, res: Response) => {
  try {
    const expiredCount = await autoExpireContracts();
    res.json({
      success: true,
      message: `${expiredCount} contract(s) expired`,
      count: expiredCount,
    });
  } catch (error: any) {
    console.error('Auto-expire contracts error:', error);
    res.status(500).json({ error: 'Failed to auto-expire contracts', message: error.message });
  }
});

// GET /api/contracts/stats/:userId - Get contract statistics for a user
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await getUserContractStats(req.params.userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Get user contract stats error:', error);
    res.status(500).json({ error: 'Failed to get contract stats', message: error.message });
  }
});

// GET /api/contracts/:id - Get contract by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await getContractById(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error: any) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to get contract', message: error.message });
  }
});

// POST /api/contracts - Create a new contract
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      id,
      file_name,
      file_type,
      file_size,
      file_url,
      file_data,
      loan_percentage,
      ltv,
      penalty_after_due_date,
      contract_type,
      consignee_sender,
      validity_date,
      trip_stage,
      party1_user_id,
      party1_name,
      party2_user_id,
      party2_name,
      uploaded_by,
    } = req.body;

    // Validate required fields
    if (!id || !file_name || !file_type || !file_size || !file_url) {
      return res.status(400).json({ error: 'Missing required file fields' });
    }

    if (!loan_percentage || !ltv || !penalty_after_due_date) {
      return res.status(400).json({ error: 'Missing required financial fields' });
    }

    if (!contract_type || !validity_date) {
      return res.status(400).json({ error: 'Missing contract metadata' });
    }

    if (!party1_user_id || !party1_name || !party2_user_id || !party2_name) {
      return res.status(400).json({ error: 'Missing required party information' });
    }

    if (!uploaded_by) {
      return res.status(400).json({ error: 'Missing uploader information' });
    }

    const contractInput: CreateContractInput = {
      id,
      file_name,
      file_type,
      file_size,
      file_url,
      file_data,
      loan_percentage: parseFloat(loan_percentage),
      ltv: parseFloat(ltv),
      penalty_after_due_date: parseFloat(penalty_after_due_date),
      contract_type,
      consignee_sender,
      validity_date,
      trip_stage,
      party1_user_id,
      party1_name,
      party2_user_id,
      party2_name,
      uploaded_by,
    };

    const contract = await createContract(contractInput);

    res.status(201).json(contract);
  } catch (error: any) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Failed to create contract', message: error.message });
  }
});

// PATCH /api/contracts/:id - Update contract financial details
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const {
      loan_percentage,
      ltv,
      penalty_after_due_date,
      validity_date,
      trip_stage,
    } = req.body;

    const updates: UpdateContractInput = {};

    if (loan_percentage !== undefined) {
      updates.loan_percentage = parseFloat(loan_percentage);
    }
    if (ltv !== undefined) {
      updates.ltv = parseFloat(ltv);
    }
    if (penalty_after_due_date !== undefined) {
      updates.penalty_after_due_date = parseFloat(penalty_after_due_date);
    }
    if (validity_date !== undefined) {
      updates.validity_date = validity_date;
    }
    if (trip_stage !== undefined) {
      updates.trip_stage = trip_stage;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const contract = await updateContract(req.params.id, updates);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error: any) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: 'Failed to update contract', message: error.message });
  }
});

// PATCH /api/contracts/:id/status - Update contract status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'expired', 'cancelled', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const contract = await updateContractStatus(req.params.id, status);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error: any) {
    console.error('Update contract status error:', error);
    res.status(500).json({ error: 'Failed to update contract status', message: error.message });
  }
});

// DELETE /api/contracts/:id - Delete a contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await deleteContract(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error: any) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Failed to delete contract', message: error.message });
  }
});

export default router;
