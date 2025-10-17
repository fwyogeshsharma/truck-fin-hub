# 🧪 Testing Guide: Allotment → Wallet & Transaction Flow

## 🎯 Purpose

Test that when a shipper/borrower **allots a trip** to a lender:
1. ✅ Shipper's wallet balance increases by the loan amount
2. ✅ Transaction record is created in the database
3. ✅ Transaction appears in the shipper's transaction history

## 📋 Prerequisites

Before testing, ensure:
- ✅ Backend server is running (`npm run dev`)
- ✅ Frontend is running
- ✅ Database is set up (PostgreSQL: `logifin` database)
- ✅ At least one shipper account exists
- ✅ At least one lender account exists

## 🧪 Step-by-Step Testing Process

### Step 1: Create Test Accounts (If Needed)

#### Shipper Account:
```
Role: load_agent
Name: Test Shipper
Email: testshipper@gmail.com
Password: Test@123
```

#### Lender Account:
```
Role: lender
Name: Test Lender
Email: testlender@gmail.com
Password: Test@123
```

### Step 2: Add Money to Lender's Wallet

1. Login as lender (`testlender@gmail.com`)
2. Go to Wallet page
3. Click "Add Money"
4. Add ₹100,000
5. **Verify**: Balance shows ₹100,000

### Step 3: Create a Trip (as Shipper)

1. **Logout** from lender
2. **Login** as shipper (`testshipper@gmail.com`)
3. Go to Dashboard
4. Click "Create Trip" or "+" button
5. Fill trip details:
   ```
   E-Way Bill Number: TEST123456
   Pickup: Mumbai
   Destination: Delhi
   Sender: ABC Company
   Receiver: XYZ Company
   Transporter: PQR Transport
   Loan Amount: ₹50,000
   Interest Rate: 10%
   Maturity Days: 30
   ```
6. Click "Create Trip"
7. **Verify**: Trip appears in "Pending Trips" section with status "pending"

### Step 4: Place a Bid (as Lender)

1. **Logout** from shipper
2. **Login** as lender
3. Go to "Investment Opportunities" page
4. Find the trip created by Test Shipper
5. Click "Place Bid" or "Invest"
6. Enter bid details:
   ```
   Amount: ₹50,000
   Interest Rate: 10%
   ```
7. Click "Confirm Bid"
8. **Verify**:
   - Lender's balance: ₹100,000 → ₹50,000
   - Lender's escrowed: ₹0 → ₹50,000
   - Trip status: "pending" → "escrowed"

### Step 5: Check Shipper Wallet BEFORE Allotment

1. **Logout** from lender
2. **Login** as shipper
3. Go to Wallet page
4. **Note down current balance** (should be ₹0)
5. Go to Transaction History
6. **Note down transaction count**

### Step 6: Allot the Trip (as Shipper) 🎯

This is the main test!

1. Still logged in as shipper
2. Go to Dashboard
3. Find the trip in "Escrowed Trips - Awaiting Allotment" section
4. You'll see the lender's bid:
   ```
   Test Lender - ₹50,000 at 10%
   [Allot] button
   ```
5. **Open Browser Console** (F12 → Console tab)
6. Click **"Allot"** button
7. **Watch the console logs**:
   ```
   🔵 [ALLOTMENT] Step 3: Updating borrower wallet
   🔵 [ALLOTMENT] Borrower ID: u-1760...
   🔵 [ALLOTMENT] Borrower wallet BEFORE: { balance: 0, ... }
   🔵 [ALLOTMENT] New balance will be: 50000
   🔵 [ALLOTMENT] Calling updateWallet API...
   ✅ [ALLOTMENT] Borrower wallet AFTER: { balance: 50000, ... }
   🔵 [ALLOTMENT] Step 4: Creating transaction for borrower...
   ✅ [ALLOTMENT] Transaction created successfully: { id: 'txn-...', amount: 50000, type: 'credit', ... }
   ```
8. You should see success toast:
   ```
   Trip Allotted Successfully!
   Trip has been allotted to Test Lender
   ```

### Step 7: Verify Shipper Wallet AFTER Allotment ✅

1. Go to Wallet page (or refresh)
2. **Check Balance**:
   - Should increase from ₹0 → ₹50,000 ✅
3. Click "Transaction History"
4. **Check Latest Transaction**:
   ```
   Type: Credit (green/up arrow)
   Amount: ₹50,000
   Category: Payment
   Description: Received ₹50,000 from Test Lender for trip Mumbai → Delhi
   Balance After: ₹50,000
   Timestamp: [current time]
   ```

### Step 8: Verify in Database (Optional)

```sql
-- Check wallet
SELECT * FROM wallets WHERE user_id = 'shipper-user-id';
-- Should show balance = 50000

-- Check transactions
SELECT * FROM transactions
WHERE user_id = 'shipper-user-id'
AND type = 'credit'
AND category = 'payment'
ORDER BY timestamp DESC
LIMIT 1;
-- Should show the transaction record

-- Check trip status
SELECT id, status, lender_id, lender_name, funded_at
FROM trips
WHERE id = 'trip-id';
-- Should show status = 'funded', lender info filled

-- Check investment status
SELECT id, status, lender_id, trip_id, amount, interest_rate
FROM investments
WHERE trip_id = 'trip-id';
-- Should show status = 'active'
```

