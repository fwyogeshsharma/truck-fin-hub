-- Migration: Add rating direction fields to ratings table
-- Date: 2025-10-30
-- Description: Add fields to track who rated whom (lender rating borrower or vice versa)

-- Add new columns to track rating direction
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rated_by_id TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rated_user_id TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rating_type TEXT CHECK(rating_type IN ('lender_rates_borrower', 'borrower_rates_lender'));

-- Add comment to explain the fields
COMMENT ON COLUMN ratings.rated_by_id IS 'User ID of the person who gave the rating';
COMMENT ON COLUMN ratings.rated_user_id IS 'User ID of the person who was rated';
COMMENT ON COLUMN ratings.rating_type IS 'Type of rating: lender_rates_borrower or borrower_rates_lender';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ratings_rated_by ON ratings(rated_by_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_type ON ratings(rating_type);

-- For existing ratings, we can infer the direction:
-- If we don't have rated_by_id, assume it was lender rating borrower (old behavior)
UPDATE ratings
SET
  rating_type = 'lender_rates_borrower',
  rated_by_id = lender_id,
  rated_user_id = borrower_id
WHERE rated_by_id IS NULL;
