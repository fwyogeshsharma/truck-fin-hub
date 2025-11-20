import express from 'express';
import { getDatabase } from '../../src/db/database.js';

const router = express.Router();

// Get all reconciliations for current user (transporter or trust account)
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const userId = req.query.userId as string;
    const userRole = req.query.userRole as string;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let query;
    if (userRole === 'trust_account') {
      // Trust account sees reconciliations assigned to them
      query = `
        SELECT r.*,
               t.name as transporter_name,
               ta.name as trust_account_name
        FROM reconciliations r
        LEFT JOIN users t ON r.transporter_id = t.id
        LEFT JOIN users ta ON r.trust_account_id = ta.id
        WHERE r.trust_account_id = $1
        ORDER BY r.created_at DESC
      `;
    } else {
      // Transporter sees their own reconciliations
      query = `
        SELECT r.*,
               t.name as transporter_name,
               ta.name as trust_account_name
        FROM reconciliations r
        LEFT JOIN users t ON r.transporter_id = t.id
        LEFT JOIN users ta ON r.trust_account_id = ta.id
        WHERE r.transporter_id = $1
        ORDER BY r.created_at DESC
      `;
    }

    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reconciliations:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliations' });
  }
});

// Get a single reconciliation by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    const result = await db.query(
      `SELECT r.*,
              t.name as transporter_name,
              ta.name as trust_account_name,
              reviewer.name as reviewer_name
       FROM reconciliations r
       LEFT JOIN users t ON r.transporter_id = t.id
       LEFT JOIN users ta ON r.trust_account_id = ta.id
       LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliation' });
  }
});

// Create a new reconciliation
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const {
      id,
      transporter_id,
      transporter_name,
      trust_account_id,
      trust_account_name,
      trip_id,
      document_name,
      document_type,
      document_url,
      document_data,
      document_size,
      description,
      reconciliation_amount,
      reconciliation_date,
    } = req.body;

    // Validation
    if (!id || !transporter_id || !trust_account_id || !document_name || !document_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO reconciliations (
        id, transporter_id, transporter_name, trust_account_id, trust_account_name,
        trip_id, document_name, document_type, document_url, document_data, document_size,
        description, reconciliation_amount, reconciliation_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        id,
        transporter_id,
        transporter_name,
        trust_account_id,
        trust_account_name,
        trip_id || null,
        document_name,
        document_type,
        document_url || '',
        document_data,
        document_size,
        description || null,
        reconciliation_amount || null,
        reconciliation_date || null,
        'pending',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reconciliation:', error);
    res.status(500).json({ error: 'Failed to create reconciliation' });
  }
});

// Update reconciliation status (for trust account review)
router.patch('/:id/review', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { status, review_notes, reviewed_by } = req.body;

    if (!status || !reviewed_by) {
      return res.status(400).json({ error: 'Status and reviewer ID are required' });
    }

    if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE reconciliations
       SET status = $1,
           review_notes = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, review_notes || null, reviewed_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating reconciliation:', error);
    res.status(500).json({ error: 'Failed to update reconciliation' });
  }
});

// Delete a reconciliation (only by transporter who created it)
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if reconciliation belongs to this transporter
    const checkResult = await db.query(
      'SELECT transporter_id FROM reconciliations WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    if (checkResult.rows[0].transporter_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this reconciliation' });
    }

    await db.query('DELETE FROM reconciliations WHERE id = $1', [id]);

    res.json({ message: 'Reconciliation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reconciliation:', error);
    res.status(500).json({ error: 'Failed to delete reconciliation' });
  }
});

// Get all trust account users (for dropdown selection)
router.get('/trust-accounts/list', async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.query(
      `SELECT id, name, email, company
       FROM users
       WHERE role = 'trust_account'
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trust accounts:', error);
    res.status(500).json({ error: 'Failed to fetch trust accounts' });
  }
});

export default router;
