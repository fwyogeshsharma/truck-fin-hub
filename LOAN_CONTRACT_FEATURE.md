# Loan Contract Feature Implementation

## Overview
This feature implements a complete digital contract system for loan agreements between lenders and borrowers (transporters/shippers) with digital signatures.

## Database Schema

### New Tables Created

#### 1. `loan_contract_templates`
Stores reusable contract templates for lenders
- `id` - Primary key
- `lender_id` - Foreign key to users
- `template_name` - Name of the template
- `terms_and_conditions` - Main contract text
- `interest_rate_clause` - Interest terms
- `repayment_clause` - Repayment terms
- `late_payment_clause` - Late payment penalties
- `default_clause` - Default consequences
- `custom_clauses` - JSON array of custom clauses
- `lender_signature_image` - Base64 signature
- `is_default` - Whether this is the default template
- `created_at`, `updated_at` - Timestamps

#### 2. `loan_agreements`
Stores actual loan contracts for each trip/bid
- `id` - Primary key
- `trip_id` - Foreign key to trips
- `bid_id` - Foreign key to trip_bids
- `lender_id` - Foreign key to users (lender)
- `borrower_id` - Foreign key to users (borrower)
- Contract content fields (same as template)
- `lender_signature_image` - Lender's signature
- `lender_signed_at` - When lender signed
- `borrower_signature_image` - Borrower's signature
- `borrower_signed_at` - When borrower signed
- `status` - 'pending_borrower', 'accepted', 'rejected'
- `contract_accepted` - Boolean flag
- `created_at`, `updated_at` - Timestamps

### Modified Tables

#### `trip_bids`
- Added `contract_id` - Reference to loan_agreement
- Added `has_contract` - Boolean flag

#### `trips`
- Added `contract_id` - Reference to accepted loan_agreement
- Added `contract_accepted` - Boolean flag
- Added `contract_accepted_at` - Timestamp
- Added `borrower_signature_image` - Borrower's signature

## Components

### 1. `LoanContractEditor.tsx`
**Purpose:** Used by lenders when creating a bid

**Features:**
- Multi-tab interface for editing different contract sections:
  - Terms & Conditions
  - Interest Rate Clause
  - Repayment Clause
  - Late Payment & Default Clauses
  - Signature Upload
- Auto-fills contract with loan details (amount, interest, maturity)
- Signature upload with preview
- "Save as template" option for reuse
- Full text editing capability

**Props:**
```typescript
{
  open: boolean;
  onClose: () => void;
  onSave: (contract: LoanContract) => void;
  tripAmount: number;
  interestRate: number;
  maturityDays: number;
  lenderId: string;
}
```

### 2. `ContractAcceptanceDialog.tsx`
**Purpose:** Used by borrowers when allotting a trip

**Features:**
- Multi-tab interface for reviewing contract:
  - Overview (loan summary)
  - Full terms review
  - Interest terms
  - Repayment terms
  - Penalties & default
  - Acceptance & signature
- Visual loan summary with key numbers
- Read-only contract display
- Mandatory terms acceptance checkbox
- Signature upload requirement
- Warning notices

**Props:**
```typescript
{
  open: boolean;
  onClose: () => void;
  onAccept: (borrowerSignature: string) => void;
  contract: {
    lenderName: string;
    lenderSignature: string;
    termsAndConditions: string;
    interestRateClause: string;
    repaymentClause: string;
    latePaymentClause: string;
    defaultClause: string;
    tripAmount: number;
    interestRate: number;
    maturityDays: number;
  };
  loading?: boolean;
}
```

## Workflow

### Lender Workflow (Bidding)

1. **Lender clicks "Bid" on a trip**
2. **System shows bid form**
3. **After entering bid amount/interest, click "Next"**
4. **LoanContractEditor opens**
5. **Lender reviews/edits contract terms**
   - Can modify any clause
   - Can add custom clauses
6. **Lender uploads signature**
7. **Optionally saves as template (checkbox)**
8. **Clicks "Save & Proceed with Bid"**
9. **System creates:**
   - Bid record
   - Loan agreement record (status: 'pending_borrower')
   - Optional: Contract template record

### Borrower Workflow (Allotment)

1. **Borrower sees trip with bids**
2. **Clicks "Allot" on a bid**
3. **ContractAcceptanceDialog opens**
4. **Borrower reviews all contract sections**
   - Overview tab shows key numbers
   - Can read all terms
   - Sees lender's signature
5. **Borrower checks "I accept" checkbox**
6. **Borrower uploads signature**
7. **Clicks "Accept & Sign Contract"**
8. **System updates:**
   - Loan agreement (status: 'accepted', adds borrower signature)
   - Trip record (contract_accepted: true, adds borrower signature)
   - Proceeds with normal allotment flow

## Integration Steps

### Step 1: Update Database Schema

```bash
# Run migration 015
# For SQLite:
cat src/db/migrations/015_add_loan_contracts.sql | sqlite3 data/truck-fin-hub.db

# For PostgreSQL:
psql -U postgres -d logifin -f src/db/migrations/015_add_loan_contracts.postgres.sql
```

### Step 2: Update Lender Bid Flow

In `Lender.tsx` or bid creation component:

