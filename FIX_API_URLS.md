# Fix API URLs - Point All Calls to VM IP

## Problem
API calls are hitting `https://tf.rollingradius.com/api/*` instead of `https://34.93.247.3/api/*`

## Root Cause
Many files use hardcoded `fetch('/api/...')` instead of using the `apiClient` which respects the `VITE_API_URL` environment variable.

## Solution

### 1. Environment Variables (Already Configured ✅)
The following files already have the correct URL configured:
- `.env`: `VITE_API_URL=https://34.93.247.3/api`
- `netlify.toml`: All environments set to `https://34.93.247.3/api`
- `vite.config.ts`: Proxy configured

### 2. Files That Need Updating

The following files have hardcoded `fetch('/api/...')` calls that need to use `apiClient` instead:

#### Critical Files (Need Immediate Fix):
- ✅ `src/pages/RoleSelection.tsx` - **FIXED**
- `src/pages/Users.tsx` - 7 fetch calls
- `src/pages/Wallet.tsx` - 2 fetch calls
- `src/components/WalletCard.tsx` - 1 fetch call
- `src/pages/InvestmentOpportunities.tsx` - 1 fetch call
- `src/pages/NotificationSettings.tsx` - 3 fetch calls
- `src/pages/AdminSetupDebug.tsx` - 3 fetch calls
- `src/services/notificationService.ts` - 1 fetch call

### 3. How to Fix Each File

#### Pattern to Replace:
```typescript
// OLD (Incorrect - uses relative URL):
const response = await fetch('/api/users');
if (response.ok) {
  const data = await response.json();
  // use data
}

// NEW (Correct - uses apiClient with VITE_API_URL):
import { apiClient } from '@/api/client';

const data = await apiClient.get('/users');
// use data directly
```

For POST/PUT/DELETE:
```typescript
// OLD:
await fetch('/api/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// NEW:
await apiClient.post('/companies', data);
```

### 4. Quick Fix Commands

Run these commands to deploy the fix:

```bash
# 1. Push the updated code
git add .
git commit -m "Fix: Use apiClient for all API calls to respect VITE_API_URL"
git push

# 2. Wait for Netlify to deploy (2-3 minutes)
# Check: https://app.netlify.com/sites/YOUR-SITE/deploys

# 3. Verify API URL is set in Netlify
# Go to: Site Settings → Environment Variables
# Confirm: VITE_API_URL = https://34.93.247.3/api

# 4. Trigger rebuild if needed
# Netlify Dashboard → Deploys → Trigger deploy → Clear cache and deploy site
```

### 5. Testing After Deployment

1. Open https://tf.rollingradius.com
2. Open DevTools (F12) → Network tab
3. Try to create a company or select role
4. Verify requests go to: `https://34.93.247.3/api/companies` (not tf.rollingradius.com)

### 6. Backend Requirements

Make sure your VM backend has:

1. **HTTPS Set Up** (via Nginx)
   ```bash
   # Check if Nginx is running
   sudo systemctl status nginx

   # Test HTTPS endpoint
   curl -k https://34.93.247.3/api/health
   ```

2. **CORS Configured** for tf.rollingradius.com
   ```typescript
   // In server/index.ts
   const allowedOrigins = [
     'https://tf.rollingradius.com',
     'http://localhost:8080',
     // ... other origins
   ];
   ```

3. **Companies API Endpoint** exists
   ```typescript
   // server/routes/companies.ts
   router.post('/', async (req, res) => {
     // Create company logic
   });
   ```

### 7. Verification Checklist

After deployment:
- [ ] API calls show `https://34.93.247.3` in Network tab (not tf.rollingradius.com)
- [ ] Company selection works
- [ ] Company creation works
- [ ] No CORS errors in console
- [ ] No mixed content errors
- [ ] Authentication works
- [ ] All features accessible

### 8. If Still Not Working

**Clear Netlify Build Cache:**
```bash
# In Netlify Dashboard:
1. Go to Site Settings → Build & Deploy → Build Settings
2. Click "Clear cache and deploy site"
3. Wait for rebuild
```

**Verify Environment Variable:**
```bash
# In Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Verify VITE_API_URL exists and equals: https://34.93.247.3/api
3. If not, add it and redeploy
```

**Check Browser Cache:**
```
1. Hard refresh: Ctrl + Shift + R (Windows/Linux) or Cmd + Shift + R (Mac)
2. Or clear site data: DevTools → Application → Clear storage → Clear site data
```

## Summary

The main issue is hardcoded relative URLs (`/api/...`) that resolve to the same domain as the frontend. By using `apiClient` everywhere, all API calls will use the `VITE_API_URL` environment variable which points to your VM.

**Key Points:**
- Environment variables are already configured ✅
- RoleSelection.tsx is already fixed ✅
- Need to update remaining files to use apiClient
- Deploy to Netlify for changes to take effect
- Ensure VM has HTTPS and CORS configured
