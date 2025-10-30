import express, { Request, Response } from 'express';
import { getDatabase } from '../../src/db/database.js';

const router = express.Router();

// POST /api/ratings - Create a new rating
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const {
      trip_id,
      lender_id,
      lender_name,
      borrower_id,
      borrower_name,
      rating,
      review_text,
      loan_amount,
      interest_rate
    } = req.body;

    // Validate required fields
    if (!trip_id || !lender_id || !borrower_id || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'trip_id, lender_id, borrower_id, and rating are required'
      });
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if rating already exists for this trip and borrower
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE trip_id = $1 AND borrower_id = $2',
      [trip_id, borrower_id]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({
        error: 'Rating already exists',
        message: 'You have already rated this lender for this trip'
      });
    }

    // Generate ID
    const id = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert rating
    const result = await db.query(
      `INSERT INTO ratings (
        id, trip_id, lender_id, lender_name, borrower_id, borrower_name,
        rating, review_text, loan_amount, interest_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        trip_id,
        lender_id,
        lender_name,
        borrower_id,
        borrower_name,
        rating,
        review_text || null,
        loan_amount || null,
        interest_rate || null
      ]
    );

    // Update trip to mark as rated
    await db.query(
      'UPDATE trips SET has_rating = true, rating_id = $1 WHERE id = $2',
      [id, trip_id]
    );

    console.log('✅ [RATING] Rating created:', {
      id,
      trip_id,
      lender_id,
      rating,
      has_review: !!review_text
    });

    res.status(201).json({
      success: true,
      rating: result.rows[0]
    });
  } catch (error: any) {
    console.error('Create rating error:', error);
    res.status(500).json({
      error: 'Failed to create rating',
      message: error.message
    });
  }
});

// GET /api/ratings/lender/:lenderId - Get all ratings for a lender
router.get('/lender/:lenderId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { lenderId } = req.params;

    const result = await db.query(
      `SELECT * FROM ratings
       WHERE lender_id = $1
       ORDER BY created_at DESC`,
      [lenderId]
    );

    // Calculate average rating
    const avgResult = await db.query(
      `SELECT
        AVG(rating) as average_rating,
        COUNT(*) as total_ratings
       FROM ratings
       WHERE lender_id = $1`,
      [lenderId]
    );

    res.json({
      ratings: result.rows,
      average_rating: parseFloat(avgResult.rows[0].average_rating) || 0,
      total_ratings: parseInt(avgResult.rows[0].total_ratings) || 0
    });
  } catch (error: any) {
    console.error('Get lender ratings error:', error);
    res.status(500).json({
      error: 'Failed to get ratings',
      message: error.message
    });
  }
});

// GET /api/ratings/trip/:tripId - Get rating for a specific trip
router.get('/trip/:tripId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { tripId } = req.params;

    const result = await db.query(
      'SELECT * FROM ratings WHERE trip_id = $1',
      [tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Rating not found',
        message: 'No rating exists for this trip'
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get trip rating error:', error);
    res.status(500).json({
      error: 'Failed to get rating',
      message: error.message
    });
  }
});

// GET /api/ratings/stats/:lenderId - Get rating statistics for a lender
router.get('/stats/:lenderId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { lenderId } = req.params;

    const result = await db.query(
      `SELECT
        AVG(rating) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM ratings
       WHERE lender_id = $1`,
      [lenderId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get rating stats error:', error);
    res.status(500).json({
      error: 'Failed to get rating statistics',
      message: error.message
    });
  }
});

// GET /api/ratings/pending/:lenderId - Get trips that need rating by lender
router.get('/pending/:lenderId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { lenderId } = req.params;

    console.log('📊 [RATING] Fetching pending ratings for lender:', lenderId);

    // Debug: Check all repaid trips for this lender
    const repaidTripsDebug = await db.query(
      `SELECT id, status, lender_id, load_owner_name, repaid_at, has_rating
       FROM trips
       WHERE lender_id = $1 AND status = 'repaid'
       ORDER BY repaid_at DESC`,
      [lenderId]
    );
    console.log(`📊 [DEBUG] Found ${repaidTripsDebug.rows.length} repaid trips for lender:`,
      JSON.stringify(repaidTripsDebug.rows, null, 2));

    // Debug: Check trip_bids for this lender
    const bidsDebug = await db.query(
      `SELECT trip_id, lender_id, interest_rate, amount
       FROM trip_bids
       WHERE lender_id = $1
       LIMIT 10`,
      [lenderId]
    );
    console.log(`📊 [DEBUG] Found ${bidsDebug.rows.length} bids for lender:`,
      JSON.stringify(bidsDebug.rows, null, 2));

    // Debug: Check existing ratings
    const ratingsDebug = await db.query(
      `SELECT id, trip_id, lender_id, rating, created_at
       FROM ratings
       WHERE lender_id = $1
       LIMIT 10`,
      [lenderId]
    );
    console.log(`📊 [DEBUG] Found ${ratingsDebug.rows.length} existing ratings:`,
      JSON.stringify(ratingsDebug.rows, null, 2));

    // Find all repaid trips where this lender invested but hasn't rated yet
    // Use LEFT JOIN for trip_bids to ensure we don't miss trips without bid records
    // IMPORTANT: Check if rating exists by matching trip_id and borrower_id (since lender rates the borrower)
    const result = await db.query(
      `SELECT
        t.id as trip_id,
        t.origin,
        t.destination,
        t.load_type,
        t.amount,
        t.load_owner_id as borrower_id,
        t.load_owner_name as borrower_name,
        t.lender_id,
        t.lender_name,
        COALESCE(tb.interest_rate, 0) as interest_rate,
        COALESCE(tb.amount, t.amount) as loan_amount,
        t.repaid_at
       FROM trips t
       LEFT JOIN trip_bids tb ON t.id = tb.trip_id AND t.lender_id = tb.lender_id
       LEFT JOIN ratings r ON t.id = r.trip_id AND t.load_owner_id = r.borrower_id
       WHERE t.status = 'repaid'
         AND t.lender_id = $1
         AND r.id IS NULL
       ORDER BY t.repaid_at DESC`,
      [lenderId]
    );

    console.log(`📊 [RATING] Query result: ${result.rows.length} pending ratings`);
    if (result.rows.length > 0) {
      console.log('📊 [RATING] Pending ratings:', JSON.stringify(result.rows, null, 2));
    }

    res.json({
      success: true,
      pendingRatings: result.rows
    });
  } catch (error: any) {
    console.error('Get pending ratings error:', error);
    res.status(500).json({
      error: 'Failed to get pending ratings',
      message: error.message
    });
  }
});

export default router;
