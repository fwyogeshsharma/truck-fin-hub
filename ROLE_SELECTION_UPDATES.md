# Role Selection Flow Updates

## Summary
Updated the role selection flow to allow:
1. **Lenders**: Choose between Individual or Company lender
2. **Shippers**: Select existing company or create new company

## Changes Made

### Frontend Changes

#### 1. RoleSelection.tsx (`src/pages/RoleSelection.tsx`)
- Added **Lender Type Dialog**: Shows Individual vs Company choice for lenders
- Added **Shipper Action Dialog**: Shows Select vs Create company options for shippers
- Added **Company Creation Form**: Full form to create new company with validation
- Updated flow logic:
  - Lenders selecting "Individual" go directly to dashboard (no company needed)
  - Lenders selecting "Company" must choose from existing companies
  - Shippers can either select existing company or create new one

#### 2. User Interface Updates (`src/lib/auth.ts` & `src/api/auth.ts`)
- Added `user_type` field to User interface: `'individual' | 'company'`
- Updated `updateUserRole()` to accept `userType` parameter
- Updated API types to include `userType` in UpdateRoleData

#### 3. Database Migration (`src/db/migrations/009_add_user_type_to_users.sql`)
- Added `user_type` column to users table
- Constraint: CHECK(user_type IN ('individual', 'company'))
- Automatically sets user_type based on existing company data
- Added index for performance

### User Flow

#### For Lenders:
```
Select "Lender" Role
  ↓
Choose Type:
  - Individual Lender → ✅ Direct to Dashboard (no company needed)
  - Company Lender → Select Company → Request Approval → Wait for Admin
```

#### For Shippers (Load Agents):
```
Select "Shipper" Role
  ↓
Choose Action:
  - Select Existing Company → Choose from list → Request Approval → Wait for Admin
  - Create New Company → Fill Form → Submit → Request Approval → Wait for Admin
```

## Backend Updates Needed

### 1. Update Auth Route Handler (`server/routes/auth.ts`)

Add `user_type` field handling in the role update endpoint:

```typescript
router.put('/role', async (req, res) => {
  const { userId, role, company, companyId, companyLogo, approvalStatus, userType } = req.body;

  // Update user with user_type
  await db.run(
    `UPDATE users
     SET role = ?, company = ?, company_id = ?, company_logo = ?,
         approval_status = ?, user_type = ?
     WHERE id = ?`,
    [role, company, companyId, companyLogo, approvalStatus || 'approved', userType, userId]
  );

  // ... rest of the logic
});
```

### 2. Update Companies Route (`server/routes/companies.ts`)

Add POST endpoint to create new companies:

```typescript
router.post('/', async (req, res) => {
  const { name, display_name, email, phone, address, gst_number } = req.body;

  // Validate required fields
  if (!name || !display_name || !email || !phone || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create company
  const companyId = `company_${Date.now()}`;
  await db.run(
    `INSERT INTO companies (id, name, display_name, email, phone, address, gst_number, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, datetime('now'))`,
    [companyId, name, display_name, email, phone, address, gst_number || null]
  );

  // Return created company
  const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
  res.json(company);
});
```

### 3. Run Database Migration

Execute the migration on your database:

```bash
# For PostgreSQL
psql -d logifin -f src/db/migrations/009_add_user_type_to_users.sql

# Or use your existing migration system
npm run migrate
```

### 4. Update Schema if needed

Add to `src/db/schema.postgres.sql`:

```sql
-- Add user_type column to users table
user_type VARCHAR(20) CHECK(user_type IN ('individual', 'company')),
```

## Testing Checklist

### Individual Lender Flow:
- [ ] User selects "Lender" role
- [ ] Dialog shows "Individual Lender" and "Company Lender" options
- [ ] Click "Individual Lender"
- [ ] User is redirected directly to lender dashboard
- [ ] No company is associated with the user
- [ ] user_type is set to 'individual' in database

### Company Lender Flow:
- [ ] User selects "Lender" role
- [ ] Dialog shows "Individual Lender" and "Company Lender" options
- [ ] Click "Company Lender"
- [ ] Company selection dialog appears
- [ ] User selects a company
- [ ] Request is submitted for approval
- [ ] User is logged out
- [ ] user_type is set to 'company' in database
- [ ] approval_status is set to 'pending'

### Shipper - Select Company Flow:
- [ ] User selects "Shipper" role
- [ ] Dialog shows "Select Existing Company" and "Create New Company"
- [ ] Click "Select Existing Company"
- [ ] List of companies appears
- [ ] User selects a company
- [ ] Request is submitted for approval
- [ ] User is logged out
- [ ] user_type is set to 'company' in database

### Shipper - Create Company Flow:
- [ ] User selects "Shipper" role
- [ ] Dialog shows "Select Existing Company" and "Create New Company"
- [ ] Click "Create New Company"
- [ ] Company creation form appears
- [ ] User fills in company details (name, email, phone, address, GST)
- [ ] GST validation works (optional field, specific format)
- [ ] Submit creates new company
- [ ] User is associated with new company
- [ ] Request is submitted for approval
- [ ] User is logged out
- [ ] user_type is set to 'company' in database

## Benefits

1. **Flexibility**: Lenders can now participate as individuals without needing a company
2. **Easier Onboarding**: Individual lenders skip approval process
3. **Company Management**: Shippers can create their own companies
4. **Better UX**: Clear separation between individual and institutional users
5. **Data Integrity**: user_type field tracks the nature of each user

## API Endpoints Used

- `GET /api/companies?active=true` - Fetch active companies
- `POST /api/companies` - Create new company (needs to be implemented)
- `PUT /api/auth/role` - Update user role and type (needs userType parameter)

## Notes

- Individual lenders bypass the approval process and go straight to dashboard
- Company lenders/shippers require admin approval before accessing the system
- The company creation form includes GST validation (15-character format)
- All dialogs are responsive and work on mobile devices
- Form validation ensures data quality before submission
