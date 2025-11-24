# Reconciliation Document Upload - Enhanced Workflow Implementation

## Overview
This implementation adds a comprehensive reconciliation document upload workflow with multi-trip selection, lender-wise grouping, and dual approval system (lender + transporter).

## Features Implemented

### 1. **Upload Reconciliation Document Dialog**
- **Location**: `src/pages/Reconciliation.tsx` (lines 714-880)
- **Features**:
  - Document upload (PDF, Excel, Images)
  - Trust account selection
  - **NEW**: Lender selection from dropdown
  - **NEW**: Multi-select trip selection (grouped by lender)
  - Visual trip selection with checkboxes
  - Amount and date fields
  - Description field

### 2. **Lender-Wise Trip Selection**
- Trips are fetched and grouped by lender
- Only completed trips with assigned lenders are shown
- UI shows trip count per lender
- Multi-select checkbox interface for trip selection
- Selected trips counter

### 3. **Trust Account Approval Workflow**
- Trust account reviews uploaded reconciliation documents
- On approval:
  - Sets `workflow_status` to `'trust_approved'`
  - Sends notification to lender
  - Sends notification to transporter
  - Triggers dual approval workflow

### 4. **Dual Approval System**

#### **Lender Approval**
- **Endpoint**: `PATCH /api/reconciliations/:id/approve-claim`
- Lender approves reconciliation for their trips
- Updates `lender_approved` flag
- If transporter also approved → triggers bank request

#### **Transporter Approval**
- **Endpoint**: `PATCH /api/reconciliations/:id/approve-transporter`
- Transporter approves reconciliation
- Updates `transporter_approved` flag
- If lender also approved → triggers bank request

### 5. **Bank Trust Account Request Generation**
- Automatically triggered when BOTH lender and transporter approve
- Sets `bank_request_generated` flag
- Displays message: "Within 24-48 hours you will see the bank trust account request. Please verify and approve that to complete the payment process."
- Sends notifications to both parties

### 6. **Approval Status Tracking**
- Visual status badges showing:
  - Trust Account approval status
  - Lender approval status
  - Transporter approval status
- Color-coded badges (green = approved, yellow = pending, gray = not started)

## Database Changes

### New Migration: `033_enhance_reconciliation_workflow.sql`

**New Columns Added to `reconciliations` table:**

| Column | Type | Description |
|--------|------|-------------|
| `selected_trip_ids` | JSONB | Array of trip IDs selected for reconciliation |
| `selected_lender_id` | VARCHAR(255) | The lender for selected trips |
| `selected_lender_name` | VARCHAR(255) | Lender name for display |
| `transporter_approved` | BOOLEAN | Whether transporter approved |
| `transporter_approved_at` | TIMESTAMP | When transporter approved |
| `bank_request_generated` | BOOLEAN | Whether bank request was generated |
| `bank_request_generated_at` | TIMESTAMP | When bank request was generated |
| `bank_request_message` | TEXT | Message displayed to users about bank request |
| `workflow_status` | VARCHAR(50) | Current workflow stage |

**Workflow Status Values:**
- `pending` - Initial state
- `trust_approved` - Trust account approved
- `lender_approved` - Lender approved (waiting for transporter)
- `transporter_approved` - Transporter approved (waiting for lender)
- `all_approved` - Both approved
- `bank_request_sent` - Bank request generated

**Indexes Created:**
- `idx_reconciliations_selected_lender` on `selected_lender_id`
- `idx_reconciliations_workflow_status` on `workflow_status`
- `idx_reconciliations_transporter_approved` on `transporter_approved`
- `idx_reconciliations_bank_request` on `bank_request_generated`

## API Endpoints

### New Endpoints

#### 1. Get Trips Grouped by Lender
```
GET /api/reconciliations/trips/by-lender?transporterId={id}
```
Returns trips grouped by lender for multi-select.

**Response:**
```json
[
  {
    "lender_id": "lender-123",
    "lender_name": "ABC Finance",
    "lender_company": "ABC Corp",
    "trips": [
      {
        "id": "trip-1",
        "origin": "Delhi",
        "destination": "Mumbai",
        "amount": 50000,
        "load_type": "Container",
        "distance": 1400
      }
    ]
  }
]
```

#### 2. Approve Reconciliation (Transporter)
```
PATCH /api/reconciliations/:id/approve-transporter
Body: { transporter_id: string }
```
Marks reconciliation as approved by transporter.

#### 3. Get Pending Approvals for Lender
```
GET /api/reconciliations/lender/pending-approvals?lenderId={id}
```
Returns reconciliations awaiting lender approval.

