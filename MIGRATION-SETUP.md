# Automatic Database Migration Setup

## What's Been Done

Your Docker setup now automatically runs database migrations when you start the containers!

## Files Updated

1. **start-docker.sh** - Now includes automatic migration execution
2. **run-migrations-docker.sh** - Standalone migration script (optional)

## How It Works

When you run `./start-docker.sh`, it will:

1. ✅ Stop existing containers
2. ✅ Clean up Docker resources
3. ✅ Build and start PostgreSQL and Backend containers
4. ✅ Wait for PostgreSQL to be ready
5. ✅ **Automatically run migrations** (NEW!)
6. ✅ Show container status and logs

## What Migrations Are Applied

The following database changes are automatically applied:

### 1. Companies Table
- Creates `companies` table with all required fields
- Adds indexes for performance
- Inserts 3 sample companies (Rolling Radius, ABC Logistics, XYZ Transport)

### 2. User Table Updates
- Adds `user_type` column ('individual' or 'company')
- Adds `company_id` column to link users to companies
- Creates indexes for better query performance
- Sets default `user_type` based on existing data

## Usage

### Start Docker with Automatic Migrations

```bash
# On your VM
cd /path/to/truck-fin-hub
./start-docker.sh
```

That's it! Migrations run automatically.

### Run Migrations Manually (If Needed)

If you need to run migrations separately:

```bash
# Make script executable
chmod +x run-migrations-docker.sh

# Run migrations
./run-migrations-docker.sh
```

## First Time Setup on VM

### Step 1: Copy files to VM

On your **local machine** (Windows):

```bash
# Copy the updated start script
scp start-docker.sh user@34.93.247.3:~/truck-fin-hub/

# Optional: Copy standalone migration script
scp run-migrations-docker.sh user@34.93.247.3:~/truck-fin-hub/
```

### Step 2: SSH and run

```bash
# SSH into VM
ssh user@34.93.247.3

# Navigate to project
cd ~/truck-fin-hub

# Make script executable
chmod +x start-docker.sh

# Run it!
./start-docker.sh
```

## What You'll See

When running `./start-docker.sh`, you'll see:

```
🚀 Starting LogiFin Docker Deployment
====================================

🛑 Stopping existing containers...
🧹 Cleaning up Docker resources...

🔨 Building and starting services...
   - PostgreSQL Database
   - Backend API Server

⏳ Waiting for services to be healthy...

🔄 Running Database Migrations...
==================================
✅ PostgreSQL is ready!
   status
-----------------
 Migrations completed!
✅ Migrations completed!

📊 Container Status:
[Shows running containers]

✅ Deployment complete!

🌐 Services available at:
   - Backend API: http://localhost:4000/api
   - Health Check: http://localhost:4000/api/health
   - PostgreSQL: localhost:5432
```

## Verify Migrations Worked

After starting Docker, check that tables exist:

```bash
# Check companies table
docker exec -it logifin-postgres psql -U postgres -d logifin -c "SELECT COUNT(*) FROM companies;"

# Should show: count = 3 (sample companies)

# Check user_type column exists
docker exec -it logifin-postgres psql -U postgres -d logifin -c "\d users"

# Should show user_type and company_id columns
```

## Troubleshooting

### Migrations fail with "relation already exists"

This is normal! It means the table already exists. The migrations use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS` so they're safe to run multiple times.

### PostgreSQL not ready

If migrations fail because PostgreSQL isn't ready yet:

1. The script waits automatically, but you can increase the wait time
2. Edit `start-docker.sh` and change `sleep 5` to `sleep 10`

### Want to see what was created?

```bash
# View all tables
docker exec -it logifin-postgres psql -U postgres -d logifin -c "\dt"

# View companies
docker exec -it logifin-postgres psql -U postgres -d logifin -c "SELECT * FROM companies;"

# View users with new columns
docker exec -it logifin-postgres psql -U postgres -d logifin -c "SELECT id, name, user_type, company_id FROM users LIMIT 5;"
```

## Benefits

✅ **No manual migration needed** - Runs automatically on startup
✅ **Idempotent** - Safe to run multiple times (won't duplicate data)
✅ **Sample data included** - 3 companies ready for testing
✅ **Production ready** - Works on any environment

## Sample Companies Available

After migration, you can select from these companies:

1. **Rolling Radius** (ID: company_rr)
   - Email: contact@rr.com
   - Phone: 9876543210
   - Location: Mumbai, India

2. **ABC Logistics** (ID: company_abc)
   - Email: info@abc.com
   - Phone: 9876543211
   - Location: Delhi, India

3. **XYZ Transport** (ID: company_xyz)
   - Email: hello@xyz.com
   - Phone: 9876543212
   - Location: Bangalore, India

## Next Steps

1. ✅ Copy `start-docker.sh` to your VM
2. ✅ Run `./start-docker.sh`
3. ✅ Verify migrations completed
4. ✅ Test your app at https://tf.rollingradius.com
5. ✅ Try creating a new company - should work!

---

**Your database will now always have the correct schema when you start Docker!** 🎉
