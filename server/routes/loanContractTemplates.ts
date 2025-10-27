import { Router, Request, Response } from 'express';
import {
  getAllLoanContractTemplates,
  getLoanContractTemplateById,
  getLoanContractTemplatesByLender,
  getDefaultLoanContractTemplate,
  createLoanContractTemplate,
  updateLoanContractTemplate,
  deleteLoanContractTemplate,
  CreateLoanContractTemplateInput,
  UpdateLoanContractTemplateInput,
} from '../../src/db/queries/loanContractTemplates.ts';

const router = Router();

// GET /api/loan-contract-templates - Get all templates or filter by lender
router.get('/', async (req: Request, res: Response) => {
  try {
    const { lenderId } = req.query;

    let templates;
    if (lenderId) {
      templates = await getLoanContractTemplatesByLender(lenderId as string);
    } else {
      templates = await getAllLoanContractTemplates();
    }

    res.json(templates);
  } catch (error: any) {
    console.error('Get loan contract templates error:', error);
    res.status(500).json({ error: 'Failed to get loan contract templates', message: error.message });
  }
});

// GET /api/loan-contract-templates/lender/:lenderId - Get templates for a specific lender
router.get('/lender/:lenderId', async (req: Request, res: Response) => {
  try {
    const { lenderId } = req.params;
    const templates = await getLoanContractTemplatesByLender(lenderId);
    res.json(templates);
  } catch (error: any) {
    console.error('Get lender templates error:', error);
    res.status(500).json({ error: 'Failed to get lender templates', message: error.message });
  }
});

// GET /api/loan-contract-templates/lender/:lenderId/default - Get default template for a lender
router.get('/lender/:lenderId/default', async (req: Request, res: Response) => {
  try {
    const { lenderId } = req.params;
    const template = await getDefaultLoanContractTemplate(lenderId);

    if (!template) {
      return res.status(404).json({ error: 'No default template found for this lender' });
    }

    res.json(template);
  } catch (error: any) {
    console.error('Get default template error:', error);
    res.status(500).json({ error: 'Failed to get default template', message: error.message });
  }
});

// GET /api/loan-contract-templates/:id - Get a specific template
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await getLoanContractTemplateById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template', message: error.message });
  }
});

// POST /api/loan-contract-templates - Create a new template
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Normalize field names (accept both camelCase and snake_case)
    const input: CreateLoanContractTemplateInput = {
      lender_id: body.lender_id || body.lenderId,
      template_name: body.template_name || body.templateName,
      terms_and_conditions: body.terms_and_conditions || body.termsAndConditions,
      interest_rate_clause: body.interest_rate_clause || body.interestRateClause,
      repayment_clause: body.repayment_clause || body.repaymentClause,
      late_payment_clause: body.late_payment_clause || body.latePaymentClause,
      default_clause: body.default_clause || body.defaultClause,
      custom_clauses: body.custom_clauses || body.customClauses,
      lender_signature_image: body.lender_signature_image || body.lenderSignatureImage,
      is_default: body.is_default !== undefined ? body.is_default : body.isDefault,
    };

    // Validate required fields
    const requiredFields = ['lender_id', 'template_name', 'terms_and_conditions'];
    const missingFields = requiredFields.filter(field => !input[field as keyof CreateLoanContractTemplateInput]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const template = await createLoanContractTemplate(input);
    res.status(201).json(template);
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template', message: error.message });
  }
});

// PUT /api/loan-contract-templates/:id - Update a template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Normalize field names (accept both camelCase and snake_case)
    const input: UpdateLoanContractTemplateInput = {
      template_name: body.template_name || body.templateName,
      terms_and_conditions: body.terms_and_conditions || body.termsAndConditions,
      interest_rate_clause: body.interest_rate_clause || body.interestRateClause,
      repayment_clause: body.repayment_clause || body.repaymentClause,
      late_payment_clause: body.late_payment_clause || body.latePaymentClause,
      default_clause: body.default_clause || body.defaultClause,
      custom_clauses: body.custom_clauses || body.customClauses,
      lender_signature_image: body.lender_signature_image || body.lenderSignatureImage,
      is_default: body.is_default !== undefined ? body.is_default : body.isDefault,
    };

    // Check if template exists
    const existing = await getLoanContractTemplateById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updated = await updateLoanContractTemplate(id, input);
    res.json(updated);
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template', message: error.message });
  }
});

// DELETE /api/loan-contract-templates/:id - Delete a template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existing = await getLoanContractTemplateById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await deleteLoanContractTemplate(id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template', message: error.message });
  }
});

export default router;
