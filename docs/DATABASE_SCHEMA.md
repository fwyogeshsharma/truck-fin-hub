# Database Schema Documentation - Truck Finance Hub

## Overview
This document lists all tables in the Truck Finance Hub database schema. The schema has been migrated from SQLite to PostgreSQL while maintaining data structure and relationships.

## Database Configuration

### SQLite Configuration
- **Path**: `data/truck-fin-hub.db`
- **Configuration File**: `src/db/config.sqlite.ts`

### PostgreSQL Configuration
- **Host**: localhost
- **Port**: 5432
- **Database**: logifin
- **User**: postgres
- **Password**: admin
- **Configuration File**: `src/db/config.postgres.ts`

---

## Tables Overview

### 1. users
**Purpose**: Store user information for all user types in the system

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique user identifier
- `user_id` (VARCHAR/TEXT UNIQUE) - Human-readable user ID
- `email` (VARCHAR/TEXT UNIQUE) - User email address
- `phone` (VARCHAR/TEXT UNIQUE) - User phone number
- `name` (VARCHAR/TEXT) - User full name
- `password_hash` (TEXT) - Hashed password
- `role` (VARCHAR/TEXT) - User role: load_owner, vehicle_owner, lender, admin, super_admin, load_agent, vehicle_agent
- `company` (VARCHAR/TEXT) - Company name
- `company_logo` (TEXT) - Company logo path/URL
- `user_logo` (TEXT) - User profile picture path/URL
- `terms_accepted` (BOOLEAN/INTEGER) - Terms acceptance status
- `terms_accepted_at` (TIMESTAMP/TEXT) - Terms acceptance timestamp
- `is_active` (BOOLEAN/INTEGER) - Account active status
- `created_at` (TIMESTAMP/TEXT) - Account creation timestamp
- `updated_at` (TIMESTAMP/TEXT) - Last update timestamp

**Indexes**:
- idx_users_email
- idx_users_phone
- idx_users_user_id
- idx_users_role

---

### 2. trips
**Purpose**: Store trip/load information for financing

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique trip identifier
- `load_owner_id` (VARCHAR/TEXT) - Foreign key to users table
- `load_owner_name` (VARCHAR/TEXT) - Load owner name
- `load_owner_logo` (TEXT) - Load owner logo
- `load_owner_rating` (NUMERIC/REAL) - Rating (0-5)
- `client_company` (VARCHAR/TEXT) - Client company name
- `client_logo` (TEXT) - Client logo
- `transporter_id` (VARCHAR/TEXT) - Foreign key to users table
- `transporter_name` (VARCHAR/TEXT) - Transporter name
- `origin` (VARCHAR/TEXT) - Trip origin location
- `destination` (VARCHAR/TEXT) - Trip destination location
- `distance` (NUMERIC/REAL) - Trip distance
- `load_type` (VARCHAR/TEXT) - Type of load
- `weight` (NUMERIC/REAL) - Load weight
- `amount` (NUMERIC/REAL) - Trip amount (20,000 - 80,000)
- `interest_rate` (NUMERIC/REAL) - Interest rate
- `maturity_days` (INTEGER) - Days to maturity
- `risk_level` (VARCHAR/TEXT) - Risk level: low, medium, high
- `insurance_status` (BOOLEAN/INTEGER) - Insurance status
- `status` (VARCHAR/TEXT) - Trip status: pending, escrowed, funded, in_transit, completed, cancelled
- `lender_id` (VARCHAR/TEXT) - Foreign key to users table
- `lender_name` (VARCHAR/TEXT) - Lender name
- `created_at` (TIMESTAMP/TEXT) - Creation timestamp
- `funded_at` (TIMESTAMP/TEXT) - Funding timestamp
- `completed_at` (TIMESTAMP/TEXT) - Completion timestamp

**Indexes**:
- idx_trips_status
- idx_trips_load_owner
- idx_trips_lender
- idx_trips_created_at

---

### 3. trip_bids
**Purpose**: Store bid information from lenders for trips

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique bid identifier
- `trip_id` (VARCHAR/TEXT) - Foreign key to trips table
- `lender_id` (VARCHAR/TEXT) - Foreign key to users table
- `lender_name` (VARCHAR/TEXT) - Lender name
- `amount` (NUMERIC/REAL) - Bid amount
- `interest_rate` (NUMERIC/REAL) - Proposed interest rate
- `created_at` (TIMESTAMP/TEXT) - Bid creation timestamp

