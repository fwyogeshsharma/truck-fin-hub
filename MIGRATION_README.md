# Database Migration Guide

## Overview

This project uses automated migration scripts to keep your database schema synchronized between local and production environments.

## Migration Files Location

All migration files are stored in: `src/db/migrations/`

Current migrations:
- `001_initial_schema.sql` - Base schema
- `004_create_companies_table.sql` - Companies table
- `005_migrate_companies_from_users.sql` - Company data migration
- `006_add_is_admin_to_users.sql` - Add is_admin column
- `007_create_transaction_requests_table.sql` - Transaction requests
- `008_fix_transaction_requests_processed_by.sql` - Fix transaction requests
- `009_add_user_type_to_users.sql` - Add user_type column
- `010_sync_table_structures.sql` - **Comprehensive sync migration** (NEW!)
- `add_terms_columns.sql` - Terms acceptance columns

## Migration Scripts

### 1. `run-migrations-docker.sh` (Recommended for Production)

**Purpose:** Runs all migrations in Docker containers
**Best for:** Production deployments, CI/CD pipelines

**Usage:**
```bash
cd /d/Projects/truck-fin-hub
bash run-migrations-docker.sh
```

**What it does:**
- ✅ Checks if Docker is running
- ✅ Starts PostgreSQL container if not running
- ✅ Waits for database to be ready
- ✅ Runs ALL migration files in `src/db/migrations/` in alphabetical order
- ✅ Shows success/warning count for each migration
- ✅ Verifies critical columns exist (is_admin, user_type, company_id)
- ✅ Displays table counts and database status

### 2. `run-migrations.sh` (Alternative)

**Purpose:** Same as above, alternative script
**Best for:** Local development

**Usage:**
```bash
cd /d/Projects/truck-fin-hub
bash run-migrations.sh
```

## The Comprehensive Sync Migration

**File:** `010_sync_table_structures.sql`

This is the **most important** migration that:

✅ Adds ALL missing columns to users table:
   - `is_admin` - Admin privileges flag
   - `user_type` - Individual or company
   - `company_id` - Company reference
   - `terms_accepted` - Terms acceptance
   - `approval_status` - User approval status
   - `is_active` - Active status

✅ Ensures companies table exists without `industry` column

✅ Creates transaction_requests, wallets, transactions, notifications tables

✅ Sets up all necessary indexes for performance

✅ Creates triggers for automatic `updated_at` timestamps

✅ Updates existing data appropriately

**This migration is SAFE to run multiple times** because it uses `IF NOT EXISTS` for all operations.

## How Migrations Work

1. **Automatic Discovery:** Scripts automatically find all `.sql` files in `src/db/migrations/`

2. **Sorted Execution:** Files are executed in alphabetical order (001, 002, 003, etc.)

3. **Error Handling:** If a migration fails (e.g., already applied), script continues with warnings

4. **Verification:** After all migrations, scripts verify critical columns exist

## Adding New Migrations

To add a new migration:

1. Create a new file in `src/db/migrations/` with format: `XXX_description.sql`
   - Use sequential numbers: 011, 012, 013, etc.
   - Use descriptive names

2. Write your SQL migration:
   ```sql
   -- Always use IF NOT EXISTS to make migrations idempotent
   ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_users_new_column ON users(new_column);

   -- Update existing data if needed
   UPDATE users SET new_column = 'default' WHERE new_column IS NULL;
   ```

3. Run the migration script:
   ```bash
   bash run-migrations-docker.sh
   ```

## Troubleshooting

### Docker not running
```
❌ Error: PostgreSQL container 'logifin-postgres' is not running
```
**Solution:** Start Docker Desktop and run the script again. The script will auto-start containers.

### Migration already applied
```
⚠️ Warning: Migration may have already been applied or encountered an error
```
**This is normal!** Migrations are idempotent and can be run multiple times safely.

### Column already exists
If you see errors about columns already existing, this is normal when re-running migrations. The migration will skip those operations.

## Best Practices

1. **Always backup production data** before running migrations in production

2. **Test migrations locally first** using `bash run-migrations-docker.sh`

3. **Use IF NOT EXISTS** in all SQL statements to make migrations idempotent

4. **Never delete old migration files** - they serve as version history

5. **Run migrations before deploying new code** that depends on schema changes

## Docker Commands

### Check if containers are running:
```bash
docker ps
```

### View PostgreSQL logs:
```bash
docker logs logifin-postgres
```

### Access PostgreSQL shell manually:
```bash
docker exec -it logifin-postgres psql -U postgres -d logifin
```

### Check table structure:
```bash
docker exec -it logifin-postgres psql -U postgres -d logifin -c "\d users"
```

## Migration Status

After running migrations, you should see:

```
✅ is_admin column found in users table
✅ user_type column found in users table
✅ company_id column found in users table
```

If any of these show ⚠️, the migration didn't complete successfully.

## Support

If migrations fail:

1. Check Docker is running: `docker ps`
2. Check PostgreSQL logs: `docker logs logifin-postgres`
3. Try running migrations again (they're safe to re-run)
4. Check the specific migration file for SQL errors
