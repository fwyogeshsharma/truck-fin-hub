# 🔔 Notification Integration Examples

## Quick Integration Guide

### Example 1: Trip Creation Notification

**File**: `src/pages/CreateTrip.tsx`

**Current Code** (After trip creation):
```typescript
// Trip created successfully
toast({
  title: "Success!",
  description: "Your trip has been created successfully."
});
navigate('/dashboard/load_owner');
```

**Add Notification** (After toast):
```typescript
import { notifyTripCreated } from '@/utils/notificationTriggers';

// Trip created successfully
toast({
  title: "Success!",
  description: "Your trip has been created successfully."
});

// Send notification
const user = auth.getCurrentUser();
if (user) {
  await notifyTripCreated(user.id, user.email, {
    origin: formData.origin,
    destination: formData.destination,
    loadType: formData.loadType,
    amount: formData.amount,
    distance: formData.distance,
    actionUrl: '/dashboard/load_owner'
  });
}

navigate('/dashboard/load_owner');
```

---

### Example 2: Bid Received Notification

**File**: `src/pages/InvestmentOpportunities.tsx`

**Current Code** (After submitting bid):
```typescript
// Bid submitted
toast({
  title: "Bid submitted successfully!",
});
```

**Add Notification**:
```typescript
import { notifyBidReceived } from '@/utils/notificationTriggers';

// Bid submitted
toast({
  title: "Bid submitted successfully!",
});

// Notify load owner about new bid
await notifyBidReceived(trip.loadOwnerId, trip.loadOwnerEmail, {
  origin: trip.origin,
  destination: trip.destination,
  lenderName: currentUser.name,
  amount: bidAmount,
  interestRate: bidRate,
  actionUrl: `/trips/${trip.id}`
});
```

---

### Example 3: Investment Allotted Notification

**When load owner accepts a bid**:

```typescript
import { notifyInvestmentAllotted } from '@/utils/notificationTriggers';

// After accepting bid
await notifyInvestmentAllotted(bid.lenderId, bid.lenderEmail, {
  origin: trip.origin,
  destination: trip.destination,
  amount: bid.amount,
  interestRate: bid.interestRate,
  expectedReturn: bid.amount * (bid.interestRate / 100),
  maturityDays: trip.maturityDays || 30,
  actionUrl: '/investments'
});

toast({
  title: "Bid accepted!",
  description: "The lender has been notified."
});
```

---

### Example 4: Investment Confirmed (Both Parties)

**When lender confirms investment**:

```typescript
import { notifyInvestmentConfirmed } from '@/utils/notificationTriggers';

// Notify lender
await notifyInvestmentConfirmed(lender.id, lender.email, {
  origin: trip.origin,
  destination: trip.destination,
  amount: investment.amount,
  interestRate: investment.interestRate,
  expectedReturn: investment.expectedReturn,
  role: 'lender',
  actionUrl: '/investments'
});

// Notify borrower (load owner)
await notifyInvestmentConfirmed(borrower.id, borrower.email, {
  origin: trip.origin,
  destination: trip.destination,
  amount: investment.amount,
  interestRate: investment.interestRate,
  expectedReturn: investment.expectedReturn,
  role: 'load_owner',
  actionUrl: '/dashboard/load_owner'
});
```

---

### Example 5: Wallet Transaction Notifications

**File**: `src/pages/Wallet.tsx` or wallet API

**When crediting wallet**:
```typescript
import { notifyWalletCredited } from '@/utils/notificationTriggers';

// After successful credit
await notifyWalletCredited(user.id, user.email, {
  amount: creditAmount,
  description: 'Deposit via UPI',
  newBalance: wallet.balance + creditAmount,
  timestamp: new Date().toISOString(),
  actionUrl: '/wallet'
});
```

**When debiting wallet**:
```typescript
import { notifyWalletDebited } from '@/utils/notificationTriggers';

// After successful debit
await notifyWalletDebited(user.id, user.email, {
  amount: debitAmount,
  description: 'Investment in trip',
  newBalance: wallet.balance - debitAmount,
  timestamp: new Date().toISOString(),
  actionUrl: '/wallet'
});
```

---

### Example 6: KYC Approval/Rejection

**File**: `src/pages/KYCAdmin.tsx`

**When approving KYC**:
```typescript
import { notifyKYCApproved } from '@/utils/notificationTriggers';

// After approval
await notifyKYCApproved(user.id, user.email);

toast({
  title: "KYC Approved",
  description: "User has been notified via email."
});
```

**When rejecting KYC**:
```typescript
import { notifyKYCRejected } from '@/utils/notificationTriggers';

// After rejection
await notifyKYCRejected(
  user.id,
  user.email,
  'Documents are not clear',
  [
    'Please upload a clearer image of Aadhar card',
    'PAN card photo is blurry',
    'Ensure all corners of documents are visible'
  ]
);

toast({
  title: "KYC Rejected",
  description: "User has been notified with corrections needed."
});
```

---

### Example 7: Trip Completion (Multiple Users)

**When trip is marked as completed**:

```typescript
import { notifyTripCompleted, notifyInvestmentReturned } from '@/utils/notificationTriggers';

// Notify load owner
await notifyTripCompleted(loadOwner.id, loadOwner.email, {
  origin: trip.origin,
  destination: trip.destination,
  amount: trip.amount,
  completedAt: new Date().toISOString(),
  role: 'load_owner',
  actionUrl: `/trips/${trip.id}`
});

// Notify all lenders who invested
for (const investment of trip.investments) {
  await notifyTripCompleted(investment.lenderId, investment.lenderEmail, {
    origin: trip.origin,
    destination: trip.destination,
    amount: trip.amount,
    completedAt: new Date().toISOString(),
    role: 'lender',
    actionUrl: `/investments/${investment.id}`
  });

  // Also notify about returns
  await notifyInvestmentReturned(investment.lenderId, investment.lenderEmail, {
    principal: investment.amount,
    returns: investment.returns,
    total: investment.amount + investment.returns,
    roi: (investment.returns / investment.amount) * 100,
    actionUrl: '/wallet'
  });
}
```