## 🐛 Troubleshooting

### Issue 1: Wallet Balance NOT Updated

**Check Console Logs:**
```
❌ [ALLOTMENT] Failed to create borrower transaction: ...
```

**Possible Causes:**
- API endpoint not reachable
- Database connection issue
- Wallet not created for shipper

**Solution:**
```sql
-- Check if wallet exists
SELECT * FROM wallets WHERE user_id = 'shipper-id';

-- If not exists, create wallet
INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns)
VALUES ('shipper-id', 0, 0, 0, 0, 0);
```

### Issue 2: Transaction NOT Created

**Check Console Logs:**
```
❌ [ALLOTMENT] Failed to create borrower transaction: Error: ...
```

**Possible Causes:**
- Transactions table not created
- API endpoint error
- Invalid transaction data

**Solution:**
```sql
-- Check if transactions table exists
SELECT * FROM transactions LIMIT 1;

-- Check server logs for API errors
# Look for errors in terminal where server is running
```

### Issue 3: No Console Logs Appearing

**Solution:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Restart backend server
4. Try again

### Issue 4: "Allot" Button Not Appearing

**Possible Causes:**
- Trip status is not "escrowed"
- No bids on the trip
- User is not the trip owner

**Solution:**
1. Check trip status in database
2. Ensure lender has placed a bid
3. Ensure you're logged in as the trip creator

## ✅ Expected Results Summary

After successful allotment:

| Item | Before | After |
|------|--------|-------|
| **Shipper Wallet Balance** | ₹0 | ₹50,000 |
| **Shipper Transactions Count** | 0 | 1 |
| **Lender Wallet Balance** | ₹50,000 | ₹50,000 |
| **Lender Escrowed** | ₹50,000 | ₹0 |
| **Lender Invested** | ₹0 | ₹50,000 |
| **Trip Status** | escrowed | funded |
| **Investment Status** | escrowed | active |

## 📊 Console Logs Reference

### Success Logs (What You Should See):

```javascript
// Step 1: Trip status update
Trip updated successfully, now updating investment...

// Step 2: Investment status update
Found investments: 1
Updating investment status to active: inv-123
Investment updated successfully

// Step 3: Lender wallet update
Creating lender transaction...
Lender transaction created successfully

// Step 4: Borrower wallet update
🔵 [ALLOTMENT] Step 3: Updating borrower wallet
🔵 [ALLOTMENT] Borrower ID: u-1760...
🔵 [ALLOTMENT] Borrower wallet BEFORE: {
  balance: 0,
  totalInvested: 0,
  totalReturns: 0
}
🔵 [ALLOTMENT] New balance will be: 50000
🔵 [ALLOTMENT] Calling updateWallet API...
✅ [ALLOTMENT] Borrower wallet AFTER: {
  balance: 50000,
  totalInvested: 0,
  totalReturns: 0
}

// Step 5: Borrower transaction creation
🔵 [ALLOTMENT] Step 4: Creating transaction for borrower...
✅ [ALLOTMENT] Transaction created successfully: {
  id: "txn-1760614567890-abc123",
  amount: 50000,
  type: "credit",
  balanceAfter: 50000
}
```

### Error Logs (What to Watch For):

```javascript
❌ [ALLOTMENT] Failed to create borrower transaction: Error: ...
// If you see this, check the error message for details

❌ Failed to update trip status
// Trip update failed

❌ No investment found for trip: trip-123 lender: lender-456
// Investment record not found

❌ Failed to update investment status
// Investment update failed
```

## 🎯 Quick Verification Checklist

After allotment, verify:
- [ ] Shipper wallet balance increased by loan amount
- [ ] Transaction appears in shipper's history
- [ ] Transaction type is "credit"
- [ ] Transaction category is "payment"
- [ ] Transaction description mentions lender name and trip details
- [ ] Balance after matches current wallet balance
- [ ] Console logs show success messages
- [ ] No error messages in console
- [ ] Trip status changed to "funded"
- [ ] Investment status changed to "active"
- [ ] Lender's escrowed amount moved to invested

## 📞 Support

If issues persist:
1. Check `TRIP-ALLOTMENT-WALLET-FLOW.md` for implementation details
2. Check server logs in terminal
3. Check database directly using SQL queries
4. Verify API endpoints are working: `curl http://localhost:3001/api/wallets/USER_ID`

## 🎉 Success Criteria

Test is successful if:
1. ✅ Shipper's wallet shows increased balance
2. ✅ Transaction record exists in database
3. ✅ Transaction visible in UI
4. ✅ Console logs show all success messages
5. ✅ No errors in browser console
6. ✅ No errors in server logs
