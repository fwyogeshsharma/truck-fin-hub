import express, { Request, Response } from 'express';
import { db } from '../../src/db/database.ts';

const router = express.Router();

// POST /api/ratings - Create a new rating
router.post('/', async (req: Request, res: Response) => {
  try {
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

export default router;
