# Quick Fix: Create Companies Table

## Problem
API returns error: "relation \"companies\" does not exist"

## Solution - Run This on Your VM

### Step 1: SSH into your VM
```bash
ssh user@34.93.247.3
```

### Step 2: Run this ONE command (Copy-Paste Everything):

```bash
docker exec -i logifin-postgres psql -U postgres -d logifin << 'EOF'
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  industry VARCHAR(100),
  website VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  country VARCHAR(100) DEFAULT 'India',
  gst_number VARCHAR(20) UNIQUE,
  pan_number VARCHAR(20) UNIQUE,
  company_registration_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_gst ON companies(gst_number);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Add company_id column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Insert sample companies for testing
INSERT INTO companies (id, name, display_name, email, phone, address, gst_number, is_active, created_at)
VALUES
  ('company_rollingradius', 'Rolling Radius Logistics', 'Rolling Radius', 'contact@rollingradius.com', '9876543210', 'Mumbai, Maharashtra', '27AABCU9603R1ZX', TRUE, NOW()),
  ('company_abc_logistics', 'ABC Logistics Pvt Ltd', 'ABC Logistics', 'info@abclogistics.com', '9876543211', 'Delhi, NCR', '07AABCU9603R1ZY', TRUE, NOW()),
  ('company_xyz_transport', 'XYZ Transport Solutions', 'XYZ Transport', 'hello@xyztransport.com', '9876543212', 'Bangalore, Karnataka', '29AABCU9603R1ZZ', TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Show success message
SELECT 'SUCCESS: Companies table created!' as status;
SELECT COUNT(*) as total_companies FROM companies;
EOF
```

### Step 3: Verify it worked

```bash
# Check companies table exists
docker exec -it logifin-postgres psql -U postgres -d logifin -c "\dt companies"

# View companies
docker exec -it logifin-postgres psql -U postgres -d logifin -c "SELECT id, name, display_name FROM companies;"
```

You should see 3 sample companies listed.

---

## Alternative Method (If Docker Command Doesn't Work)

### Method 2: Direct psql

```bash
# Enter the PostgreSQL container
docker exec -it logifin-postgres psql -U postgres -d logifin

# Then paste this SQL (copy everything between the lines):
```

```sql
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  logo TEXT,
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

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);

INSERT INTO companies (id, name, display_name, email, phone, address, is_active)
VALUES
  ('company_rr', 'Rolling Radius', 'Rolling Radius', 'contact@rr.com', '9876543210', 'Mumbai', TRUE),
  ('company_abc', 'ABC Logistics', 'ABC Logistics', 'info@abc.com', '9876543211', 'Delhi', TRUE),
  ('company_xyz', 'XYZ Transport', 'XYZ Transport', 'hello@xyz.com', '9876543212', 'Bangalore', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Exit
\q
```

---

## Troubleshooting

### Can't find Docker container?

```bash
# Check running containers
docker ps

# Look for container with "postgres" in the name
# Use that name in the command above
```

### Wrong database name?

```bash
# List all databases
docker exec -it logifin-postgres psql -U postgres -c "\l"

# Use the correct database name you see
```

### Permission denied?

```bash
# Try with sudo
sudo docker exec -it logifin-postgres psql -U postgres -d logifin
```

---

## After Running the Command:

1. ✅ Companies table will be created
2. ✅ 3 sample companies will be added
3. ✅ You can now create new companies from the app
4. ✅ You can select from existing companies

Test it:
1. Go to https://tf.rollingradius.com
2. Select "Lender" or "Shipper" role
3. Choose "Company Lender/Shipper"
4. Try "Create New Company" - Should work now! ✅