**Indexes**:
- idx_trip_bids_trip
- idx_trip_bids_lender

---

### 4. trip_documents
**Purpose**: Store documents related to trips

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique document identifier
- `trip_id` (VARCHAR/TEXT) - Foreign key to trips table
- `document_type` (VARCHAR/TEXT) - Document type: bilty, ewaybill, invoice
- `document_data` (TEXT) - Document data/path
- `uploaded_at` (TIMESTAMP/TEXT) - Upload timestamp
- `uploaded_by` (VARCHAR/TEXT) - Foreign key to users table

**Indexes**:
- idx_trip_documents_trip
- idx_trip_documents_type (UNIQUE on trip_id + document_type)

---

### 5. investments
**Purpose**: Track investment details for funded trips

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique investment identifier
- `lender_id` (VARCHAR/TEXT) - Foreign key to users table
- `trip_id` (VARCHAR/TEXT) - Foreign key to trips table
- `amount` (NUMERIC/REAL) - Investment amount
- `interest_rate` (NUMERIC/REAL) - Interest rate
- `expected_return` (NUMERIC/REAL) - Expected return amount
- `status` (VARCHAR/TEXT) - Status: escrowed, active, completed, defaulted
- `invested_at` (TIMESTAMP/TEXT) - Investment timestamp
- `maturity_date` (TIMESTAMP/TEXT) - Maturity date
- `completed_at` (TIMESTAMP/TEXT) - Completion timestamp

**Indexes**:
- idx_investments_lender
- idx_investments_trip
- idx_investments_status

---

### 6. transactions
**Purpose**: Track all financial transactions for users

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique transaction identifier
- `user_id` (VARCHAR/TEXT) - Foreign key to users table
- `type` (VARCHAR/TEXT) - Transaction type: credit, debit
- `amount` (NUMERIC/REAL) - Transaction amount
- `category` (VARCHAR/TEXT) - Category: investment, return, payment, refund, fee, withdrawal
- `description` (TEXT) - Transaction description
- `balance_after` (NUMERIC/REAL) - Balance after transaction
- `timestamp` (TIMESTAMP/TEXT) - Transaction timestamp

**Indexes**:
- idx_transactions_user
- idx_transactions_timestamp (DESC)
- idx_transactions_type

---

### 7. wallets
**Purpose**: Store wallet balance information for users

**Columns**:
- `user_id` (VARCHAR/TEXT PRIMARY KEY) - Foreign key to users table
- `balance` (NUMERIC/REAL) - Available balance
- `locked_amount` (NUMERIC/REAL) - Locked amount
- `escrowed_amount` (NUMERIC/REAL) - Escrowed amount
- `total_invested` (NUMERIC/REAL) - Total invested amount
- `total_returns` (NUMERIC/REAL) - Total returns received
- `updated_at` (TIMESTAMP/TEXT) - Last update timestamp

---

### 8. bank_accounts
**Purpose**: Store bank account details for users

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique bank account identifier
- `user_id` (VARCHAR/TEXT) - Foreign key to users table
- `account_holder_name` (VARCHAR/TEXT) - Account holder name
- `account_number` (VARCHAR/TEXT) - Bank account number
- `ifsc_code` (VARCHAR/TEXT) - IFSC code
- `bank_name` (VARCHAR/TEXT) - Bank name
- `account_type` (VARCHAR/TEXT) - Account type: savings, current
- `is_verified` (BOOLEAN/INTEGER) - Verification status
- `is_primary` (BOOLEAN/INTEGER) - Primary account flag
- `created_at` (TIMESTAMP/TEXT) - Creation timestamp

**Indexes**:
- idx_bank_accounts_user
- idx_bank_accounts_primary

---

### 9. user_kyc
**Purpose**: Store KYC (Know Your Customer) information for users

**Columns**:

**Personal Information**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique KYC record identifier
- `user_id` (VARCHAR/TEXT UNIQUE) - Foreign key to users table
- `pan_number` (VARCHAR/TEXT UNIQUE) - PAN card number
- `pan_document` (TEXT) - PAN document path/data
- `aadhar_number` (VARCHAR/TEXT UNIQUE) - Aadhar number
- `aadhar_document` (TEXT) - Aadhar document path/data

