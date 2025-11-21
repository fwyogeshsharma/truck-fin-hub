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

// Approve reconciliation (trust account)
router.patch('/:id/approve', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { reviewed_by } = req.body;

    if (!reviewed_by) {
      return res.status(400).json({ error: 'Reviewer ID is required' });
    }

    const result = await db.query(
      `UPDATE reconciliations
       SET status = 'approved',
           reviewed_by = $1,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reviewed_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving reconciliation:', error);
    res.status(500).json({ error: 'Failed to approve reconciliation' });
  }
});

// Reject reconciliation (trust account)
router.patch('/:id/reject', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { reviewed_by, review_notes } = req.body;

    if (!reviewed_by) {
      return res.status(400).json({ error: 'Reviewer ID is required' });
    }

    const result = await db.query(
      `UPDATE reconciliations
       SET status = 'rejected',
           reviewed_by = $1,
           review_notes = $2,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [reviewed_by, review_notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting reconciliation:', error);
    res.status(500).json({ error: 'Failed to reject reconciliation' });
  }
});

// Request claim (transporter - after approval)
router.patch('/:id/claim', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const {
      trip_id,
      lender_id,
      lender_name,
      lender_claim_amount,
      transporter_claim_amount,
      claim_amount
    } = req.body;

    if (!trip_id || !lender_id) {
      return res.status(400).json({ error: 'Trip ID and Lender ID are required' });
    }

    // Check if reconciliation is approved
    const checkResult = await db.query(
      'SELECT status FROM reconciliations WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    if (checkResult.rows[0].status !== 'approved') {
      return res.status(400).json({ error: 'Reconciliation must be approved before claiming' });
    }

    const result = await db.query(
      `UPDATE reconciliations
       SET claim_requested = TRUE,
           claim_requested_at = NOW(),
           trip_id = $1,
           lender_id = $2,
           lender_name = $3,
           lender_claim_amount = $4,
           transporter_claim_amount = $5,
           claim_amount = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [trip_id, lender_id, lender_name, lender_claim_amount, transporter_claim_amount, claim_amount, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error requesting claim:', error);
    res.status(500).json({ error: 'Failed to request claim' });
  }
});

// Approve claim (lender)
router.patch('/:id/approve-claim', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { lender_id } = req.body;

    if (!lender_id) {
      return res.status(400).json({ error: 'Lender ID is required' });
    }

    // Generate payment notification message
    const paymentMessage = 'Within 24 hours you will receive an approval request in Jaipur Golden Trust Account. Please approve that to complete the payment process.';

    const result = await db.query(
      `UPDATE reconciliations
       SET lender_approved = TRUE,
           lender_approved_at = NOW(),
           payment_notification_sent = TRUE,
           payment_notification_message = $1,
           updated_at = NOW()
       WHERE id = $2 AND lender_id = $3
       RETURNING *`,
      [paymentMessage, id, lender_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving claim:', error);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

// Get reconciliations pending lender approval
router.get('/lender/pending-claims', async (req, res) => {
  try {
    const db = await getDatabase();
    const { lenderId } = req.query;

    if (!lenderId) {
      return res.status(400).json({ error: 'Lender ID is required' });
    }

    const result = await db.query(
      `SELECT r.*,
              t.name as transporter_name,
              ta.name as trust_account_name,
              tr.origin, tr.destination, tr.load_type, tr.distance, tr.eway_bill_number
       FROM reconciliations r
       LEFT JOIN users t ON r.transporter_id = t.id
       LEFT JOIN users ta ON r.trust_account_id = ta.id
       LEFT JOIN trips tr ON r.trip_id = tr.id
       WHERE r.lender_id = $1
         AND r.claim_requested = TRUE
         AND r.lender_approved = FALSE
       ORDER BY r.claim_requested_at DESC`,
      [lenderId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending claims:', error);
    res.status(500).json({ error: 'Failed to fetch pending claims' });
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
