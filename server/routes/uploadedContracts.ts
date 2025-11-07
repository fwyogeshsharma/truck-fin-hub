import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  getUploadedContractsByUser,
  getUploadedContractById,
  getUploadedContractsMetadataByUser,
  createUploadedContract,
  updateUploadedContract,
  deleteUploadedContract,
  CreateUploadedContractInput,
  UpdateUploadedContractInput,
} from '../../src/db/queries/uploadedContracts.ts';

const router = Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
});

// GET /api/uploaded-contracts/metadata/:userId - Get contracts metadata for a user (without file data)
router.get('/metadata/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const contracts = await getUploadedContractsMetadataByUser(userId);
    res.json(contracts);
  } catch (error: any) {
    console.error('Get uploaded contracts metadata error:', error);
    res.status(500).json({ error: 'Failed to get uploaded contracts', message: error.message });
  }
});

// GET /api/uploaded-contracts/:id - Get a specific contract with file data
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contract = await getUploadedContractById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error: any) {
    console.error('Get uploaded contract error:', error);
    res.status(500).json({ error: 'Failed to get uploaded contract', message: error.message });
  }
});

// GET /api/uploaded-contracts/:id/download - Download contract file
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contract = await getUploadedContractById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', contract.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${contract.file_name}"`);
    res.setHeader('Content-Length', contract.file_data.length);

    // Send file data
    res.send(contract.file_data);
  } catch (error: any) {
    console.error('Download contract error:', error);
    res.status(500).json({ error: 'Failed to download contract', message: error.message });
  }
});

// GET /api/uploaded-contracts/:id/view - View contract file inline
router.get('/:id/view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contract = await getUploadedContractById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Set headers for inline viewing
    res.setHeader('Content-Type', contract.file_type);
    res.setHeader('Content-Disposition', `inline; filename="${contract.file_name}"`);
    res.setHeader('Content-Length', contract.file_data.length);

    // Send file data
    res.send(contract.file_data);
  } catch (error: any) {
    console.error('View contract error:', error);
    res.status(500).json({ error: 'Failed to view contract', message: error.message });
  }
});

// POST /api/uploaded-contracts - Upload a new contract
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const body = req.body;

    // Validate required fields
    const requiredFields = [
      'user_id',
      'loan_percentage',
      'ltv',
      'penalty_after_due_date',
      'contract_type',
      'party1_name',
      'party2_name',
      'validity_date'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if 3-party contract has party3_name
    if (body.contract_type === '3-party' && !body.party3_name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'party3_name is required for 3-party contracts'
      });
    }

    const input: CreateUploadedContractInput = {
      user_id: body.user_id,
      file_name: req.file.originalname,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      file_data: req.file.buffer,
      loan_percentage: parseFloat(body.loan_percentage),
      ltv: parseFloat(body.ltv),
      penalty_after_due_date: parseFloat(body.penalty_after_due_date),
      contract_type: body.contract_type,
      party1_name: body.party1_name,
      party2_name: body.party2_name,
      party3_name: body.party3_name || undefined,
      validity_date: body.validity_date,
      trip_stage: body.trip_stage || undefined,
    };

    const contract = await createUploadedContract(input);

    // Return contract without file data
    const { file_data, ...contractWithoutFile } = contract;

    res.status(201).json(contractWithoutFile);
  } catch (error: any) {
    console.error('Upload contract error:', error);
    res.status(500).json({ error: 'Failed to upload contract', message: error.message });
  }
});

// PUT /api/uploaded-contracts/:id - Update a contract
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Check if contract exists
    const existing = await getUploadedContractById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const input: UpdateUploadedContractInput = {
      loan_percentage: body.loan_percentage !== undefined ? parseFloat(body.loan_percentage) : undefined,
      ltv: body.ltv !== undefined ? parseFloat(body.ltv) : undefined,
      penalty_after_due_date: body.penalty_after_due_date !== undefined ? parseFloat(body.penalty_after_due_date) : undefined,
      contract_type: body.contract_type,
      party1_name: body.party1_name,
      party2_name: body.party2_name,
      party3_name: body.party3_name,
      validity_date: body.validity_date,
      trip_stage: body.trip_stage,
    };

    const updated = await updateUploadedContract(id, input);

    if (!updated) {
      return res.status(404).json({ error: 'Failed to update contract' });
    }

    // Return contract without file data
    const { file_data, ...contractWithoutFile } = updated;

    res.json(contractWithoutFile);
  } catch (error: any) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: 'Failed to update contract', message: error.message });
  }
});

// DELETE /api/uploaded-contracts/:id - Delete a contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if contract exists
    const existing = await getUploadedContractById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const deleted = await deleteUploadedContract(id);

    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete contract' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Failed to delete contract', message: error.message });
  }
});

export default router;