```typescript
import LoanContractEditor from '@/components/LoanContractEditor';

const [showContractEditor, setShowContractEditor] = useState(false);
const [bidData, setBidData] = useState(null);

const handleBidSubmit = (amount, interestRate) => {
  // Store bid data
  setBidData({ amount, interestRate, tripId, ... });

  // Show contract editor
  setShowContractEditor(true);
};

const handleContractSave = async (contract) => {
  // 1. Create loan agreement
  const agreementData = {
    tripId: bidData.tripId,
    lenderId: user.id,
    borrowerId: trip.loadOwnerId,
    loanAmount: bidData.amount,
    interestRate: bidData.interestRate,
    maturityDays: bidData.maturityDays,
    ...contract,
    status: 'pending_borrower',
  };

  const agreement = await apiClient.post('/loan-agreements', agreementData);

  // 2. Create bid with contract reference
  const bid = await apiClient.post('/trip-bids', {
    ...bidData,
    contractId: agreement.id,
    hasContract: true,
  });

  // 3. Optionally save template
  if (contract.saveAsTemplate) {
    await apiClient.post('/loan-contract-templates', {
      lenderId: user.id,
      templateName: contract.templateName,
      ...contract,
      isDefault: false,
    });
  }

  setShowContractEditor(false);
  // Refresh bids
};

return (
  <>
    {/* Bid form */}

    <LoanContractEditor
      open={showContractEditor}
      onClose={() => setShowContractEditor(false)}
      onSave={handleContractSave}
      tripAmount={bidData?.amount || 0}
      interestRate={bidData?.interestRate || 0}
      maturityDays={bidData?.maturityDays || 30}
      lenderId={user.id}
    />
  </>
);
```

### Step 3: Update Borrower Allotment Flow

In `LoadAgent.tsx` or allotment component:

```typescript
import ContractAcceptanceDialog from '@/components/ContractAcceptanceDialog';

const [showContractAcceptance, setShowContractAcceptance] = useState(false);
const [selectedBid, setSelectedBid] = useState(null);
const [contract, setContract] = useState(null);

const handleAllotClick = async (bid) => {
  // 1. Fetch loan agreement
  const agreement = await apiClient.get(`/loan-agreements/${bid.contractId}`);

  // 2. Get lender details
  const lender = await apiClient.get(`/users/${bid.lenderId}`);

  // 3. Prepare contract data
  setContract({
    lenderName: lender.name,
    lenderSignature: agreement.lenderSignatureImage,
    termsAndConditions: agreement.termsAndConditions,
    interestRateClause: agreement.interestRateClause,
    repaymentClause: agreement.repaymentClause,
    latePaymentClause: agreement.latePaymentClause,
    defaultClause: agreement.defaultClause,
    tripAmount: agreement.loanAmount,
    interestRate: agreement.interestRate,
    maturityDays: agreement.maturityDays,
  });

  setSelectedBid(bid);
  setShowContractAcceptance(true);
};

const handleContractAccept = async (borrowerSignature) => {
  // 1. Update loan agreement
  await apiClient.put(`/loan-agreements/${selectedBid.contractId}`, {
    borrowerSignatureImage: borrowerSignature,
    borrowerSignedAt: new Date().toISOString(),
    status: 'accepted',
    contractAccepted: true,
  });

  // 2. Proceed with normal allotment
  await allotTrip(selectedBid.tripId, selectedBid.lenderId, borrowerSignature);

  setShowContractAcceptance(false);
};

return (
  <>
    {/* Trip list with Allot buttons */}

    <ContractAcceptanceDialog
      open={showContractAcceptance}
      onClose={() => setShowContractAcceptance(false)}
      onAccept={handleContractAccept}
      contract={contract}
    />
  </>
);
```

## API Endpoints Needed

### Loan Agreements

```typescript
POST   /api/loan-agreements          // Create new agreement
GET    /api/loan-agreements/:id      // Get agreement by ID
PUT    /api/loan-agreements/:id      // Update agreement (add borrower signature)
GET    /api/loan-agreements/trip/:tripId    // Get agreements for trip
GET    /api/loan-agreements/bid/:bidId      // Get agreement for bid
```

### Contract Templates

```typescript
POST   /api/loan-contract-templates           // Create template
GET    /api/loan-contract-templates/:id       // Get template
GET    /api/loan-contract-templates/lender/:lenderId  // Get lender's templates
PUT    /api/loan-contract-templates/:id       // Update template
DELETE /api/loan-contract-templates/:id       // Delete template
GET    /api/loan-contract-templates/lender/:lenderId/default  // Get default template
```

## Security Considerations

1. **Signature Validation**: Images should be validated (size, format)
2. **Contract Immutability**: Once borrower signs, contract should be locked
3. **Access Control**: Only lender/borrower can view their contracts
4. **Audit Trail**: Track all contract changes and signatures
5. **Legal Compliance**: Ensure contracts meet local regulations

## Future Enhancements

1. **E-signature Integration**: Integrate with DocuSign or similar
2. **PDF Generation**: Generate PDF contracts
3. **Email Notifications**: Send contract copies via email
4. **Contract Templates Library**: Pre-built template marketplace
5. **Legal Review**: Option to have lawyer review contracts
6. **Multi-language Support**: Contracts in different languages
7. **Contract Versioning**: Track contract changes over time

## Testing Checklist

- [ ] Lender can create bid with contract
- [ ] Contract auto-fills with correct amounts
- [ ] Lender can edit all contract sections
- [ ] Signature upload works (with file size validation)
- [ ] Save as template works
- [ ] Template is saved to database
- [ ] Borrower sees contract when allotting
- [ ] All contract sections display correctly
- [ ] Borrower must check acceptance checkbox
- [ ] Borrower must upload signature
- [ ] Contract acceptance updates database
- [ ] Allotment proceeds only after contract acceptance
- [ ] Both signatures are stored correctly
- [ ] Contract status updates properly

## Database Migration

Migration files created:
- `src/db/migrations/015_add_loan_contracts.sql` (SQLite)
- `src/db/migrations/015_add_loan_contracts.postgres.sql` (PostgreSQL)

Add to `start-docker.sh` after migration 014.
