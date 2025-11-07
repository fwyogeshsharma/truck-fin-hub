# Database Migration Instructions

## Run User Approval Migration

To fix the 500 error when selecting shipper role, you need to add the new database columns:

### Using Postman or cURL:

```bash
curl -X POST http://localhost:3001/api/migrations/add-user-approval-columns
```

### Or visit in browser:
Open your browser and go to:
```
http://localhost:3001/api/migrations/add-user-approval-columns
```

This will add the following columns to the `users` table:
- `company_id` - Links user to a company
- `approval_status` - User approval status ('approved', 'pending', 'rejected')
- `approved_by` - ID of admin who approved/rejected
- `approved_at` - Timestamp of approval/rejection
- `rejection_reason` - Reason for rejection (if applicable)

## How the System Works Now:

### For Regular Users (Shippers):
1. Sign up and accept terms
2. Select "Shipper" role
3. Choose their company from the list
4. Request is submitted with 'pending' status
5. User is logged out and must wait for approval
6. After approval, user can log in and access the system

### For Company Admins:
1. Login to admin portal
2. See "Grant Access - Pending Shipper Approvals" card
3. Review shipper requests for their company only
4. Click "Grant Access" to approve or "Deny Access" to reject
5. Approved users can now login

### For Super Admins:
- See ALL pending approvals from ALL companies
- Can approve/reject any shipper request

## Testing the Feature:

1. Run the migration (see above)
2. Create a company admin user with `is_admin: true` and `company_id: <company-id>`
3. Sign up as a new user
4. Select "Shipper" role and choose a company
5. Login as company admin and approve the request
6. New user can now login as shipper
