-- Migration: Fix rating unique constraint for two-way ratings
-- Date: 2025-10-30
-- Description: Drop old constraint and add new one to allow both borrower and lender to rate each other

-- Drop the old unique constraint that only allowed one rating per trip
DROP INDEX IF EXISTS idx_ratings_trip_borrower_unique;

-- Create new unique constraint to prevent duplicate ratings in the same direction
-- This allows both borrower->lender and lender->borrower ratings for the same trip
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_trip_rater_type_unique ON ratings(trip_id, rated_by_id, rating_type);

-- Add comment to explain
COMMENT ON INDEX idx_ratings_trip_rater_type_unique IS 'Ensures each person can only rate once per trip per direction (prevents duplicate ratings while allowing two-way ratings)';
