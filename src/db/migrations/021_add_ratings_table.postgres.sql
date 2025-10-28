-- Migration: Add ratings table for lender reviews
-- Date: 2025-10-28

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id VARCHAR(255) PRIMARY KEY,
  trip_id VARCHAR(255) NOT NULL,
  lender_id VARCHAR(255) NOT NULL,
  lender_name VARCHAR(255) NOT NULL,
  borrower_id VARCHAR(255) NOT NULL,
  borrower_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  review_text TEXT,
  loan_amount NUMERIC(10,2),
  interest_rate NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ratings_trip ON ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_lender ON ratings(lender_id);
CREATE INDEX IF NOT EXISTS idx_ratings_borrower ON ratings(borrower_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- Create unique constraint to prevent duplicate ratings for same trip
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_trip_borrower_unique ON ratings(trip_id, borrower_id);

-- Add rating reference to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS has_rating BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_id VARCHAR(255);

-- Create index
CREATE INDEX IF NOT EXISTS idx_trips_has_rating ON trips(has_rating);

-- Add comments for documentation
COMMENT ON TABLE ratings IS 'Borrower ratings and reviews for lenders after loan repayment';
COMMENT ON COLUMN ratings.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN ratings.review_text IS 'Optional review comment from borrower';
COMMENT ON COLUMN ratings.loan_amount IS 'Loan amount for reference';
COMMENT ON COLUMN ratings.interest_rate IS 'Interest rate for reference';
