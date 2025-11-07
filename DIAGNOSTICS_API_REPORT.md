# API "Failed to Fetch" Error - Diagnostic Report
## GET /api/user-theme-settings/u-1761203216642-gy3bkr7cw

Issue: Frontend receives "Failed to fetch" error when calling user-theme-settings API endpoint

## SUMMARY: THREE CRITICAL ISSUES FOUND

1. CRITICAL: Missing Database Table - user_theme_settings table DOES NOT exist
2. CRITICAL: No Database Migration - No migration file creates this table  
3. MAJOR: Backend/Frontend Integration Issue

---

## ISSUE #1: MISSING DATABASE TABLE (ROOT CAUSE)

### Problem
Backend code references table that doesn't exist in PostgreSQL database.

### Evidence

Backend Route Handler:
- File: server/routes/userThemeSettings.ts
- Route: GET /api/user-theme-settings/:userId
- Calls: getUserThemeSettings(userId)

Database Query Code:
- File: src/db/queries/userThemeSettings.ts
- Query: SELECT * FROM user_theme_settings WHERE user_id = $1

But Table Does NOT Exist:
- Main schema: src/db/schema.postgres.sql - NO user_theme_settings table
- Migrations: src/db/migrations/ - NO migration creates this table

### What Happens
GET /api/user-theme-settings/u-1761203216642-gy3bkr7cw
  -> Backend executes: SELECT * FROM user_theme_settings WHERE user_id = ...
  -> PostgreSQL Error: relation "user_theme_settings" does not exist
  -> 500 Error returned to frontend
  -> Browser shows "Failed to fetch"

---

## ISSUE #2: MISSING MIGRATION FILE

### Solution - Create Migration

File: src/db/migrations/028_create_user_theme_settings.sql

Content:
```sql
CREATE TABLE IF NOT EXISTS user_theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  mode VARCHAR(20) NOT NULL CHECK(mode IN ('light', 'dark', 'system')) DEFAULT 'light',
  primary_color VARCHAR(7) NOT NULL DEFAULT '#084570',
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#1D923C',
  accent_color VARCHAR(7) NOT NULL DEFAULT '#1D923C',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_theme_settings_user ON user_theme_settings(user_id);

CREATE TRIGGER update_user_theme_settings_updated_at BEFORE UPDATE ON user_theme_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Also update: src/db/schema.postgres.sql
Add table definition after notifications table before triggers section.

---

## ISSUE #3: API URL CONFIGURATION

### Configuration Status

Environment Variable: ✅
- File: .env
- Value: VITE_API_URL=https://34.93.247.3/api

API Client: ✅  
- File: src/api/client.ts
- Uses: API_BASE_URL from environment

Vite Proxy (Dev): ✅
- File: vite.config.ts  
- Proxies: /api -> https://34.93.247.3

### Frontend API Calls

Settings.tsx uses apiClient correctly:
- Line 223: apiClient.get(/user-theme-settings/${user.id})
- Line 310: apiClient.post(/user-theme-settings/${user.id}/reset)
- Line 333: apiClient.post(/user-theme-settings, {...})

This correctly routes through API_BASE_URL.

---

## BACKEND SERVER CONFIGURATION

### Routes: ✅ CORRECT

server/index.ts:
- Line 103: app.use('/api/user-theme-settings', userThemeSettingsRoutes)
- GET /api/user-theme-settings/:userId - Get settings
- POST /api/user-theme-settings - Create/upsert
- PUT /api/user-theme-settings/:userId - Update
- DELETE /api/user-theme-settings/:userId - Delete
- POST /api/user-theme-settings/:userId/reset - Reset

### CORS: ✅ CONFIGURED
- http://34.93.247.3 allowed
- https://34.93.247.3 allowed
- https://tf.rollingradius.com allowed

### Database: ✅ CONNECTION OK
- Initialized on server startup
- PostgreSQL pool configured
- Using config from environment variables

### Server Port: ✅
- Default: 4000
- From .env: PORT=3001

---

## QUICK FIX CHECKLIST

1. Create migration file: src/db/migrations/028_create_user_theme_settings.sql
2. Update schema: src/db/schema.postgres.sql (add table definition)
3. Run migration on database
4. Restart backend server
5. Test: Settings page should load without errors
6. Test: Saving theme should work
7. Deploy: Push to production
8. Deploy: Run migration on production database

---

## FILE LOCATIONS

Critical Files:
- API Client: src/api/client.ts (CORRECT)
- Frontend Usage: src/pages/Settings.tsx (CORRECT)
- Route Handler: server/routes/userThemeSettings.ts (CORRECT)
- Query Functions: src/db/queries/userThemeSettings.ts (CORRECT)
- Main Schema: src/db/schema.postgres.sql (MISSING TABLE)
- Migrations Folder: src/db/migrations/ (MISSING 028_*.sql)

---

## ROOT CAUSE

The user_theme_settings database table was never created.
- Code assumes it exists
- Query functions reference it
- But schema file doesn't define it
- And no migration creates it

When frontend calls the API, database throws "relation does not exist" error.