### Modified Endpoints

#### Create Reconciliation
```
POST /api/reconciliations
```
**New Fields:**
- `selected_trip_ids`: Array of trip IDs
- `selected_lender_id`: Lender ID
- `selected_lender_name`: Lender name

#### Approve Reconciliation (Trust Account)
```
PATCH /api/reconciliations/:id/approve
```
**Enhanced behavior:**
- Sets `workflow_status` to `'trust_approved'`
- Sends notifications to lender and transporter
- Initiates dual approval workflow

#### Approve Claim (Lender)
```
PATCH /api/reconciliations/:id/approve-claim
```
**Enhanced behavior:**
- Checks if transporter also approved
- If both approved → generates bank request
- Sends notification about bank request

## Workflow Flow

```
1. Transporter uploads reconciliation document
   ↓
   - Selects trust account
   - Selects lender
   - Selects multiple trips for that lender
   - Uploads document
   ↓
2. Trust Account reviews and approves
   ↓
   - Status: trust_approved
   - Notifications sent to lender and transporter
   ↓
3. DUAL APPROVAL PHASE
   ├─→ Lender approves (via /approve-claim)
   └─→ Transporter approves (via /approve-transporter)
   ↓
4. When BOTH approve:
   ↓
   - bank_request_generated = true
   - workflow_status = 'bank_request_sent'
   - Message: "Within 24-48 hours you will see the bank trust account request..."
   ↓
5. Bank trust account request appears in system
   ↓
6. Final verification and payment
```

## UI Components Updated

### Reconciliation Upload Dialog
- **File**: `src/pages/Reconciliation.tsx:714-880`
- Added lender selection dropdown
- Added multi-trip checkbox selection
- Shows trip count and details
- Visual feedback for selected trips

### Reconciliation Card
- **File**: `src/pages/Reconciliation.tsx:625-726`
- Shows "Approve Reconciliation" button for transporter (when trust_approved)
- Displays approval status badges for all three parties
- Shows bank request message when generated
- Displays selected trips count and lender info

## Files Modified

1. **Database Migration**
   - `src/db/migrations/033_enhance_reconciliation_workflow.sql` (NEW)
   - `scripts/run-migration-033.ts` (NEW)

2. **Backend API**
   - `server/routes/reconciliations.ts`
     - Added `/trips/by-lender` endpoint (lines 117-171)
     - Updated `POST /` to handle trip selection (lines 203-272)
     - Enhanced `PATCH /:id/approve` (lines 346-417)
     - Enhanced `PATCH /:id/approve-claim` (lines 520-613)
     - Added `PATCH /:id/approve-transporter` (NEW, lines 615-711)
     - Added `/lender/pending-approvals` endpoint (NEW, lines 713-742)

3. **Frontend UI**
   - `src/pages/Reconciliation.tsx`
     - Added interfaces for Trip and LenderGroup (lines 50-68)
     - Added state for lender selection and multi-trip (lines 127-130)
     - Added `fetchLenderGroupedTrips()` (lines 180-192)
     - Added `handleOpenUploadDialog()` (lines 194-197)
     - Added `handleToggleTripSelection()` (lines 199-203)
     - Added `handleApproveAsTransporter()` (lines 489-509)
     - Enhanced upload dialog UI (lines 744-806)
     - Enhanced reconciliation card display (lines 653-726)

## Testing the Implementation

1. **Run the migration:**
   ```bash
   npx tsx scripts/run-migrations.ts
   ```

2. **Test workflow:**
   - Login as Transporter
   - Upload reconciliation document
   - Select lender and multiple trips
   - Login as Trust Account
   - Approve the reconciliation
   - Login as Transporter again
   - Approve the reconciliation
   - Login as Lender
   - Approve the claim
   - Verify bank request message appears for both parties

## Notifications

The system sends notifications at these stages:

1. **Trust Account Approval** → Lender + Transporter
2. **Both Approvals Complete** → Lender + Transporter (bank request message)

## Benefits

✅ Multi-trip reconciliation in single document
✅ Lender-wise organization
✅ Dual approval ensures accuracy
✅ Clear workflow status tracking
✅ Automatic bank request generation
✅ Comprehensive notification system
✅ Audit trail with timestamps

## Future Enhancements

- Add reject functionality for lender and transporter
- Export reconciliation reports
- Bulk reconciliation upload
- Integration with actual bank APIs
- Email notifications in addition to in-app
- Document version history

---

**Implementation Date**: November 24, 2025
**Migration Number**: 033
**Status**: ✅ Complete and Tested
