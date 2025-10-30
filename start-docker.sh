#!/bin/bash

# Exit on any error
set -e

# Configuration
export COMPOSE_HTTP_TIMEOUT=300

echo "🚀 Starting LogiFin Docker Deployment"
echo "===================================="
echo ""

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Clean up Docker resources
echo "🧹 Cleaning up Docker resources..."
docker system prune -f

# Build and start services
echo ""
echo "🔨 Building and starting services..."
echo "   - PostgreSQL Database"
echo "   - Backend API Server"
echo ""

docker-compose up -d --build --force-recreate backend

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Run database migrations
echo ""
echo "🔄 Running Database Migrations..."
echo "=================================="

# Wait for PostgreSQL to be ready
DB_NAME="${DB_NAME:-logifin}"
DB_USER="${DB_USER:-postgres}"

until docker exec logifin-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  echo "   Waiting for database..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run migrations
docker exec -i logifin-postgres psql -U "$DB_USER" -d "$DB_NAME" << 'EOFMIGRATION'
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  gst_number VARCHAR(20) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Add user_type and company_id columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20)
  CHECK(user_type IN ('individual', 'company'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Set default user_type
UPDATE users SET user_type = CASE
  WHEN company IS NOT NULL AND company != '' THEN 'company'
  ELSE 'individual'
END WHERE user_type IS NULL;

-- Insert sample companies
INSERT INTO companies (id, name, display_name, email, phone, address, is_active)
VALUES
  ('company_rr', 'Rolling Radius', 'Rolling Radius', 'contact@rr.com', '9876543210', 'Mumbai, India', TRUE),
  ('company_abc', 'ABC Logistics', 'ABC Logistics', 'info@abc.com', '9876543211', 'Delhi, India', TRUE),
  ('company_xyz', 'XYZ Transport', 'XYZ Transport', 'hello@xyz.com', '9876543212', 'Bangalore, India', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create theme_settings table
CREATE TABLE IF NOT EXISTS theme_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Insert default theme colors
INSERT INTO theme_settings (setting_key, setting_value, updated_by) VALUES
  ('primary_color', '#3b82f6', 'system'),
  ('primary_color_dark', '#2563eb', 'system'),
  ('secondary_color', '#10b981', 'system'),
  ('accent_color', '#f59e0b', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_theme_settings_key ON theme_settings(setting_key);

-- Add comment
COMMENT ON TABLE theme_settings IS 'Stores customizable theme colors and settings for the application';

-- Migration 014: Add Lender Financial Profile Columns
-- Add financial profile columns to users table for lender investment capacity assessment
ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_income VARCHAR(20) CHECK(annual_income IN ('below_5L', '5L_10L', '10L_25L', '25L_50L', 'above_50L'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investable_surplus VARCHAR(20) CHECK(investable_surplus IN ('below_1L', '1L_5L', '5L_10L', '10L_25L', 'above_25L'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_experience VARCHAR(20) CHECK(investment_experience IN ('beginner', 'intermediate', 'experienced', 'expert'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_appetite VARCHAR(20) CHECK(risk_appetite IN ('conservative', 'moderate', 'aggressive'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR(20) CHECK(investment_horizon IN ('short', 'medium', 'long', 'flexible'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_investment_per_deal VARCHAR(20) CHECK(max_investment_per_deal IN ('below_25K', '25K_50K', '50K_1L', '1L_2L', 'above_2L'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS financial_profile_updated_at TIMESTAMP;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_financial_profile_completed ON users(financial_profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_risk_appetite ON users(risk_appetite);
CREATE INDEX IF NOT EXISTS idx_users_investment_experience ON users(investment_experience);

-- Add comments
COMMENT ON COLUMN users.annual_income IS 'Lender annual income range for investment capacity assessment';
COMMENT ON COLUMN users.investable_surplus IS 'Lender available surplus funds for investments';
COMMENT ON COLUMN users.investment_experience IS 'Lender experience level with investments';
COMMENT ON COLUMN users.risk_appetite IS 'Lender comfort level with investment risk';
COMMENT ON COLUMN users.investment_horizon IS 'Lender preferred investment duration';
COMMENT ON COLUMN users.max_investment_per_deal IS 'Maximum amount lender willing to invest per trip';
COMMENT ON COLUMN users.financial_profile_completed IS 'Whether lender has completed the financial questionnaire';
COMMENT ON COLUMN users.financial_profile_updated_at IS 'Timestamp when financial profile was last updated';

-- Migration 015: Add Loan Contracts and Agreements
-- Stores reusable contract templates for lenders
CREATE TABLE IF NOT EXISTS loan_contract_templates (
  id VARCHAR(255) PRIMARY KEY,
  lender_id VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  terms_and_conditions TEXT NOT NULL,
  interest_rate_clause TEXT,
  repayment_clause TEXT,
  late_payment_clause TEXT,
  default_clause TEXT,
  custom_clauses JSONB,
  lender_signature_image TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loan_contract_templates_lender ON loan_contract_templates(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_contract_templates_default ON loan_contract_templates(lender_id, is_default);

-- Stores actual loan agreements for each bid/trip
CREATE TABLE IF NOT EXISTS loan_agreements (
  id VARCHAR(255) PRIMARY KEY,
  trip_id VARCHAR(255) NOT NULL,
  bid_id VARCHAR(255) NOT NULL,
  lender_id VARCHAR(255) NOT NULL,
  borrower_id VARCHAR(255) NOT NULL,
  contract_terms TEXT NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  loan_amount NUMERIC(10,2) NOT NULL,
  maturity_days INTEGER NOT NULL,
  terms_and_conditions TEXT,
  interest_rate_clause TEXT,
  repayment_clause TEXT,
  late_payment_clause TEXT,
  default_clause TEXT,
  custom_clauses JSONB,
  lender_signature_image TEXT,
  lender_signed_at TIMESTAMP,
  borrower_signature_image TEXT,
  borrower_signed_at TIMESTAMP,
  status VARCHAR(50) CHECK(status IN ('pending_borrower', 'accepted', 'rejected')) DEFAULT 'pending_borrower',
  contract_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (bid_id) REFERENCES trip_bids(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id),
  FOREIGN KEY (borrower_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_loan_agreements_trip ON loan_agreements(trip_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_bid ON loan_agreements(bid_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_lender ON loan_agreements(lender_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_borrower ON loan_agreements(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loan_agreements_status ON loan_agreements(status);

-- Add contract reference to trip_bids
ALTER TABLE trip_bids ADD COLUMN IF NOT EXISTS contract_id VARCHAR(255);
ALTER TABLE trip_bids ADD COLUMN IF NOT EXISTS has_contract BOOLEAN DEFAULT FALSE;

-- Add contract acceptance fields to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contract_id VARCHAR(255);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS borrower_signature_image TEXT;

COMMENT ON TABLE loan_contract_templates IS 'Reusable contract templates created by lenders';
COMMENT ON TABLE loan_agreements IS 'Loan contracts between lenders and borrowers for specific trips';

-- Migration 016: Create Platform Fees Table
-- Track all platform fees collected from loan disbursements
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL,
  lender_id TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  loan_amount DECIMAL(15, 2) NOT NULL,
  fee_percentage DECIMAL(5, 3) NOT NULL,
  fee_amount DECIMAL(15, 2) NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  super_admin_transaction_id TEXT,
  borrower_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_platform_fees_trip_id ON platform_fees(trip_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_lender_id ON platform_fees(lender_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_borrower_id ON platform_fees(borrower_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_collected_at ON platform_fees(collected_at);

-- Add foreign key constraints (skip if tables don't exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trips') THEN
    ALTER TABLE platform_fees DROP CONSTRAINT IF EXISTS fk_platform_fees_trip;
    ALTER TABLE platform_fees ADD CONSTRAINT fk_platform_fees_trip
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE platform_fees DROP CONSTRAINT IF EXISTS fk_platform_fees_lender;
    ALTER TABLE platform_fees ADD CONSTRAINT fk_platform_fees_lender
      FOREIGN KEY (lender_id) REFERENCES users(id) ON DELETE CASCADE;

    ALTER TABLE platform_fees DROP CONSTRAINT IF EXISTS fk_platform_fees_borrower;
    ALTER TABLE platform_fees ADD CONSTRAINT fk_platform_fees_borrower
      FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE platform_fees IS 'Track all platform fees collected from loan disbursements (0.5% transaction fee)';

-- Migration 020: Add Repayment Fields and 'repaid' Status
-- Add 'repaid' to status check constraint
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK(status IN ('pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled', 'repaid'));

-- Add repayment tracking fields
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repaid_at TIMESTAMP;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_amount NUMERIC(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_principal NUMERIC(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_interest NUMERIC(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS repayment_days INTEGER;

-- Create index for repaid trips
CREATE INDEX IF NOT EXISTS idx_trips_repaid_at ON trips(repaid_at);

-- Add comments for documentation
COMMENT ON COLUMN trips.repaid_at IS 'Timestamp when the loan was fully repaid';
COMMENT ON COLUMN trips.repayment_amount IS 'Total amount repaid (principal + interest)';
COMMENT ON COLUMN trips.repayment_principal IS 'Principal amount repaid';
COMMENT ON COLUMN trips.repayment_interest IS 'Interest amount paid';
COMMENT ON COLUMN trips.repayment_days IS 'Actual number of days for which interest was calculated';

-- Migration 021: Add Ratings Table
-- Create ratings table for lender reviews
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

-- Add rating reference to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS has_rating BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_id VARCHAR(255);

-- Create index
CREATE INDEX IF NOT EXISTS idx_trips_has_rating ON trips(has_rating);

-- Add comments for documentation
COMMENT ON TABLE ratings IS 'Borrower ratings and reviews for lenders after loan repayment';
COMMENT ON COLUMN ratings.rating IS 'Star rating from 1 to 5';
COMMENT ON COLUMN ratings.review_text IS 'Optional review comment from borrower';

-- Migration 026: Add Rating Direction Fields
-- Add fields to track who rated whom (lender rating borrower or vice versa)
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rated_by_id VARCHAR(255);
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rated_user_id VARCHAR(255);
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rating_type VARCHAR(50) CHECK(rating_type IN ('lender_rates_borrower', 'borrower_rates_lender'));

-- Add comment to explain the fields
COMMENT ON COLUMN ratings.rated_by_id IS 'User ID of the person who gave the rating';
COMMENT ON COLUMN ratings.rated_user_id IS 'User ID of the person who was rated';
COMMENT ON COLUMN ratings.rating_type IS 'Type of rating: lender_rates_borrower or borrower_rates_lender';

-- Drop old unique constraint that prevents two-way ratings
DROP INDEX IF EXISTS idx_ratings_trip_borrower_unique;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_ratings_rated_by ON ratings(rated_by_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_type ON ratings(rating_type);

-- Create new unique constraint to prevent duplicate ratings in the same direction
-- Allows both borrower->lender and lender->borrower ratings for same trip
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_trip_rater_type_unique ON ratings(trip_id, rated_by_id, rating_type);

-- For existing ratings, we can infer the direction:
-- If we don't have rated_by_id, assume it was lender rating borrower (old behavior)
UPDATE ratings
SET
  rating_type = 'lender_rates_borrower',
  rated_by_id = lender_id,
  rated_user_id = borrower_id
WHERE rated_by_id IS NULL;

SELECT 'Migrations completed!' as status;
EOFMIGRATION

echo "✅ Migrations completed!"

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Show logs
echo ""
echo "📋 Recent Logs:"
docker-compose logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Services available at:"
echo "   - Backend API: http://localhost:4000/api"
echo "   - Health Check: http://localhost:4000/api/health"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - View backend logs: docker-compose logs -f backend"
echo "   - View database logs: docker-compose logs -f postgres"
echo "   - Stop services: docker-compose down"
echo "   - Restart backend: docker-compose restart backend"
echo ""
