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

// Get reconciliations pending lender approval (must come before /:id route)
router.get('/lender/pending-claims', async (req, res) => {
  try {
    const db = await getDatabase();
    const { lenderId } = req.query;

    if (!lenderId) {
      return res.status(400).json({ error: 'Lender ID is required' });
    }

    // First check if the claim columns exist
    const columnCheck = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'reconciliations'
       AND column_name IN ('claim_requested', 'lender_approved', 'lender_id')`
    );

    // If columns don't exist yet, return empty array
    if (columnCheck.rows.length < 3) {
      console.log('Reconciliation claim columns not yet created. Run migration 030.');
      return res.json([]);
    }

    const result = await db.query(
      `SELECT r.*,
              t.name as transporter_name,
              ta.name as trust_account_name,
              tr.origin, tr.destination, tr.load_type, tr.distance, tr.amount as trip_amount
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

// Get all active trips for transporter (for reconciliation)
router.get('/trips/active', async (req, res) => {
  try {
    const db = await getDatabase();
    const { transporterId } = req.query;

    if (!transporterId) {
      return res.status(400).json({ error: 'Transporter ID is required' });
    }

    // Get all active trips for this transporter
    const query = `SELECT
      t.id,
      t.origin,
      t.destination,
      t.load_type,
      t.amount,
      t.distance,
      t.lender_id,
      t.lender_name,
      t.status,
      t.completed_at,
      t.funded_at,
      t.interest_rate,
      t.maturity_days,
      t.created_at
     FROM trips t
     WHERE t.transporter_id = $1
       AND t.status IN ('funded', 'in_transit', 'completed', 'repaid')
     ORDER BY t.created_at DESC`;

    const result = await db.query(query, [transporterId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching active trips:', error);
    res.status(500).json({ error: 'Failed to fetch active trips' });
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
      selected_trip_ids,
      selected_lender_id,
      selected_lender_name,
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

    // If selected_trip_ids is provided, ensure it's an array
    const tripIdsJson = selected_trip_ids ? JSON.stringify(selected_trip_ids) : null;

    const result = await db.query(
      `INSERT INTO reconciliations (
        id, transporter_id, transporter_name, trust_account_id, trust_account_name,
        trip_id, selected_trip_ids, selected_lender_id, selected_lender_name,
        document_name, document_type, document_url, document_data, document_size,
        description, reconciliation_amount, reconciliation_date, status, workflow_status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      RETURNING *`,
      [
        id,
        transporter_id,
        transporter_name,
        trust_account_id,
        trust_account_name,
        trip_id || null,
        tripIdsJson,
        selected_lender_id || null,
        selected_lender_name || null,
        document_name,
        document_type,
        document_url || '',
        document_data,
        document_size,
        description || null,
        reconciliation_amount || null,
        reconciliation_date || null,
        'pending',
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

// Approve reconciliation (trust account) - This triggers the dual approval workflow
router.patch('/:id/approve', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { reviewed_by } = req.body;

    if (!reviewed_by) {
      return res.status(400).json({ error: 'Reviewer ID is required' });
    }

    // Get reconciliation details
    const reconResult = await db.query(
      'SELECT * FROM reconciliations WHERE id = $1',
      [id]
    );

    if (reconResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    const recon = reconResult.rows[0];

    // Update reconciliation status to approved by trust account
    const result = await db.query(
      `UPDATE reconciliations
       SET status = 'approved',
           workflow_status = 'trust_approved',
           reviewed_by = $1,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reviewed_by, id]
    );

    // Create notification for lender (if lender is selected)
    if (recon.selected_lender_id) {
      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, link, created_at, read)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recon.selected_lender_id,
          'reconciliation_approval',
          'Reconciliation Approval Request',
          `Reconciliation for ${recon.reconciliation_amount ? '₹' + recon.reconciliation_amount : 'trips'} requires your approval.`,
          `/reconciliation-approvals`,
        ]
      );
    }

    // Create notification for transporter
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, link, created_at, read)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
      [
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recon.transporter_id,
        'reconciliation_approval',
        'Reconciliation Approval Request',
        `Your reconciliation for ${recon.reconciliation_amount ? '₹' + recon.reconciliation_amount : 'trips'} requires your approval.`,
        `/reconciliation`,
      ]
    );

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

    // Check if the claim columns exist
    const columnCheck = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'reconciliations'
       AND column_name IN ('claim_requested', 'lender_id')`
    );

    if (columnCheck.rows.length < 2) {
      return res.status(400).json({ error: 'Claim feature not available. Please run migration 030.' });
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

    // Check if the claim columns exist
    const columnCheck = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'reconciliations'
       AND column_name IN ('lender_approved', 'payment_notification_sent')`
    );

    if (columnCheck.rows.length < 2) {
      return res.status(400).json({ error: 'Claim approval feature not available. Please run migration 030.' });
    }

    // Get reconciliation details
    const reconResult = await db.query(
      'SELECT * FROM reconciliations WHERE id = $1',
      [id]
    );

    if (reconResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    const recon = reconResult.rows[0];

    // Update lender approval
    const result = await db.query(
      `UPDATE reconciliations
       SET lender_approved = TRUE,
           lender_approved_at = NOW(),
           workflow_status = CASE
             WHEN transporter_approved = TRUE THEN 'all_approved'
             ELSE 'lender_approved'
           END,
           updated_at = NOW()
       WHERE id = $1 AND (selected_lender_id = $2 OR lender_id = $2)
       RETURNING *`,
      [id, lender_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found or not authorized' });
    }

    const updatedRecon = result.rows[0];

    // If both lender and transporter have approved, generate bank request
    if (updatedRecon.lender_approved && updatedRecon.transporter_approved) {
      const bankMessage = 'Within 24-48 hours you will see the bank trust account request. Please verify and approve that to complete the payment process.';

      await db.query(
        `UPDATE reconciliations
         SET bank_request_generated = TRUE,
             bank_request_generated_at = NOW(),
             bank_request_message = $1,
             workflow_status = 'bank_request_sent',
             payment_notification_sent = TRUE,
             payment_notification_message = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [bankMessage, id]
      );

      // Notify transporter about bank request
      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, link, created_at, read)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recon.transporter_id,
          'bank_request_generated',
          'Bank Trust Account Request Generated',
          bankMessage,
          `/reconciliation`,
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving claim:', error);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
});

// Approve reconciliation (transporter) - NEW
router.patch('/:id/approve-transporter', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { transporter_id } = req.body;

    if (!transporter_id) {
      return res.status(400).json({ error: 'Transporter ID is required' });
    }

    // Get reconciliation details
    const reconResult = await db.query(
      'SELECT * FROM reconciliations WHERE id = $1',
      [id]
    );

    if (reconResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found' });
    }

    const recon = reconResult.rows[0];

    // Update transporter approval
    const result = await db.query(
      `UPDATE reconciliations
       SET transporter_approved = TRUE,
           transporter_approved_at = NOW(),
           workflow_status = CASE
             WHEN lender_approved = TRUE THEN 'all_approved'
             ELSE 'transporter_approved'
           END,
           updated_at = NOW()
       WHERE id = $1 AND transporter_id = $2
       RETURNING *`,
      [id, transporter_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reconciliation not found or not authorized' });
    }

    const updatedRecon = result.rows[0];

    // If both lender and transporter have approved, generate bank request
    if (updatedRecon.lender_approved && updatedRecon.transporter_approved) {
      const bankMessage = 'Within 24-48 hours you will see the bank trust account request. Please verify and approve that to complete the payment process.';

      await db.query(
        `UPDATE reconciliations
         SET bank_request_generated = TRUE,
             bank_request_generated_at = NOW(),
             bank_request_message = $1,
             workflow_status = 'bank_request_sent',
             payment_notification_sent = TRUE,
             payment_notification_message = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [bankMessage, id]
      );

      // Notify both parties about bank request
      await db.query(
        `INSERT INTO notifications (id, user_id, type, title, message, link, created_at, read)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          recon.transporter_id,
          'bank_request_generated',
          'Bank Trust Account Request Generated',
          bankMessage,
          `/reconciliation`,
        ]
      );

      if (recon.selected_lender_id) {
        await db.query(
          `INSERT INTO notifications (id, user_id, type, title, message, link, created_at, read)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
          [
            `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            recon.selected_lender_id,
            'bank_request_generated',
            'Bank Trust Account Request Generated',
            bankMessage,
            `/reconciliation-approvals`,
          ]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error approving by transporter:', error);
    res.status(500).json({ error: 'Failed to approve reconciliation' });
  }
});

// Get pending approvals for lender
router.get('/lender/pending-approvals', async (req, res) => {
  try {
    const db = await getDatabase();
    const { lenderId } = req.query;

    if (!lenderId) {
      return res.status(400).json({ error: 'Lender ID is required' });
    }

    const result = await db.query(
      `SELECT r.*,
              t.name as transporter_name,
              ta.name as trust_account_name
       FROM reconciliations r
       LEFT JOIN users t ON r.transporter_id = t.id
       LEFT JOIN users ta ON r.trust_account_id = ta.id
       WHERE r.selected_lender_id = $1
         AND r.workflow_status = 'trust_approved'
         AND r.lender_approved = FALSE
       ORDER BY r.created_at DESC`,
      [lenderId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

export default router;
