# Database Migration Instructions - Settings Page Fix

## Problem
Your Settings page is showing errors because two database tables are missing:
- `user_theme_settings` - Stores user theme preferences
- `uploaded_contracts` - Stores uploaded contract documents

## Solution - Choose ONE method below:

---

## ✅ Method 1: Run PowerShell Script (Recommended for Windows)

**This is the easiest method if you have Docker Desktop installed**

1. Open PowerShell in the project directory
2. Run the migration script:
   ```powershell
   .\run-migrations.ps1
   ```
3. Restart your backend:
   ```powershell
   docker compose restart backend
   ```
4. Reload your Settings page - errors should be gone!

---

## ✅ Method 2: Run start-docker.sh (Git Bash/Linux/Mac)

**If you're using Git Bash or on Linux/Mac**

1. Open Git Bash or terminal
2. Run the Docker startup script:
   ```bash
   ./start-docker.sh
   ```
   This will:
   - Stop existing containers
   - Rebuild and start services
   - **Run ALL migrations including the new ones**
   - Show you the logs

3. Once complete, reload your Settings page

---

## ✅ Method 3: Manual SQL Execution

**If Docker is not available or you prefer manual control**

### Option A: Using Docker exec
```bash
docker exec -i logifin-postgres psql -U postgres -d logifin < manual-migrations.sql
```

### Option B: Using psql directly
```bash
psql -h localhost -p 5432 -U postgres -d logifin -f manual-migrations.sql
# Password: postgres123 (or your configured password)
```

### Option C: Copy-paste in pgAdmin or database client
1. Open `manual-migrations.sql`
2. Copy all SQL content
3. Run it in your PostgreSQL client (pgAdmin, DBeaver, etc.)

---

## Verify Migrations

After running migrations, verify the tables exist:

```bash
docker exec -it logifin-postgres psql -U postgres -d logifin -c "\dt user_theme_settings"
docker exec -it logifin-postgres psql -U postgres -d logifin -c "\dt uploaded_contracts"
```

You should see both tables listed.

---

## Restart Backend Server

After migrations, restart your backend:

```bash
# Using Docker Compose
docker compose restart backend

# Or stop and start
docker compose down
docker compose up -d backend
```

---

## Troubleshooting

### Error: "Docker command not found"
- Install Docker Desktop for Windows
- Make sure Docker Desktop is running

### Error: "logifin-postgres container not found"
- Start Docker containers: `docker compose up -d`

### Error: "relation already exists"
- This is OK! The migrations use `CREATE TABLE IF NOT EXISTS`

### API still fails in browser
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+F5)
3. Check browser console for new errors
4. Verify backend at `https://34.93.247.3/api/health`

---

## What Was Fixed

### Created Tables:

#### 1. `user_theme_settings`
- Per-user theme customization
- Fields: mode, primary_color, secondary_color, accent_color

#### 2. `uploaded_contracts`
- Uploaded contract documents
- Fields: file data, loan percentage, LTV, penalty, parties

### Updated Files:
- ✅ `start-docker.sh` - Added both migrations
- ✅ `src/db/migrations/028_create_user_theme_settings.sql`
- ✅ `src/db/migrations/029_create_uploaded_contracts.sql`
- ✅ `manual-migrations.sql` - Combined SQL
- ✅ `run-migrations.ps1` - PowerShell script

---

**After running migrations, your Settings page should load without errors!** ✨
