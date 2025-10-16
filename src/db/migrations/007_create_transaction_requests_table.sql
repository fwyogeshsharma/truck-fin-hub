-- Create transaction_requests table for managing add money and withdrawal requests
CREATE TABLE IF NOT EXISTS transaction_requests (
  id VARCHAR(100) PRIMARY KEY DEFAULT ('tr-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || substr(md5(random()::text), 1, 9)),
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('add_money', 'withdrawal')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- For add money requests - user uploads transaction proof
  transaction_image_url TEXT, -- URL to uploaded transaction screenshot

  -- For withdrawal requests - user selects bank account
  bank_account_id VARCHAR(100), -- Reference to user's bank account (stored in localStorage, so we store ID)
  bank_account_number VARCHAR(18),
  bank_ifsc_code VARCHAR(11),
  bank_name VARCHAR(200),

  -- LogiFin bank details (for add money)
  logifin_account_number VARCHAR(18) DEFAULT '1234567890123456',
  logifin_ifsc_code VARCHAR(11) DEFAULT 'SBIN0001234',
  logifin_account_holder VARCHAR(200) DEFAULT 'LogiFin Private Limited',

  -- Admin action fields
  processed_by VARCHAR(100) REFERENCES users(id), -- Super admin who processed the request
  processed_at TIMESTAMP,
  transaction_id VARCHAR(100), -- Transaction ID entered by admin after verification
  admin_notes TEXT, -- Admin notes/reason for rejection

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_transaction_requests_user_id ON transaction_requests(user_id);
CREATE INDEX idx_transaction_requests_status ON transaction_requests(status);
CREATE INDEX idx_transaction_requests_request_type ON transaction_requests(request_type);
CREATE INDEX idx_transaction_requests_created_at ON transaction_requests(created_at DESC);

-- Add comment
COMMENT ON TABLE transaction_requests IS 'Transaction requests for add money and withdrawal operations requiring super admin verification';