**Address Proof**:
- `address_line1` (VARCHAR/TEXT) - Address line 1
- `address_line2` (VARCHAR/TEXT) - Address line 2
- `city` (VARCHAR/TEXT) - City
- `state` (VARCHAR/TEXT) - State
- `pincode` (VARCHAR/TEXT) - Postal code
- `address_proof_type` (VARCHAR/TEXT) - Type: aadhar, passport, voter_id, driving_license, utility_bill
- `address_proof_document` (TEXT) - Address proof document path/data

**Business/Company Documents**:
- `gst_number` (VARCHAR/TEXT UNIQUE) - GST number
- `gst_certificate` (TEXT) - GST certificate path/data
- `company_registration_number` (VARCHAR/TEXT) - Company registration number
- `company_registration_document` (TEXT) - Company registration document path/data

**Vehicle Documents**:
- `vehicle_registration_number` (VARCHAR/TEXT) - Vehicle registration number
- `vehicle_registration_document` (TEXT) - Vehicle registration document
- `vehicle_insurance_document` (TEXT) - Vehicle insurance document
- `vehicle_fitness_certificate` (TEXT) - Vehicle fitness certificate

**Verification Status**:
- `kyc_status` (VARCHAR/TEXT) - Status: pending, under_review, approved, rejected
- `verified_by` (VARCHAR/TEXT) - Foreign key to users table (admin who verified)
- `verified_at` (TIMESTAMP/TEXT) - Verification timestamp
- `rejection_reason` (TEXT) - Reason if rejected

**Timestamps**:
- `submitted_at` (TIMESTAMP/TEXT) - Submission timestamp
- `created_at` (TIMESTAMP/TEXT) - Creation timestamp
- `updated_at` (TIMESTAMP/TEXT) - Last update timestamp

**Indexes**:
- idx_user_kyc_user
- idx_user_kyc_status
- idx_user_kyc_pan
- idx_user_kyc_aadhar
- idx_user_kyc_gst

---

### 10. notifications
**Purpose**: Store user notifications

**Columns**:
- `id` (VARCHAR/TEXT PRIMARY KEY) - Unique notification identifier
- `user_id` (VARCHAR/TEXT) - Foreign key to users table
- `type` (VARCHAR/TEXT) - Notification type
- `title` (VARCHAR/TEXT) - Notification title
- `message` (TEXT) - Notification message
- `priority` (VARCHAR/TEXT) - Priority: low, medium, high, urgent
- `read` (BOOLEAN/INTEGER) - Read status
- `action_url` (TEXT) - Action URL if applicable
- `metadata` (JSONB/TEXT) - Additional metadata (JSONB in PostgreSQL, TEXT in SQLite)
- `created_at` (TIMESTAMP/TEXT) - Creation timestamp
- `read_at` (TIMESTAMP/TEXT) - Read timestamp

**Indexes**:
- idx_notifications_user
- idx_notifications_read
- idx_notifications_created

---

## Additional PostgreSQL Features

### Triggers
PostgreSQL schema includes automatic `updated_at` timestamp triggers for:
- users table
- wallets table
- user_kyc table

### Data Type Differences

| SQLite | PostgreSQL | Notes |
|--------|-----------|-------|
| TEXT | VARCHAR(n) | Variable length strings with size limits |
| REAL | NUMERIC(p,s) | Precise decimal numbers |
| INTEGER | INTEGER/BOOLEAN | Boolean for 0/1 flags |
| TEXT (for dates) | TIMESTAMP | Native timestamp support |
| TEXT (for JSON) | JSONB | Native JSON support with indexing |

---

## Schema Files

1. **SQLite Schema**: `src/db/schema.sql`
2. **PostgreSQL Schema**: `src/db/schema.postgres.sql`
3. **SQLite Config**: `src/db/config.sqlite.ts`
4. **PostgreSQL Config**: `src/db/config.postgres.ts`

---

## Total Tables: 10

1. users
2. trips
3. trip_bids
4. trip_documents
5. investments
6. transactions
7. wallets
8. bank_accounts
9. user_kyc
10. notifications
