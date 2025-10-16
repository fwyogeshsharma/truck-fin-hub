# Company Admin Setup Guide

## Overview

This guide explains how to set up company admin users who can approve shipper (load_agent) access requests.

## User Flow

### For Shipper Users
1. User signs up with basic info (email, password, name, phone)
2. User accepts terms and conditions
3. User selects "Shipper" role
4. User selects their company from the list
5. User's `approval_status` is set to `pending`
6. User is logged out with a message to wait for approval
7. User **cannot login** until approved by company admin

### For Company Admin Users
1. Company admin logs in to their admin portal
2. Admin sees "Grant Access - Pending Shipper Approvals" card
3. Card shows **only** pending requests for their company
4. Admin can approve or reject each request
5. On approval: User's `approval_status` is set to `approved` and they can login
6. On rejection: User's `approval_status` is set to `rejected` with a reason

### For Super Admin Users
- Super admin can see **all** pending approvals from all companies
- Same approve/reject functionality

## Setting Up Company Admins

### Prerequisites
1. Server must be running (`npm run dev`)
2. Database must have the approval columns (run migration if needed)
3. User account must already exist in the database

### Option 1: Using PowerShell Script (Windows - Recommended)

```powershell
# Run the interactive setup script
.\setup-company-admin.ps1
```

The script will:
1. Show all available companies
2. Show all existing users
3. Prompt you for User ID and Company ID
4. Set the user as company admin

### Option 2: Using Bash Script (Linux/Mac)

```bash
# Make script executable
chmod +x setup-company-admin.sh

# Run the interactive setup script
./setup-company-admin.sh
```

### Option 3: Manual API Call

#### Step 1: Get list of companies
```bash
curl http://localhost:3001/api/companies?active=true
```

Note down the `id` of the company (e.g., "delhivery", "bluedart", etc.)

#### Step 2: Get list of users
```bash
curl http://localhost:3001/api/migrations/list-users
```

Note down the `id` of the user you want to make admin.

#### Step 3: Set user as company admin

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/migrations/set-company-admin \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "companyId": "COMPANY_ID"}'
```

**Using PowerShell:**
```powershell
$body = @{
    userId = "USER_ID"
    companyId = "COMPANY_ID"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/migrations/set-company-admin" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### What the API Does

The `/api/migrations/set-company-admin` endpoint will:
1. Set `is_admin = TRUE` for the user
2. Set `company_id` to the specified company ID
3. Set `company` to the company name
4. Set `approval_status = 'approved'` (so admin can login)
5. Return the updated user details

## Verification

### Check if Company Admin is Set Up Correctly

1. **Check in database:**
```sql
SELECT id, name, email, role, company, company_id, is_admin
FROM users
WHERE is_admin = TRUE;
```

2. **Login as the company admin:**
   - Email: [admin's email]
   - Password: [admin's password]

3. **Check the Admin Portal:**
   - You should see "Grant Access - Pending Shipper Approvals" card if there are pending requests
   - The card should only show requests for your company

4. **Check browser console logs:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for logs starting with 👤, 🔍, 📡
   - Verify `isCompanyAdmin: true` and correct `companyId`

## Testing the Complete Flow

### Test 1: Create Pending Shipper Request

1. Open browser in incognito/private mode
2. Go to signup page
3. Create new user (e.g., test-shipper@example.com)
4. Accept terms
5. Select "Shipper" role
6. Select the company that your admin manages
7. You should see: "Your shipper request for [Company] has been submitted"
8. You should be logged out

### Test 2: Approve as Company Admin

1. Login as company admin
2. Go to Admin Dashboard
3. You should see "Grant Access" card with the pending request
4. Click "Grant Access" button
5. User should be approved

### Test 3: Login as Approved Shipper

1. Go to login page
2. Login with the shipper credentials
3. Login should succeed and redirect to shipper dashboard

## Troubleshooting

### Company admin doesn't see pending requests

**Check 1: Is user set as company admin?**
```bash
curl http://localhost:3001/api/migrations/list-users
```
Look for the user and verify:
- `is_admin: true`
- `company_id` is set to correct company ID

**Check 2: Does pending shipper have correct company_id?**
```bash
curl http://localhost:3001/api/users/pending-approvals
```
Verify the pending user's `company_id` matches the admin's `company_id`

**Check 3: Browser console logs**
Open DevTools → Console, look for:
```
👤 Current user info: { is_admin: true, company_id: "..." }
🔍 Filtering logic: { isCompanyAdmin: true, companyId: "..." }
📡 Fetching pending approvals from: /api/users/pending-approvals?companyId=...
✅ Fetched pending approvals: { count: X, users: [...] }
```

### Error: "User not found" when setting company admin

The user ID might be incorrect. List all users first:
```bash
curl http://localhost:3001/api/migrations/list-users
```

### Error: "Company not found" when setting company admin

The company ID might be incorrect. List all companies first:
```bash
curl http://localhost:3001/api/companies?active=true
```

## Database Schema

### Users Table - Admin Related Columns

| Column | Type | Description |
|--------|------|-------------|
| `is_admin` | BOOLEAN | TRUE if user is a company admin |
| `company_id` | VARCHAR(255) | ID of the company this admin manages |
| `company` | VARCHAR(255) | Name of the company |
| `approval_status` | VARCHAR(20) | 'approved', 'pending', or 'rejected' |
| `approved_by` | VARCHAR(255) | User ID of admin who approved/rejected |
| `approved_at` | TIMESTAMP | When user was approved/rejected |
| `rejection_reason` | TEXT | Reason for rejection (if rejected) |

## API Endpoints

### Get Pending Approvals
```
GET /api/users/pending-approvals
GET /api/users/pending-approvals?companyId=COMPANY_ID
```

### Approve User
```
PUT /api/users/:id/approve
Body: { "approvedBy": "ADMIN_USER_ID" }
```

### Reject User
```
PUT /api/users/:id/reject
Body: { "rejectedBy": "ADMIN_USER_ID", "reason": "Rejection reason" }
```

### Set Company Admin (Helper)
```
POST /api/migrations/set-company-admin
Body: { "userId": "USER_ID", "companyId": "COMPANY_ID" }
```

### List Users (Helper)
```
GET /api/migrations/list-users
```

## Notes

- Super admins (`role = 'super_admin'` or `role = 'admin'`) see all pending requests
- Company admins (`is_admin = TRUE` + `company_id` set) see only their company's requests
- Regular users don't see the admin portal
- Only shipper role requires approval, other roles are auto-approved
