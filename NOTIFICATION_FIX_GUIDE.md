# Notification System Fix Guide

## Problem Summary

The notification system was not working for users. After investigation, I found several issues:

### Issues Found:

1. **Incorrect Database Access**: The notification queries were using `await getDatabase()` when `getDatabase()` returns a `Pool` object directly (not a Promise).

2. **No Error Logging**: There was no debug logging to help diagnose notification creation/fetching issues.

3. **Two Notification Systems**: There are two notification systems in the codebase:
   - **Client-side (localStorage)**: `src/services/notificationService.ts` - stores notifications in browser localStorage (not used by NotificationBell)
   - **Server-side (PostgreSQL)**: `src/db/queries/notifications.ts` + `server/routes/notifications.ts` - stores in database (used by NotificationBell)

   The NotificationBell component correctly uses the server-side API, so the localStorage system is redundant and should be ignored.

## Changes Made

### 1. Fixed `src/db/queries/notifications.ts`

**Changes:**
- Removed incorrect `await` on all `getDatabase()` calls
- Added comprehensive debug logging:
  - `🔔 [NOTIFICATION] Creating notification` - when creating
  - `✅ [NOTIFICATION] Notification created successfully` - on success
  - `❌ [NOTIFICATION] Error creating notification` - on error
  - `🔔 [NOTIFICATION] Fetching notifications for user` - when fetching
  - `✅ [NOTIFICATION] Found X notifications` - fetch results
  - `🔔 [NOTIFICATION] Unread count for user` - count queries
- Added try-catch block in `createNotification()` with error logging

### 2. Previous Fixes (already in codebase)

- Notification API endpoints are correctly registered: `app.use('/api/notifications', notificationRoutes)` in `server/index.ts`
- NotificationBell component correctly fetches from API
- Server-side code correctly calls `createNotification()` when creating trips, bids, etc.

## Deployment Steps

### On Production Server (GCP Instance 34.93.247.3)

1. **Pull the latest changes:**
   ```bash
   cd /home/fabercomp_gmail_com/truck-fin-hub
   git fetch origin
   git checkout origin/main -- server/routes/ratings.ts
   git pull origin main
   ```

2. **Restart the backend service:**
   ```bash
   docker-compose restart backend
   ```

3. **Monitor the logs:**
   ```bash
   docker-compose logs -f backend | grep NOTIFICATION
   ```

   You should see logs like:
   ```
   🔔 [NOTIFICATION] Creating notification: { id: '...', userId: '...', type: '...', title: '...' }
   ✅ [NOTIFICATION] Notification created successfully: notif_...
   🔔 [NOTIFICATION] Fetching notifications for user: u-...
   ✅ [NOTIFICATION] Found 5 notifications for user: u-...
   ```

## Testing Notifications

### Option 1: Using the Test Script (On Server)

If you have Node.js on the production server:

```bash
node test-notifications.js
```

This will:
1. Check if notifications table exists
2. Show table structure
3. Count existing notifications
4. List users
5. Create a test notification
6. Verify it was created

### Option 2: Using curl (Anywhere)

```bash
# Replace USER_ID with an actual user ID from your database
USER_ID="u-1761119793298-3svk2q1x9"

# Fetch notifications
curl https://34.93.247.3/api/notifications/${USER_ID}

# Get unread count
curl https://34.93.247.3/api/notifications/${USER_ID}/unread-count
```

### Option 3: Browser DevTools

1. Open the application in browser
2. Open DevTools Console (F12)
3. Look for notification-related logs
4. Check Network tab for API calls to `/api/notifications/*`

## How Notifications Are Created

Notifications are automatically created in several scenarios:

### 1. Investment Opportunities (Trip Created)
**File**: `server/routes/trips.ts` and `server/routes/publicApi.ts`
**When**: A new trip is created
**Who gets notified**: All lenders
**Type**: `investment_opportunity`

```typescript
await createNotification({
  userId: lender.id,
  type: 'investment_opportunity',
  title: 'New Investment Opportunity',
  message: `A new ${trip.load_type} trip from ${trip.origin} to ${trip.destination} is now available`,
  priority: 'high',
  actionUrl: `/investment-opportunities`,
  metadata: { tripId: trip.id }
});
```

### 2. Bid Received
**File**: `server/routes/trips.ts`
**When**: A lender places a bid on a trip
**Who gets notified**: Trip owner (borrower)
**Type**: `bid_received`

### 3. Bid Accepted
**When**: A borrower accepts a lender's bid
**Who gets notified**: The lender whose bid was accepted
**Type**: `bid_accepted`

### 4. Payment/Repayment
**When**: Payment or repayment transactions occur
**Who gets notified**: Both parties
**Type**: `payment_received`, `repayment_made`

## Expected Behavior After Fix

1. **Notification Bell**: Shows a badge with unread count
2. **Polling**: Fetches new notifications every 30 seconds
3. **Real-time Updates**: Custom events trigger immediate fetches
4. **Debug Logs**: Server logs show all notification operations

## Verification Checklist

- [ ] Server restarted with latest code
- [ ] No errors in server logs
- [ ] Notification table exists in database
- [ ] API endpoints respond (test with curl)
- [ ] NotificationBell shows up in UI
- [ ] Creating a new trip triggers notifications for lenders
- [ ] Notification count badge appears
- [ ] Clicking notification bell shows notification list
- [ ] Debug logs appear in server console

## Common Issues

### Issue: "Database not initialized"
**Solution**: Make sure the server has called `initDatabase()` on startup. Check `server/index.ts` for the initialization code.

### Issue: "Table doesn't exist"
**Solution**: Run the schema creation:
```bash
# Option 1: Using docker-compose
docker-compose exec backend node scripts/run-migrations.js

# Option 2: Using psql
docker-compose exec postgres psql -U postgres -d logifin -f /docker-entrypoint-initdb.d/schema.sql
```

### Issue: Notifications created but not showing
**Check**:
1. Browser console for API errors
2. Network tab for failed requests
3. Server logs for database errors
4. User ID matches between notification and logged-in user

### Issue: No notifications being created
**Check**:
1. Server logs for `🔔 [NOTIFICATION] Creating notification` messages
2. Try creating a trip manually
3. Check if `createNotification()` is being called (add more logs if needed)

## Debug Commands

```bash
# Check notifications in database
docker-compose exec postgres psql -U postgres -d logifin -c "SELECT COUNT(*) FROM notifications;"

# Check notifications for specific user
docker-compose exec postgres psql -U postgres -d logifin -c "SELECT * FROM notifications WHERE user_id = 'u-...' ORDER BY created_at DESC LIMIT 10;"

# Check recent notifications
docker-compose exec postgres psql -U postgres -d logifin -c "SELECT user_id, type, title, created_at FROM notifications ORDER BY created_at DESC LIMIT 20;"

# Watch server logs in real-time
docker-compose logs -f backend
```

## Next Steps

1. Deploy the changes to production
2. Monitor server logs for notification debug messages
3. Test by creating a new trip (should notify all lenders)
4. Verify NotificationBell shows the notification
5. If still not working, collect debug logs and investigate further

## Contact

If issues persist after following this guide:
1. Share server logs (especially NOTIFICATION messages)
2. Share browser console errors
3. Share API response for `/api/notifications/USER_ID`
4. Provide steps to reproduce the issue
