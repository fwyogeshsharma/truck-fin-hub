# Quick Start: Company Admin Approval System

## What Changed

The admin portal now has a **"Grant Access - Pending Shipper Approvals"** card that always appears on the Admin Dashboard. This card shows:

1. **For Company Admins**: Pending shipper requests for their specific company only
2. **For Super Admins**: All pending shipper requests from all companies
3. **Empty State**: Helpful message when there are no pending requests
4. **Setup Warnings**: Alerts if admin account is not properly configured

## Step 1: Check Your Setup

1. **Restart your server** to load the new code:
   ```powershell
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Login to your admin account**

3. **Look at the Admin Dashboard**:
   - You should now see the "Grant Access - Pending Shipper Approvals" card
   - It will show a message if there are no pending requests
   - If you see a warning about setup issues, continue to Step 2

## Step 2: Debug Your Setup

Click the **"Setup Debug"** button in the top-right of the Admin Dashboard. This will take you to `/admin/setup-debug` where you can see:

- ✅ Your current user configuration (is_admin, company_id, etc.)
- ✅ All pending approvals (all companies)
- ✅ Your company's pending approvals (if you're a company admin)
- ✅ All users and their admin status
- ✅ All available companies
- ✅ Setup instructions if you need to configure your account

## Step 3: Set Up Company Admin (If Needed)

If the debug page shows you're not properly configured as a company admin, follow these steps:

### Option A: Use PowerShell Script (Easiest)

```powershell
.\setup-company-admin.ps1
```

The script will:
1. Show all companies
2. Show all users
3. Ask which user should be admin for which company
4. Set it up automatically

### Option B: Manual Setup

1. **Find your user ID** from the debug page (or use the API):
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/list-users"
   ```

2. **Find the company ID** you want to manage:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/api/companies?active=true"
   ```

3. **Set yourself as company admin**:
   ```powershell
   $body = @{
       userId = "YOUR_USER_ID"
       companyId = "COMPANY_ID"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/set-company-admin" `
     -Method Post `
     -Body $body `
     -ContentType "application/json"
   ```

4. **Logout and login again** to reload your user data

## Step 4: Test the Flow

### Create a Test Shipper Request

1. Open a new browser in **incognito/private mode**
2. Go to `http://localhost:5173`
3. Sign up with a new account (e.g., test-shipper@example.com)
4. Accept terms and conditions
5. Select **"Shipper"** role
6. Select the company that you manage
7. You should see: "Your shipper request for [Company] has been submitted"
8. The user will be logged out

### Approve as Company Admin

1. Go back to your admin account (regular browser)
2. Refresh the Admin Dashboard
3. You should now see the pending request in the "Grant Access" card
4. Click **"Grant Access"** button to approve
5. Success! The shipper can now login

### Login as Approved Shipper

1. In incognito mode, go to login
2. Login with the test shipper credentials
3. Should successfully login and redirect to shipper dashboard

## Troubleshooting

### "I don't see the Grant Access card"

The card should always be visible now. If not:
- Make sure you restarted the server
- Clear your browser cache (Ctrl+Shift+R)
- Check browser console for errors (F12)

### "Card shows 'No Pending Approvals'"

This means:
- Either there are no pending requests (which is fine)
- Or you're a company admin but no one has requested access to your company yet
- Create a test request following Step 4 above

### "I see a setup warning in the card"

This means you have `is_admin = true` but no `company_id`. To fix:
1. Click the "Setup Debug" button
2. Follow the setup instructions shown on that page
3. Or run the setup script: `.\setup-company-admin.ps1`

### "Company admin sees all requests, not just their company"

Check the debug page:
- Verify `is_admin = true`
- Verify `company_id` is set to the correct company ID
- If `company_id` is missing, run the setup script again

### "Browser console shows errors"

Open browser DevTools (F12) → Console tab. Look for logs:
```
👤 Current user info: { is_admin: ..., company_id: ... }
🔍 Filtering logic: { isCompanyAdmin: ..., companyId: ... }
📡 Fetching pending approvals from: ...
✅ Fetched pending approvals: { count: ..., users: [...] }
```

These logs will help identify the issue.

## What Happens Behind the Scenes

### For Shipper Users:
1. Selects "Shipper" role + Company → `approval_status = 'pending'`
2. User is logged out
3. User **cannot login** until approved

### For Company Admins:
1. Login → System checks `is_admin = true` AND `company_id` is set
2. Fetches pending approvals: `/api/users/pending-approvals?companyId=THEIR_COMPANY_ID`
3. Sees only their company's requests in the card
4. Approves → User's `approval_status = 'approved'` + user can login

### For Super Admins:
1. Login → System checks `role = 'super_admin'` OR `role = 'admin'`
2. Fetches all pending approvals: `/api/users/pending-approvals`
3. Sees ALL requests from ALL companies in the card
4. Same approve functionality

## Files Modified

- `src/pages/dashboard/Admin.tsx` - Card now always visible with helpful messages
- `src/pages/AdminSetupDebug.tsx` - New debug page (NEW)
- `server/routes/migrations.ts` - Added setup helper endpoints
- `setup-company-admin.ps1` - PowerShell setup script (NEW)
- `setup-company-admin.sh` - Bash setup script (NEW)
- `COMPANY-ADMIN-SETUP.md` - Full documentation (NEW)

## Need More Help?

See the full guide: **COMPANY-ADMIN-SETUP.md**