---

### Example 8: System Alert to All Users

**For platform-wide announcements**:

```typescript
import { notifySystemAlert, notifyMultipleUsers } from '@/utils/notificationTriggers';

// Get all active users
const allUsers = await getUsersAPI.getAllUsers();

// Send to everyone
await notifyMultipleUsers(
  allUsers.map(u => ({ id: u.id, email: u.email })),
  'system_alert',
  {
    message: 'Scheduled maintenance on Sunday, 2AM-4AM IST',
    details: 'The platform will be unavailable during this time. Please plan accordingly.',
    actionUrl: '/dashboard'
  }
);
```

---

### Example 9: Manual Test Notification (Development)

**Add a test button in your dashboard for development**:

```typescript
import { notificationService } from '@/services/notificationService';

const handleTestNotification = () => {
  const user = auth.getCurrentUser();
  if (!user) return;

  notificationService.createNotification(
    user.id,
    'trip_funded',
    {
      origin: 'Mumbai',
      destination: 'Delhi',
      amount: 150000,
      lenderName: 'Test Lender',
      interestRate: 12,
      actionUrl: '/dashboard'
    }
  );

  toast({
    title: "Test notification created!",
    description: "Check the notification bell"
  });
};

// In your JSX
<Button onClick={handleTestNotification} variant="outline">
  Test Notification
</Button>
```

---

## 🎯 Integration Checklist

For each feature that should trigger notifications:

- [ ] Import the appropriate trigger function
- [ ] Call the function after the action completes
- [ ] Provide all required data fields
- [ ] Include `actionUrl` for navigation
- [ ] Handle both success and error cases
- [ ] Test both email and in-app notifications
- [ ] Verify notification appears in bell
- [ ] Verify email is sent (if enabled)
- [ ] Check notification content is correct
- [ ] Ensure proper user role receives it

---

## 💡 Best Practices

### 1. Always await notifications
```typescript
// ✅ Good
await notifyTripCreated(user.id, user.email, data);

// ❌ Bad - notification might not send
notifyTripCreated(user.id, user.email, data);
```

### 2. Provide actionUrl for context
```typescript
// ✅ Good - user can click to see details
await notifyBidReceived(owner.id, owner.email, {
  ...data,
  actionUrl: `/trips/${tripId}`
});

// ⚠️ Okay - but less useful
await notifyBidReceived(owner.id, owner.email, data);
```

### 3. Include all relevant data
```typescript
// ✅ Good - complete information
await notifyInvestmentAllotted(lender.id, lender.email, {
  origin: trip.origin,
  destination: trip.destination,
  amount: bid.amount,
  interestRate: bid.interestRate,
  expectedReturn: calculated.returns,
  maturityDays: trip.maturityDays
});

// ❌ Bad - missing important details
await notifyInvestmentAllotted(lender.id, lender.email, {
  amount: bid.amount
});
```

### 4. Handle errors gracefully
```typescript
try {
  await notifyTripCreated(user.id, user.email, data);
} catch (error) {
  // Don't fail the main operation if notification fails
  console.error('Failed to send notification:', error);
  // Optionally log to error tracking service
}
```

### 5. Batch notifications when possible
```typescript
// ✅ Good - single call for multiple users
await notifyMultipleUsers(
  investors.map(i => ({ id: i.id, email: i.email })),
  'trip_completed',
  tripData
);

// ❌ Bad - multiple sequential calls
for (const investor of investors) {
  await notifyTripCompleted(investor.id, investor.email, tripData);
}
```

---

## 🧪 Testing Your Integration

### 1. Setup Test Email
```
Email: your-test-email@gmail.com
Enable email notifications in settings
```

### 2. Trigger the Event
```
Perform the action (create trip, submit bid, etc.)
```

### 3. Verify Notifications
```
✓ Check notification bell (should show badge)
✓ Click bell (notification should appear)
✓ Check email inbox (should have email)
✓ Click notification (should navigate to actionUrl)
✓ Verify all data is correct in both places
```

### 4. Test Edge Cases
```
✓ What if email is not configured?
✓ What if user has no email?
✓ What if notification data is incomplete?
✓ What if network fails?
```

---

## 📝 Quick Reference

| Event | Trigger Function | Who Gets It | Priority |
|-------|-----------------|-------------|----------|
| Trip Created | `notifyTripCreated` | Load Owner | Medium |
| Trip Funded | `notifyTripFunded` | Load Owner | High |
| Trip Completed | `notifyTripCompleted` | Load Owner, Lenders | High |
| Bid Received | `notifyBidReceived` | Load Owner | High |
| Investment Allotted | `notifyInvestmentAllotted` | Lender | Urgent |
| Investment Confirmed | `notifyInvestmentConfirmed` | Both | High |
| Investment Returned | `notifyInvestmentReturned` | Lender | High |
| Wallet Credited | `notifyWalletCredited` | User | Medium |
| Wallet Debited | `notifyWalletDebited` | User | Medium |
| KYC Approved | `notifyKYCApproved` | User | High |
| KYC Rejected | `notifyKYCRejected` | User | Urgent |
| System Alert | `notifySystemAlert` | All/Specific | Varies |

---

## ✅ Ready to Integrate!

Start with high-priority notifications:
1. Trip Created → Trip Funded → Trip Completed (full journey)
2. Bid flow → Investment Allotted → Confirmed → Returned
3. Wallet transactions
4. KYC status updates

Then add lower-priority ones as needed!
