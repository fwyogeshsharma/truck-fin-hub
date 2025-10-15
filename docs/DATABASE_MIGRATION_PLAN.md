# Database Migration Plan: LocalStorage to SQLite

## Overview
This document outlines the plan to migrate the Truck Finance Hub application from localStorage-based data storage to a proper SQLite database. This migration will enable the application to handle real-world scenarios with proper data persistence, relationships, and scalability.

---

## Current State Analysis

### Existing Data Structures (from `src/lib/data.ts` and `src/lib/auth.ts`)

#### 1. **Users** (from auth.ts)
- id (string)
- userId (string) - Unique user identifier
- email (string)
- phone (string)
- name (string)
- role (enum: load_owner, vehicle_owner, lender, admin, super_admin, load_agent, vehicle_agent)
- company (string, optional)
- companyLogo (string, optional)
- userLogo (string, optional)

#### 2. **Trips** (from data.ts)
- id (string)
- loadOwnerId (string)
- loadOwnerName (string)
- loadOwnerLogo (string, optional)
- loadOwnerRating (number, optional)
- clientCompany (string, optional)
- clientLogo (string, optional)
- transporterId (string, optional)
- transporterName (string, optional)
- origin (string)
- destination (string)
- distance (number)
- loadType (string)
- weight (number)
- amount (number) - Trip value (20K-80K)
- interestRate (number, optional)
- maturityDays (number, optional)
- riskLevel (enum: low, medium, high, optional)
- insuranceStatus (boolean, optional)
- status (enum: pending, escrowed, funded, in_transit, completed, cancelled)
- createdAt (datetime)
- fundedAt (datetime, optional)
- completedAt (datetime, optional)
- lenderId (string, optional)
- lenderName (string, optional)
- **bids** (array of objects - needs separate table)
- **documents** (object with bilty, ewaybill, invoice - needs separate table)

#### 3. **Investments**
- id (string)
- lenderId (string)
- tripId (string)
- amount (number)
- interestRate (number)
- expectedReturn (number)
- status (enum: escrowed, active, completed, defaulted)
- investedAt (datetime)
- maturityDate (datetime)

#### 4. **Transactions**
- id (string)
- userId (string)
- type (enum: credit, debit)
- amount (number)
- category (enum: investment, return, payment, refund, fee, withdrawal)
- description (string)
- timestamp (datetime)
- balanceAfter (number)

#### 5. **Wallets**
- userId (string) - PRIMARY KEY
- balance (number)
- lockedAmount (number)
- escrowedAmount (number)
- totalInvested (number)
- totalReturns (number)

#### 6. **Bank Accounts**
- id (string)
- userId (string)
- accountHolderName (string)
- accountNumber (string)
- ifscCode (string)
- bankName (string)
- accountType (enum: savings, current)
- isVerified (boolean)
- isPrimary (boolean)
- createdAt (datetime)

---

## Proposed Database Schema

### Table 1: `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,  -- Unique user identifier (e.g., USR001, USR002)
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,  -- Password hashing with bcrypt
  role TEXT CHECK(role IN ('load_owner', 'vehicle_owner', 'lender', 'admin', 'super_admin', 'load_agent', 'vehicle_agent')),
  company TEXT,
  company_logo TEXT,
  user_logo TEXT,  -- User's profile picture/logo
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_role ON users(role);
```

### Table 2: `trips`
```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  load_owner_id TEXT NOT NULL,
  load_owner_name TEXT NOT NULL,
  load_owner_logo TEXT,
  load_owner_rating REAL CHECK(load_owner_rating >= 0 AND load_owner_rating <= 5),
  client_company TEXT,
  client_logo TEXT,
  transporter_id TEXT,
  transporter_name TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance INTEGER NOT NULL,
  load_type TEXT NOT NULL,
  weight INTEGER NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 20000 AND amount <= 80000),
  interest_rate REAL,
  maturity_days INTEGER,
  risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
  insurance_status BOOLEAN DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'escrowed', 'funded', 'in_transit', 'completed', 'cancelled')) DEFAULT 'pending',
  lender_id TEXT,
  lender_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  funded_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (load_owner_id) REFERENCES users(id),
  FOREIGN KEY (transporter_id) REFERENCES users(id),
  FOREIGN KEY (lender_id) REFERENCES users(id)
);

CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_load_owner ON trips(load_owner_id);
CREATE INDEX idx_trips_lender ON trips(lender_id);
CREATE INDEX idx_trips_created_at ON trips(created_at);
```

### Table 3: `trip_bids`
```sql
CREATE TABLE trip_bids (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  lender_id TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(id)
);

CREATE INDEX idx_trip_bids_trip ON trip_bids(trip_id);
CREATE INDEX idx_trip_bids_lender ON trip_bids(lender_id);
```

### Table 4: `trip_documents`
```sql
CREATE TABLE trip_documents (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('bilty', 'ewaybill', 'invoice')),
  document_data TEXT NOT NULL,  -- Base64 or file path
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_trip_documents_trip ON trip_documents(trip_id);
CREATE UNIQUE INDEX idx_trip_documents_type ON trip_documents(trip_id, document_type);
```

### Table 5: `investments`
```sql
CREATE TABLE investments (
  id TEXT PRIMARY KEY,
  lender_id TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  expected_return REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('escrowed', 'active', 'completed', 'defaulted')) DEFAULT 'escrowed',
  invested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  maturity_date DATETIME NOT NULL,
  completed_at DATETIME,
  FOREIGN KEY (lender_id) REFERENCES users(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE INDEX idx_investments_lender ON investments(lender_id);
CREATE INDEX idx_investments_trip ON investments(trip_id);
CREATE INDEX idx_investments_status ON investments(status);
```

### Table 6: `transactions`
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('credit', 'debit')),
  amount REAL NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('investment', 'return', 'payment', 'refund', 'fee', 'withdrawal')),
  description TEXT NOT NULL,
  balance_after REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### Table 7: `wallets`
```sql
CREATE TABLE wallets (
  user_id TEXT PRIMARY KEY,
  balance REAL NOT NULL DEFAULT 0 CHECK(balance >= 0),
  locked_amount REAL NOT NULL DEFAULT 0 CHECK(locked_amount >= 0),
  escrowed_amount REAL NOT NULL DEFAULT 0 CHECK(escrowed_amount >= 0),
  total_invested REAL NOT NULL DEFAULT 0 CHECK(total_invested >= 0),
  total_returns REAL NOT NULL DEFAULT 0 CHECK(total_returns >= 0),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table 8: `bank_accounts`
```sql
CREATE TABLE bank_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('savings', 'current')),
  is_verified BOOLEAN DEFAULT 0,
  is_primary BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_primary ON bank_accounts(user_id, is_primary);
```

### Table 9: `user_kyc`
```sql
CREATE TABLE user_kyc (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,

  -- Personal Information
  pan_number TEXT UNIQUE,
  pan_document TEXT,  -- Base64 or file path
  aadhar_number TEXT UNIQUE,
  aadhar_document TEXT,  -- Base64 or file path

  -- Address Proof
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  address_proof_type TEXT CHECK(address_proof_type IN ('aadhar', 'passport', 'voter_id', 'driving_license', 'utility_bill')),
  address_proof_document TEXT,  -- Base64 or file path

  -- Business/Company Documents (for load_owner, vehicle_owner)
  gst_number TEXT UNIQUE,
  gst_certificate TEXT,  -- Base64 or file path
  company_registration_number TEXT,
  company_registration_document TEXT,  -- Base64 or file path

  -- Vehicle Documents (for vehicle_owner)
  vehicle_registration_number TEXT,
  vehicle_registration_document TEXT,  -- Base64 or file path
  vehicle_insurance_document TEXT,  -- Base64 or file path
  vehicle_fitness_certificate TEXT,  -- Base64 or file path

  -- Verification Status
  kyc_status TEXT NOT NULL CHECK(kyc_status IN ('pending', 'under_review', 'approved', 'rejected')) DEFAULT 'pending',
  verified_by TEXT,  -- Admin user ID who verified
  verified_at DATETIME,
  rejection_reason TEXT,

  -- Timestamps
  submitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE INDEX idx_user_kyc_user ON user_kyc(user_id);
CREATE INDEX idx_user_kyc_status ON user_kyc(kyc_status);
CREATE INDEX idx_user_kyc_pan ON user_kyc(pan_number);
CREATE INDEX idx_user_kyc_aadhar ON user_kyc(aadhar_number);
CREATE INDEX idx_user_kyc_gst ON user_kyc(gst_number);
```

---

## Migration Strategy

### Phase 1: Database Setup
1. **Install SQLite Package**
   ```bash
   npm install better-sqlite3
   npm install -D @types/better-sqlite3
   ```

2. **Create Database Directory Structure**
   ```
   src/
   ├── db/
   │   ├── schema.sql          # All CREATE TABLE statements
   │   ├── seeds.sql           # Initial mock data
   │   ├── database.ts         # Database connection & initialization
   │   ├── migrations/         # Future schema changes
   │   └── queries/            # SQL query functions
   │       ├── users.ts
   │       ├── userKyc.ts
   │       ├── trips.ts
   │       ├── investments.ts
   │       ├── transactions.ts
   │       ├── wallets.ts
   │       └── bankAccounts.ts
   ```

3. **Create Database File Location**
   - Development: `./data/truck-fin-hub.db`
   - Add to `.gitignore`

### Phase 2: Database Layer Implementation
1. **Create database connection manager** (`src/db/database.ts`)
   - Initialize database
   - Run schema creation
   - Handle connections
   - Error handling

2. **Implement query functions** for each table
   - CRUD operations
   - Transactions support
   - Prepared statements for security

3. **Create data migration utility**
   - Read existing localStorage data
   - Transform to proper format
   - Insert into database
   - Validation

### Phase 3: API Layer Refactoring
1. **Update `src/lib/data.ts`**
   - Replace localStorage calls with database queries
   - Maintain same interface for backward compatibility
   - Add proper error handling

2. **Update `src/lib/auth.ts`**
   - Replace localStorage with database
   - Add password hashing (bcrypt)
   - Implement session management

### Phase 4: Testing & Migration
1. **Create migration script**
   - Export current localStorage data
   - Import into SQLite
   - Verify data integrity
   - Insert default super admin user

2. **Testing**
   - Unit tests for database queries
   - Integration tests for data layer
   - End-to-end tests for UI flows

3. **Rollback plan**
   - Keep localStorage as fallback
   - Feature flag to switch between storage methods

---

## Data Relationships

```
users (1) ────── (many) trips [as load_owner]
users (1) ────── (many) trips [as lender]
users (1) ────── (many) investments
users (1) ────── (1) wallet
users (1) ────── (many) bank_accounts
users (1) ────── (many) transactions
users (1) ────── (1) user_kyc

trips (1) ────── (many) trip_bids
trips (1) ────── (many) trip_documents
trips (1) ────── (many) investments

investments (many) ────── (1) trips
investments (many) ────── (1) users [lender]

user_kyc (1) ────── (1) users
user_kyc (many) ────── (1) users [verified_by - admin]
```

---

## Security Considerations

1. **SQL Injection Prevention**
   - Use parameterized queries (prepared statements)
   - Never concatenate user input into SQL

2. **Password Security**
   - Hash passwords with bcrypt (salt rounds: 10)
   - Never store plain text passwords

3. **Access Control**
   - Validate user permissions before queries
   - Row-level security for data access

4. **Data Validation**
   - Check constraints in database
   - Application-level validation
   - Type safety with TypeScript

---

## Performance Optimization

1. **Indexes**
   - Add indexes on frequently queried columns
   - Foreign key indexes
   - Composite indexes where needed

2. **Query Optimization**
   - Use JOINs efficiently
   - Limit result sets
   - Pagination for large datasets

3. **Connection Management**
   - Connection pooling (if needed)
   - Proper cleanup on shutdown

---

## Breaking Changes & Compatibility

### Changes Required in Codebase:
1. **Async Operations**
   - Database queries are async
   - Update all data access code to use `async/await`
   - Update React components to handle promises

2. **ID Generation**
   - Change from `Date.now().toString()` to UUID or auto-increment
   - May need to update existing ID references

3. **Data Types**
   - Boolean values: Change from `true/false` to `1/0` in SQLite
   - Dates: Store as ISO strings or Unix timestamps

4. **Array/Object Storage**
   - Trip bids: Move to separate table
   - Documents: Move to separate table
   - Update data access patterns

---

## Timeline Estimate

- **Phase 1 (Setup)**: 1-2 hours
- **Phase 2 (Implementation)**: 4-6 hours
- **Phase 3 (Refactoring)**: 3-4 hours
- **Phase 4 (Testing & Migration)**: 2-3 hours

**Total Estimated Time**: 10-15 hours

---

## Rollout Plan

1. **Development**: Implement and test locally
2. **Staging**: Deploy with feature flag (localStorage fallback)
3. **Production**:
   - Run migration script for existing users
   - Monitor for issues
   - Gradual rollout (10% → 50% → 100%)

---

## Benefits After Migration

1. **Data Integrity**: Foreign keys, constraints, transactions
2. **Performance**: Indexed queries, efficient JOINs
3. **Scalability**: Can handle thousands of records
4. **Reliability**: ACID compliance, backup/restore
5. **Query Power**: Complex queries, aggregations, reporting
6. **Multi-user Support**: Concurrent access with locking
7. **Future Ready**: Easy to migrate to PostgreSQL/MySQL later

---

## Additional Features with KYC System

### KYC Verification Workflow

1. **User Registration**
   - User signs up → Basic account created
   - Status: KYC Pending

2. **KYC Submission**
   - User uploads documents (PAN, Aadhar, Address proof)
   - Business users: GST, Company registration
   - Vehicle owners: Vehicle documents
   - Status: Under Review

3. **Admin Verification**
   - Super Admin/Admin reviews documents
   - Approves or Rejects with reason
   - Status: Approved/Rejected

4. **Access Control**
   - Non-KYC users: Limited access (view only)
   - KYC approved: Full access to invest/create trips
   - Rejected: Can resubmit with corrections

### KYC Document Types by Role

| Role | Required Documents |
|------|-------------------|
| **Lender** | PAN, Aadhar, Address Proof, Bank Account |
| **Load Owner** | PAN, Aadhar, GST, Company Registration |
| **Vehicle Owner** | PAN, Aadhar, Vehicle RC, Insurance, Fitness Certificate |
| **Load Agent** | PAN, Aadhar, Company documents |
| **Vehicle Agent** | PAN, Aadhar, Authorization letter |

---

## Default Super Admin User

### Initial Super Admin Account
For system initialization and management, a default super admin account will be created:

```sql
-- Default Super Admin (Password: Alok12345 - will be hashed with bcrypt)
INSERT INTO users (
  id,
  user_id,
  email,
  phone,
  name,
  password_hash,
  role,
  is_active,
  created_at
) VALUES (
  'sa-001',
  'SA001',
  'Alok@faberwork.com',
  '9999999999',  -- Placeholder, should be updated
  'Alok',
  '$2b$10$[bcrypt_hash_of_Alok12345]',  -- Will be generated during setup
  'super_admin',
  1,
  CURRENT_TIMESTAMP
);
```

**Super Admin Credentials:**
- **Email**: `Alok@faberwork.com`
- **Username**: `Alok`
- **Password**: `Alok12345` (will be hashed)
- **Role**: `super_admin`
- **User ID**: `SA001`

**Super Admin Capabilities:**
- Full access to all system features
- User management (create, update, delete, role assignment)
- KYC verification and approval
- System configuration
- Access to all dashboards and reports
- Can create additional admin users

> **Security Note**: The super admin password should be changed immediately after first login in production environment.

---

## Summary of Changes (v1.1)

### ✅ Updates Applied:
1. **Added `user_id` column** - Unique identifier for users (USR001, USR002, etc.)
2. **Added `phone` column** - Phone number with unique constraint
3. **Added `user_logo` column** - User's profile picture
4. **Updated role enum**:
   - ❌ Removed: `transporter`
   - ✅ Added: `vehicle_owner`, `super_admin`
5. **Added `user_kyc` table** - Complete KYC document management system
   - Personal documents (PAN, Aadhar)
   - Address verification
   - Business documents (GST, Company registration)
   - Vehicle documents (RC, Insurance, Fitness)
   - Verification workflow (pending → under_review → approved/rejected)
6. **Added default super admin user**:
   - Email: Alok@faberwork.com
   - Username: Alok
   - Password: Alok12345 (bcrypt hashed)
   - User ID: SA001

### Total Tables: **9 tables**
1. users
2. trips
3. trip_bids
4. trip_documents
5. investments
6. transactions
7. wallets
8. bank_accounts
9. **user_kyc** (NEW)

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Get approval to proceed
3. ⏳ Install dependencies
4. ⏳ Create database schema
5. ⏳ Implement database layer
6. ⏳ Refactor data access code
7. ⏳ Test and migrate data
8. ⏳ Deploy

---

**Document Version**: 1.2
**Created**: 2025-10-03
**Last Updated**: 2025-10-03
**Author**: Claude (AI Assistant)
**Changelog**:
- v1.2: Added default super admin user (Alok@faberwork.com)
- v1.1: Added phone, user_id, user_logo, updated roles, added user_kyc table
- v1.0: Initial plan
