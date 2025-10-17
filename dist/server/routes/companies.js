import { Router } from 'express';
import { getAllCompanies, getActiveCompanies, getCompanyById, getCompanyByName, getCompanyByGST, createCompany, updateCompany, deleteCompany, verifyCompany, getCompaniesCount, } from '../../src/db/queries/companies.ts';
const router = Router();
// GET /api/companies - Get all companies or only active ones
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        let companies;
        if (active === 'true') {
            companies = await getActiveCompanies();
        }
        else {
            companies = await getAllCompanies();
        }
        res.json(companies);
    }
    catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to get companies', message: error.message });
    }
});
// GET /api/companies/count - Get companies count
router.get('/count', async (req, res) => {
    try {
        const count = await getCompaniesCount();
        res.json({ count });
    }
    catch (error) {
        console.error('Get companies count error:', error);
        res.status(500).json({ error: 'Failed to get companies count', message: error.message });
    }
});
// GET /api/companies/:id - Get company by ID
router.get('/:id', async (req, res) => {
    try {
        const company = await getCompanyById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to get company', message: error.message });
    }
});
// GET /api/companies/name/:name - Get company by name
router.get('/name/:name', async (req, res) => {
    try {
        const company = await getCompanyByName(req.params.name);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Get company by name error:', error);
        res.status(500).json({ error: 'Failed to get company', message: error.message });
    }
});
// GET /api/companies/gst/:gstNumber - Get company by GST number
router.get('/gst/:gstNumber', async (req, res) => {
    try {
        const company = await getCompanyByGST(req.params.gstNumber);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Get company by GST error:', error);
        res.status(500).json({ error: 'Failed to get company', message: error.message });
    }
});
// POST /api/companies - Create new company
router.post('/', async (req, res) => {
    try {
        const company = await createCompany(req.body);
        res.status(201).json(company);
    }
    catch (error) {
        console.error('Create company error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create company', message: error.message });
    }
});
// PUT /api/companies/:id - Update company
router.put('/:id', async (req, res) => {
    try {
        const company = await updateCompany(req.params.id, req.body);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    }
    catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ error: 'Failed to update company', message: error.message });
    }
});
// PUT /api/companies/:id/verify - Verify company
router.put('/:id/verify', async (req, res) => {
    try {
        const { verifiedBy } = req.body;
        if (!verifiedBy) {
            return res.status(400).json({ error: 'verifiedBy (user ID) is required' });
        }
        const company = await verifyCompany(req.params.id, verifiedBy);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({
            message: 'Company successfully verified',
            company,
        });
    }
    catch (error) {
        console.error('Verify company error:', error);
        res.status(500).json({ error: 'Failed to verify company', message: error.message });
    }
});
// DELETE /api/companies/:id - Soft delete company
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await deleteCompany(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({ message: 'Company deleted successfully' });
    }
    catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ error: 'Failed to delete company', message: error.message });
    }
});
export default router;
