# Truck-Fin-Hub Test Cases

## Overview
This document contains comprehensive test cases for the Truck Financing Hub application, covering all user roles and functionalities.

---

## Table of Contents
1. [Authentication & User Management](#1-authentication--user-management)
2. [Super Admin Dashboard](#2-super-admin-dashboard)
3. [Shipper/Load Owner Dashboard](#3-shipperload-owner-dashboard)
4. [Lender Dashboard](#4-lender-dashboard)
5. [Investment Opportunities](#5-investment-opportunities)
6. [Trip Management](#6-trip-management)
7. [Bidding System](#7-bidding-system)
8. [Notification System](#8-notification-system)
9. [KYC Verification](#9-kyc-verification)
10. [Reports & Analytics](#10-reports--analytics)
11. [Profile Management](#11-profile-management)

---

## 1. Authentication & User Management

### TC-001: User Registration (Shipper)
**Objective**: Verify shipper can successfully register
**Prerequisites**: None
**Steps**:
1. Navigate to `/signup`
2. Select "Load Owner/Shipper" role
3. Enter valid name (e.g., "John Doe")
4. Enter valid email (e.g., "john@example.com")
5. Enter valid password (minimum 6 characters)
6. Enter valid phone number
7. Enter company name
8. Click "Create Account"

**Expected Result**:
- User account created successfully
- Redirected to shipper dashboard
- Welcome message displayed
- User data saved in database

**Status**: [ ] Pass [ ] Fail

---

### TC-002: User Registration (Lender)
**Objective**: Verify lender can successfully register
**Prerequisites**: None
**Steps**:
1. Navigate to `/signup`
2. Select "Lender/Investor" role
3. Enter valid name
4. Enter valid email
5. Enter valid password
6. Enter valid phone number
7. Enter company name (optional)
8. Click "Create Account"

**Expected Result**:
- Lender account created successfully
- Redirected to lender dashboard
- Investment opportunities visible
- User data saved in database

**Status**: [ ] Pass [ ] Fail

---

### TC-003: User Login
**Objective**: Verify user can login with valid credentials
**Prerequisites**: User account exists
**Steps**:
1. Navigate to `/login`
2. Enter registered email
3. Enter correct password
4. Click "Login"

**Expected Result**:
- User logged in successfully
- Redirected to appropriate dashboard based on role
- Session created
- User data loaded

**Status**: [ ] Pass [ ] Fail

---

### TC-004: Login with Invalid Credentials
**Objective**: Verify system rejects invalid credentials
**Prerequisites**: None
**Steps**:
1. Navigate to `/login`
2. Enter email: "invalid@example.com"
3. Enter password: "wrongpassword"
4. Click "Login"

**Expected Result**:
- Error message displayed: "Invalid credentials"
- User remains on login page
- No session created

**Status**: [ ] Pass [ ] Fail

---

### TC-005: Logout
**Objective**: Verify user can logout successfully
**Prerequisites**: User is logged in
**Steps**:
1. Click on user profile menu
2. Click "Logout"

**Expected Result**:
- User logged out successfully
- Session cleared
- Redirected to login page
- Cannot access protected routes

**Status**: [ ] Pass [ ] Fail

---

## 2. Super Admin Dashboard

### TC-006: View Dashboard Statistics
**Objective**: Verify super admin can view all statistics
**Prerequisites**: Login as super admin
**Steps**:
1. Login with super admin credentials
2. Navigate to `/dashboard/super-admin`

**Expected Result**:
- Total Shippers count displayed
- Total Lenders count displayed
- Total Trips count displayed
- Active Investments count displayed
- Total Revenue displayed
- Pending Verifications displayed
- All statistics are accurate and match database

**Status**: [ ] Pass [ ] Fail

---

### TC-007: View Recent Activity
**Objective**: Verify super admin can see recent activity
**Prerequisites**: Login as super admin, some activities exist
**Steps**:
1. Navigate to super admin dashboard
2. Scroll to "Recent Activity" section

**Expected Result**:
- Recent activities displayed in chronological order
- Activity types include: registrations, trips, investments
- Each activity shows timestamp
- Activity descriptions are clear and informative

**Status**: [ ] Pass [ ] Fail

---

### TC-008: Manage Users
**Objective**: Verify super admin can manage user accounts
**Prerequisites**: Login as super admin
**Steps**:
1. Navigate to "Users" section
2. View list of all users
3. Search for specific user
4. Click on user to view details
5. Modify user status (activate/deactivate)

**Expected Result**:
- All users displayed with filters
- Search functionality works
- User details accessible
- Status changes save successfully
- Changes reflected immediately

**Status**: [ ] Pass [ ] Fail

---

### TC-009: View System Reports
**Objective**: Verify super admin can access system reports
**Prerequisites**: Login as super admin
**Steps**:
1. Navigate to "Reports" section
2. Select date range
3. Select report type (trips/investments/revenue)
4. Click "Generate Report"

**Expected Result**:
- Report generated successfully
- Data matches selected criteria
- Charts and graphs display correctly
- Export functionality works (if available)

**Status**: [ ] Pass [ ] Fail

---

## 3. Shipper/Load Owner Dashboard

### TC-010: View Shipper Dashboard Overview
**Objective**: Verify shipper can view their dashboard
**Prerequisites**: Login as shipper/load owner
**Steps**:
1. Login with shipper credentials
2. View dashboard at `/dashboard/load-agent`

**Expected Result**:
- Total Trips count displayed
- Active Trips count displayed
- Total Funding amount displayed
- Pending Trips count displayed
- Recent trips list visible
- Trip statistics accurate

**Status**: [ ] Pass [ ] Fail

---

### TC-011: Create New Trip
**Objective**: Verify shipper can create a new trip
**Prerequisites**: Login as shipper
**Steps**:
1. Navigate to dashboard
2. Click "Create New Trip" or "+" button
3. Enter Origin: "Delhi"
4. Enter Destination: "Mumbai"
5. Enter Load Type: "Electronics"
6. Enter Amount: "50000"
7. Enter Distance: "1400" km
8. Enter Interest Rate: "12" %
9. Select Risk Level: "Medium"
10. Enter Maturity Days: "30"
11. Click "Create Trip"

**Expected Result**:
- Trip created successfully
- Trip ID generated
- Trip appears in "My Trips" list
- Trip status is "Pending"
- All lenders receive notification
- Trip saved in database

**Status**: [ ] Pass [ ] Fail

---

### TC-012: View Trip Details
**Objective**: Verify shipper can view their trip details
**Prerequisites**: Login as shipper, at least one trip exists
**Steps**:
1. Navigate to dashboard
2. Click on a trip from "My Trips" list
3. View trip details page

**Expected Result**:
- All trip information displayed correctly
- Origin, destination, amount, interest rate visible
- Current status shown
- Bids received (if any) displayed
- Trip timeline/history visible

**Status**: [ ] Pass [ ] Fail

---

### TC-013: View Bids Received
**Objective**: Verify shipper can see bids on their trip
**Prerequisites**: Login as shipper, trip exists with bids
**Steps**:
1. Navigate to trip details page
2. Scroll to "Bids Received" section

**Expected Result**:
- All bids displayed with lender names
- Bid amounts and interest rates visible
- Bid timestamps shown
- Options to accept/reject bids available
- Bid details complete and accurate

**Status**: [ ] Pass [ ] Fail

---

### TC-014: Accept Bid
**Objective**: Verify shipper can accept a bid
**Prerequisites**: Login as shipper, trip has received bids
**Steps**:
1. Navigate to trip with bids
2. Review bid details
3. Click "Accept" on preferred bid
4. Confirm acceptance

**Expected Result**:
- Bid accepted successfully
- Trip status changes to "Funded"
- Lender notified of acceptance
- Other bids automatically rejected
- Investment record created

**Status**: [ ] Pass [ ] Fail

---

### TC-015: Reject Bid
**Objective**: Verify shipper can reject a bid
**Prerequisites**: Login as shipper, trip has received bids
**Steps**:
1. Navigate to trip with bids
2. Click "Reject" on a bid
3. Optionally provide reason
4. Confirm rejection

**Expected Result**:
- Bid rejected successfully
- Lender notified of rejection
- Bid status updated to "Rejected"
- Trip remains available for other bids

**Status**: [ ] Pass [ ] Fail

---

### TC-016: Complete Trip
**Objective**: Verify shipper can mark trip as completed
**Prerequisites**: Login as shipper, trip is funded and in progress
**Steps**:
1. Navigate to active trip
2. Click "Mark as Completed"
3. Confirm completion

**Expected Result**:
- Trip status changes to "Completed"
- Repayment calculation triggered
- Lender notified of completion
- Return amount calculated with interest

**Status**: [ ] Pass [ ] Fail

---

## 4. Lender Dashboard

### TC-017: View Lender Dashboard Overview
**Objective**: Verify lender can view their dashboard
**Prerequisites**: Login as lender
**Steps**:
1. Login with lender credentials
2. View dashboard

**Expected Result**:
- Total Investments count displayed
- Active Investments count displayed
- Total Returns amount displayed
- Available Opportunities count displayed
- Portfolio summary visible
- Investment statistics accurate

**Status**: [ ] Pass [ ] Fail

---

### TC-018: View Investment Opportunities
**Objective**: Verify lender can browse available trips
**Prerequisites**: Login as lender
**Steps**:
1. Navigate to "Investment Opportunities" page
2. View list of available trips

**Expected Result**:
- All pending trips displayed
- Trip details visible (origin, destination, amount, interest)
- Risk levels shown
- Filter options available
- Sort options working
- Search functionality operational

**Status**: [ ] Pass [ ] Fail

---

### TC-019: Place Bid on Trip
**Objective**: Verify lender can place a bid
**Prerequisites**: Login as lender, pending trips available
**Steps**:
1. Navigate to investment opportunities
2. Select a trip
3. Click "Place Bid"
4. Enter bid amount: "45000"
5. Enter interest rate: "10" %
6. Add optional notes
7. Click "Submit Bid"

**Expected Result**:
- Bid submitted successfully
- Confirmation message displayed
- Shipper receives notification
- Bid appears in "My Bids" section
- Bid saved in database

**Status**: [ ] Pass [ ] Fail

---

### TC-020: View My Investments
**Objective**: Verify lender can view their active investments
**Prerequisites**: Login as lender, has accepted bids
**Steps**:
1. Navigate to "My Investments" page
2. View list of active investments

**Expected Result**:
- All accepted investments displayed
- Investment status shown (active/completed)
- Expected returns calculated
- Maturity dates visible
- Trip details accessible

**Status**: [ ] Pass [ ] Fail

---

### TC-021: View Investment Returns
**Objective**: Verify lender can see their returns
**Prerequisites**: Login as lender, has completed investments
**Steps**:
1. Navigate to "Returns" or "Portfolio" section
2. View completed investments

**Expected Result**:
- Completed investments listed
- Principal amount shown
- Interest earned displayed
- Total return calculated correctly
- ROI percentage accurate
- Payment dates visible

**Status**: [ ] Pass [ ] Fail

---

### TC-022: Filter Investment Opportunities
**Objective**: Verify lender can filter available opportunities
**Prerequisites**: Login as lender
**Steps**:
1. Navigate to investment opportunities
2. Apply filters:
   - Risk Level: "Low"
   - Interest Rate: "10-15%"
   - Amount Range: "20000-50000"
3. Click "Apply Filters"

**Expected Result**:
- Results filtered correctly
- Only matching trips displayed
- Filter count updated
- Clear filters option available
- Filters persist during session

**Status**: [ ] Pass [ ] Fail

---

## 5. Investment Opportunities

### TC-023: View Opportunity Details
**Objective**: Verify complete trip details visible to lenders
**Prerequisites**: Login as lender
**Steps**:
1. Navigate to investment opportunities
2. Click on a specific trip
3. View detailed information

**Expected Result**:
- Complete trip information displayed
- Shipper details shown (name, rating if available)
- Route map visible (if implemented)
- Risk assessment displayed
- Expected returns calculated
- Maturity timeline shown

**Status**: [ ] Pass [ ] Fail

---

### TC-024: Calculate ROI
**Objective**: Verify ROI calculator works correctly
**Prerequisites**: Login as lender, viewing trip details
**Steps**:
1. View trip with 12% interest, 30 days maturity, ₹50000 amount
2. Check calculated returns

**Expected Result**:
- Interest amount: ₹500 (50000 × 12% × 30/365)
- Total return: ₹50500
- ARR (Annual Return Rate) displayed correctly
- Calculations match financial formulas

**Status**: [ ] Pass [ ] Fail

---

### TC-025: View Risk Assessment
**Objective**: Verify risk information is displayed
**Prerequisites**: Login as lender
**Steps**:
1. View trip details
2. Check risk level section

**Expected Result**:
- Risk level clearly displayed (Low/Medium/High)
- Risk factors listed
- Shipper credibility score visible (if available)
- Historical performance data shown (if available)

**Status**: [ ] Pass [ ] Fail

---

## 6. Trip Management

### TC-026: Edit Trip Details
**Objective**: Verify shipper can edit pending trip
**Prerequisites**: Login as shipper, pending trip exists
**Steps**:
1. Navigate to trip details
2. Click "Edit" button
3. Modify amount to "55000"
4. Modify interest rate to "13%"
5. Click "Save Changes"

**Expected Result**:
- Changes saved successfully
- Updated values displayed
- Trip still in pending status
- Modification timestamp updated

**Status**: [ ] Pass [ ] Fail

---

### TC-027: Cancel Trip
**Objective**: Verify shipper can cancel unfunded trip
**Prerequisites**: Login as shipper, pending trip with no accepted bids
**Steps**:
1. Navigate to trip details
2. Click "Cancel Trip"
3. Confirm cancellation

**Expected Result**:
- Trip cancelled successfully
- Trip status changes to "Cancelled"
- Trip removed from active opportunities
- All pending bids rejected automatically
- Lenders notified of cancellation

**Status**: [ ] Pass [ ] Fail

---

### TC-028: View Trip History
**Objective**: Verify trip activity history is tracked
**Prerequisites**: Trip with some activity exists
**Steps**:
1. Navigate to trip details
2. Scroll to "Activity History" section

**Expected Result**:
- All activities logged (created, bid received, funded, completed)
- Timestamps for each activity
- User details for each action
- Chronological order maintained

**Status**: [ ] Pass [ ] Fail

---

## 7. Bidding System

### TC-029: Multiple Bids on Same Trip
**Objective**: Verify multiple lenders can bid on same trip
**Prerequisites**: Login as different lenders
**Steps**:
1. Lender A places bid: ₹45000 at 10%
2. Lender B places bid: ₹48000 at 9%
3. Lender C places bid: ₹50000 at 11%

**Expected Result**:
- All bids recorded successfully
- Shipper sees all bids
- Each bid independent
- Bids can be compared
- Best offer highlighted (optional)

**Status**: [ ] Pass [ ] Fail

---

### TC-030: Edit Bid Before Acceptance
**Objective**: Verify lender can modify their bid
**Prerequisites**: Login as lender, bid placed but not accepted
**Steps**:
1. Navigate to "My Bids"
2. Select pending bid
3. Click "Edit Bid"
4. Modify amount or interest rate
5. Click "Update Bid"

**Expected Result**:
- Bid updated successfully
- Shipper sees updated bid
- Original bid replaced
- Update timestamp recorded

**Status**: [ ] Pass [ ] Fail

---

### TC-031: Withdraw Bid
**Objective**: Verify lender can withdraw pending bid
**Prerequisites**: Login as lender, bid placed but not accepted
**Steps**:
1. Navigate to "My Bids"
2. Select pending bid
3. Click "Withdraw Bid"
4. Confirm withdrawal

**Expected Result**:
- Bid withdrawn successfully
- Bid removed from shipper's view
- Bid status updated to "Withdrawn"
- Cannot be re-activated

**Status**: [ ] Pass [ ] Fail

---

### TC-032: Bid Auto-Rejection on Trip Funding
**Objective**: Verify other bids auto-reject when one is accepted
**Prerequisites**: Multiple bids on same trip
**Steps**:
1. Shipper accepts Lender A's bid
2. Check status of other bids

**Expected Result**:
- Only accepted bid remains active
- Other bids automatically rejected
- Rejected lenders notified
- Bid history preserved

**Status**: [ ] Pass [ ] Fail

---

## 8. Notification System

### TC-033: Trip Creation Notification
**Objective**: Verify all lenders notified on trip creation
**Prerequisites**: Login as shipper, multiple lender accounts exist
**Steps**:
1. Shipper creates new trip
2. Login as Lender A - check notifications
3. Login as Lender B - check notifications
4. Login as Lender C - check notifications

**Expected Result**:
- All lenders receive notification
- Notification title: "New Investment Opportunity Available"
- Message includes trip details (origin, destination, amount, interest)
- Notification priority: "High"
- Click notification navigates to trip details
- Unread count badge updates

**Status**: [ ] Pass [ ] Fail

---

### TC-034: Bid Received Notification
**Objective**: Verify shipper notified when bid received
**Prerequisites**: Login as lender
**Steps**:
1. Lender places bid on trip
2. Login as shipper (trip owner)
3. Check notification bell icon

**Expected Result**:
- Notification received
- Notification title: "New Investment Bid Received"
- Message includes bid details (amount, interest, lender name)
- Notification priority: "High"
- Click notification navigates to trip details
- Unread count increments

**Status**: [ ] Pass [ ] Fail

---

### TC-035: Mark Notification as Read
**Objective**: Verify user can mark notification as read
**Prerequisites**: Login with unread notifications
**Steps**:
1. Click notification bell icon
2. Click checkmark on individual notification

**Expected Result**:
- Notification marked as read
- Read indicator appears
- Unread count decreases
- Notification background changes
- Status persists after refresh

**Status**: [ ] Pass [ ] Fail

---

### TC-036: Mark All Notifications as Read
**Objective**: Verify user can mark all notifications as read
**Prerequisites**: Login with multiple unread notifications
**Steps**:
1. Click notification bell icon
2. Click "Mark all read" button

**Expected Result**:
- All notifications marked as read
- Unread count becomes 0
- Badge disappears
- All notification backgrounds change

**Status**: [ ] Pass [ ] Fail

---

### TC-037: Delete Notification
**Objective**: Verify user can delete individual notification
**Prerequisites**: Login with notifications
**Steps**:
1. Click notification bell icon
2. Click trash icon on notification
3. Confirm deletion

**Expected Result**:
- Notification deleted
- Removed from list immediately
- Total count decreases
- Cannot be recovered

**Status**: [ ] Pass [ ] Fail

---

### TC-038: Clear All Notifications
**Objective**: Verify user can clear all notifications
**Prerequisites**: Login with notifications
**Steps**:
1. Click notification bell icon
2. Click "Clear all notifications" button
3. Confirm action

**Expected Result**:
- All notifications deleted
- Empty state displayed
- Message: "No notifications yet"
- Count resets to 0

**Status**: [ ] Pass [ ] Fail

---

### TC-039: Notification Real-time Update
**Objective**: Verify notifications update without page refresh
**Prerequisites**: Two browsers open - shipper and lender
**Steps**:
1. Browser A: Login as lender
2. Browser B: Login as shipper, create trip
3. Wait 30 seconds (polling interval)
4. Check Browser A notification bell

**Expected Result**:
- New notification appears in Browser A
- Unread count updates automatically
- No page refresh required
- Notification within 30 seconds

**Status**: [ ] Pass [ ] Fail

---

### TC-040: Notification Action URL
**Objective**: Verify clicking notification navigates correctly
**Prerequisites**: Login with investment opportunity notification
**Steps**:
1. Click notification bell
2. Click on "New Investment Opportunity" notification

**Expected Result**:
- Navigates to `/investment-opportunities` page
- Notification marked as read automatically
- Popover closes
- Correct page displayed

**Status**: [ ] Pass [ ] Fail

---

### TC-041: Notification Priority Display
**Objective**: Verify notifications show correct priority badges
**Prerequisites**: Notifications with different priorities exist
**Steps**:
1. Click notification bell
2. View notification list

**Expected Result**:
- Priority badges displayed with correct colors
- Urgent: Red background
- High: Orange background
- Medium: Blue background
- Low: Gray background
- Priority text visible

**Status**: [ ] Pass [ ] Fail

---

### TC-042: Notification Time Display
**Objective**: Verify relative time display works correctly
**Prerequisites**: Notifications of varying ages
**Steps**:
1. View notifications created at different times

**Expected Result**:
- Recent: "Just now"
- < 1 hour: "Xm ago"
- < 24 hours: "Xh ago"
- < 7 days: "Xd ago"
- Older: Full date display
- Time accurate and updates

**Status**: [ ] Pass [ ] Fail

---

## 9. KYC Verification

### TC-043: Submit Shipper KYC
**Objective**: Verify shipper can submit KYC documents
**Prerequisites**: Login as shipper
**Steps**:
1. Navigate to "Profile" or "KYC" section
2. Upload Company Registration Certificate
3. Upload GST Certificate
4. Upload Bank Account Details
5. Upload ID Proof (Aadhaar/PAN)
6. Fill company details
7. Click "Submit for Verification"

**Expected Result**:
- Documents uploaded successfully
- KYC status: "Pending Verification"
- Super admin notified
- Submission timestamp recorded
- Documents stored securely

**Status**: [ ] Pass [ ] Fail

---

### TC-044: Verify KYC Documents (Super Admin)
**Objective**: Verify super admin can approve/reject KYC
**Prerequisites**: Login as super admin, pending KYC exists
**Steps**:
1. Navigate to "Pending Verifications"
2. Click on shipper KYC
3. Review documents
4. Click "Approve" or "Reject"
5. Add verification notes

**Expected Result**:
- KYC status updated
- User notified of decision
- Approved: User can proceed with full features
- Rejected: Reason provided to user
- Verification recorded in system

**Status**: [ ] Pass [ ] Fail

---

### TC-045: Submit Lender KYC
**Objective**: Verify lender can submit KYC documents
**Prerequisites**: Login as lender
**Steps**:
1. Navigate to KYC section
2. Upload PAN Card
3. Upload Aadhaar Card
4. Upload Bank Statement
5. Upload Address Proof
6. Fill personal details
7. Click "Submit for Verification"

**Expected Result**:
- Documents uploaded successfully
- KYC status: "Pending Verification"
- Cannot invest until approved
- Submission recorded

**Status**: [ ] Pass [ ] Fail

---

## 10. Reports & Analytics

### TC-046: Generate Trip Report
**Objective**: Verify trip reports can be generated
**Prerequisites**: Login as shipper or super admin
**Steps**:
1. Navigate to "Reports" section
2. Select report type: "Trips"
3. Select date range: Last 30 days
4. Select status filter: "All"
5. Click "Generate Report"

**Expected Result**:
- Report generated successfully
- Shows trip statistics
- Charts/graphs display correctly
- Data accurate and complete
- Export option available (PDF/Excel)

**Status**: [ ] Pass [ ] Fail

---

### TC-047: Generate Investment Report
**Objective**: Verify investment reports can be generated
**Prerequisites**: Login as lender or super admin
**Steps**:
1. Navigate to "Reports" section
2. Select report type: "Investments"
3. Select date range
4. Click "Generate Report"

**Expected Result**:
- Report shows all investments
- ROI calculated correctly
- Returns breakdown displayed
- Active vs completed investments
- Portfolio performance metrics

**Status**: [ ] Pass [ ] Fail

---

### TC-048: View Financial Analytics
**Objective**: Verify financial analytics dashboard
**Prerequisites**: Login as super admin
**Steps**:
1. Navigate to "Analytics" section
2. View revenue charts
3. View investment trends
4. View user growth metrics

**Expected Result**:
- All charts render correctly
- Data points accurate
- Trends visible
- Filters work properly
- Interactive elements functional

**Status**: [ ] Pass [ ] Fail

---

## 11. Profile Management

### TC-049: Update Profile Information
**Objective**: Verify user can update their profile
**Prerequisites**: Login as any user
**Steps**:
1. Navigate to "Profile" page
2. Click "Edit Profile"
3. Update name, phone, company
4. Upload/change profile picture
5. Click "Save Changes"

**Expected Result**:
- Profile updated successfully
- Changes reflected immediately
- Data persists after logout/login
- Profile picture displayed correctly

**Status**: [ ] Pass [ ] Fail

---

### TC-050: Change Password
**Objective**: Verify user can change password
**Prerequisites**: Login as any user
**Steps**:
1. Navigate to "Profile" page
2. Click "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Click "Update Password"

**Expected Result**:
- Password changed successfully
- Can login with new password
- Old password no longer works
- Confirmation message displayed

**Status**: [ ] Pass [ ] Fail

---

## Integration Test Scenarios

### TC-051: End-to-End Trip Lifecycle
**Objective**: Test complete trip flow from creation to completion
**Prerequisites**: Shipper and lender accounts exist
**Steps**:
1. Shipper creates trip
2. Verify lenders receive notifications
3. Lender places bid
4. Verify shipper receives notification
5. Shipper accepts bid
6. Trip status changes to "Funded"
7. Shipper marks trip as completed
8. Lender receives returns
9. Investment record updated

**Expected Result**:
- Complete flow works seamlessly
- All notifications sent correctly
- Status changes propagate
- Financial calculations accurate
- Records updated properly

**Status**: [ ] Pass [ ] Fail

---

### TC-052: End-to-End Investment Lifecycle
**Objective**: Test complete investment flow from lender perspective
**Prerequisites**: Trips available
**Steps**:
1. Lender browses opportunities
2. Lender places bid
3. Bid accepted by shipper
4. Investment appears in portfolio
5. Trip completed
6. Returns calculated
7. Payment recorded

**Expected Result**:
- Investment tracked through all stages
- Portfolio updates automatically
- Returns calculated correctly
- Payment history maintained

**Status**: [ ] Pass [ ] Fail

---

## Performance Test Cases

### TC-053: Load Test - Multiple Concurrent Users
**Objective**: Verify system handles multiple users
**Prerequisites**: Test environment
**Steps**:
1. Simulate 50 concurrent users
2. Perform various actions (login, create trips, place bids)
3. Monitor system performance

**Expected Result**:
- System remains responsive
- No crashes or errors
- Response times acceptable (< 2 seconds)
- Database handles concurrent requests

**Status**: [ ] Pass [ ] Fail

---

### TC-054: Notification Performance
**Objective**: Verify notification system scales with many users
**Prerequisites**: 100+ lender accounts
**Steps**:
1. Create trip (should notify all lenders)
2. Monitor notification creation time
3. Check API response times

**Expected Result**:
- All notifications created quickly (< 5 seconds)
- API remains responsive
- Database queries optimized
- No timeout errors

**Status**: [ ] Pass [ ] Fail

---

## Security Test Cases

### TC-055: Unauthorized Access Prevention
**Objective**: Verify users cannot access unauthorized routes
**Prerequisites**: Login as lender
**Steps**:
1. Attempt to access `/dashboard/super-admin`
2. Attempt to modify another user's trip
3. Attempt to access API endpoints without auth

**Expected Result**:
- Access denied
- Redirected to login or error page
- Error message displayed
- No sensitive data leaked

**Status**: [ ] Pass [ ] Fail

---

### TC-056: SQL Injection Prevention
**Objective**: Verify system protects against SQL injection
**Prerequisites**: None
**Steps**:
1. Attempt login with: `email: "admin' OR '1'='1"`
2. Attempt search with SQL injection patterns

**Expected Result**:
- Attacks prevented
- Inputs sanitized
- No database errors
- System remains secure

**Status**: [ ] Pass [ ] Fail

---

### TC-057: XSS Prevention
**Objective**: Verify system protects against XSS attacks
**Prerequisites**: Login as user
**Steps**:
1. Enter script tags in trip description: `<script>alert('XSS')</script>`
2. Submit form

**Expected Result**:
- Script not executed
- Input sanitized or escaped
- No malicious code runs
- Data stored safely

**Status**: [ ] Pass [ ] Fail

---

## Browser Compatibility

### TC-058: Chrome Browser Test
**Objective**: Verify application works in Chrome
**Expected Result**: All features functional
**Status**: [ ] Pass [ ] Fail

---

### TC-059: Firefox Browser Test
**Objective**: Verify application works in Firefox
**Expected Result**: All features functional
**Status**: [ ] Pass [ ] Fail

---

### TC-060: Safari Browser Test
**Objective**: Verify application works in Safari
**Expected Result**: All features functional
**Status**: [ ] Pass [ ] Fail

---

### TC-061: Edge Browser Test
**Objective**: Verify application works in Edge
**Expected Result**: All features functional
**Status**: [ ] Pass [ ] Fail

---

## Mobile Responsiveness

### TC-062: Mobile View - Dashboard
**Objective**: Verify dashboards responsive on mobile
**Steps**:
1. Open app on mobile device or resize browser to mobile size
2. Navigate through dashboards

**Expected Result**:
- Layout adjusts properly
- All elements visible
- Touch interactions work
- No horizontal scrolling
- Navigation menu accessible

**Status**: [ ] Pass [ ] Fail

---

### TC-063: Mobile View - Forms
**Objective**: Verify forms work on mobile
**Steps**:
1. Try creating trip on mobile
2. Try placing bid on mobile

**Expected Result**:
- Forms properly sized
- Input fields accessible
- Validation messages visible
- Submit buttons reachable

**Status**: [ ] Pass [ ] Fail

---

## Edge Cases

### TC-064: Empty State Handling
**Objective**: Verify proper empty states displayed
**Steps**:
1. New user with no trips
2. New lender with no investments
3. No notifications

**Expected Result**:
- Friendly empty state messages
- Call-to-action buttons visible
- No errors or blank pages

**Status**: [ ] Pass [ ] Fail

---

### TC-065: Very Large Numbers
**Objective**: Verify system handles large amounts
**Steps**:
1. Create trip with amount: ₹10,00,00,000 (1 Crore)
2. Calculate interest

**Expected Result**:
- Numbers formatted correctly
- Calculations accurate
- No overflow errors
- Display readable

**Status**: [ ] Pass [ ] Fail

---

### TC-066: Special Characters in Input
**Objective**: Verify system handles special characters
**Steps**:
1. Enter company name with special chars: "ABC & Co., Ltd."
2. Enter description with emojis
3. Submit form

**Expected Result**:
- Special characters accepted
- Data stored correctly
- Display renders properly
- No encoding issues

**Status**: [ ] Pass [ ] Fail

---

## Database Test Cases

### TC-067: Data Persistence
**Objective**: Verify data persists across sessions
**Steps**:
1. Create trip
2. Logout
3. Stop server
4. Restart server
5. Login
6. Check trip exists

**Expected Result**:
- All data preserved
- No data loss
- Database integrity maintained

**Status**: [ ] Pass [ ] Fail

---

### TC-068: Foreign Key Constraints
**Objective**: Verify database relationships maintained
**Steps**:
1. Attempt to delete user with active trips
2. Check cascade behavior

**Expected Result**:
- Referential integrity maintained
- Appropriate error messages
- Data consistency preserved

**Status**: [ ] Pass [ ] Fail

---

## API Test Cases

### TC-069: API Response Format
**Objective**: Verify APIs return correct format
**Steps**:
1. Call GET `/api/notifications/:userId`
2. Verify JSON structure

**Expected Result**:
- Valid JSON returned
- Correct status codes (200, 201, 400, 401, 500)
- Error messages clear
- Response structure consistent

**Status**: [ ] Pass [ ] Fail

---

### TC-070: API Error Handling
**Objective**: Verify APIs handle errors gracefully
**Steps**:
1. Call API with invalid user ID
2. Call API with missing parameters
3. Call protected endpoint without auth

**Expected Result**:
- Appropriate error codes returned
- Error messages descriptive
- No server crashes
- No sensitive data in errors

**Status**: [ ] Pass [ ] Fail

---

## Advanced Authentication Tests

### TC-071: Registration with Duplicate Email
**Objective**: Verify system prevents duplicate email registration
**Prerequisites**: User with email "john@example.com" exists
**Steps**:
1. Navigate to `/signup`
2. Enter email: "john@example.com" (already exists)
3. Fill other fields
4. Click "Create Account"

**Expected Result**:
- Registration fails
- Error message: "Email already registered"
- User remains on signup page
- No duplicate account created

**Status**: [ ] Pass [ ] Fail

---

### TC-072: Registration with Weak Password
**Objective**: Verify password strength validation
**Prerequisites**: None
**Steps**:
1. Navigate to `/signup`
2. Enter password: "123" (too short)
3. Attempt to submit

**Expected Result**:
- Validation error displayed
- Message: "Password must be at least 6 characters"
- Cannot submit form
- Password requirements shown

**Status**: [ ] Pass [ ] Fail

---

### TC-073: Login Session Timeout
**Objective**: Verify session expires after inactivity
**Prerequisites**: User logged in
**Steps**:
1. Login successfully
2. Leave application idle for configured timeout period
3. Attempt to perform an action

**Expected Result**:
- Session expired
- Redirected to login page
- Message: "Session expired, please login again"
- Data not lost (if applicable)

**Status**: [ ] Pass [ ] Fail

---

### TC-074: Multiple Login Sessions
**Objective**: Verify handling of simultaneous logins
**Prerequisites**: User account exists
**Steps**:
1. Login in Browser A
2. Login with same credentials in Browser B
3. Check both sessions

**Expected Result**:
- Both sessions active (or single session based on policy)
- User notified if single session enforced
- Data consistency maintained
- No conflicts

**Status**: [ ] Pass [ ] Fail

---

### TC-075: Password Reset Request
**Objective**: Verify forgot password functionality
**Prerequisites**: User account exists
**Steps**:
1. Navigate to login page
2. Click "Forgot Password"
3. Enter registered email
4. Submit request

**Expected Result**:
- Reset email sent (or token generated)
- Confirmation message displayed
- Reset link/token valid for limited time
- Old password still works until reset

**Status**: [ ] Pass [ ] Fail

---

### TC-076: Login with Email Case Variations
**Objective**: Verify email login is case-insensitive
**Prerequisites**: User registered with "John@Example.com"
**Steps**:
1. Attempt login with "john@example.com" (lowercase)
2. Attempt login with "JOHN@EXAMPLE.COM" (uppercase)

**Expected Result**:
- Both login attempts successful
- Email treated as case-insensitive
- User gets access to same account
- No duplicate sessions

**Status**: [ ] Pass [ ] Fail

---

### TC-077: Account Lockout After Failed Attempts
**Objective**: Verify account security after multiple failed logins
**Prerequisites**: User account exists
**Steps**:
1. Enter wrong password 5 times
2. Check account status
3. Attempt login with correct password

**Expected Result**:
- Account temporarily locked after X failed attempts
- Error message: "Account locked due to multiple failed attempts"
- Lockout duration specified
- Can unlock after time period or via email

**Status**: [ ] Pass [ ] Fail

---

## Advanced Trip Management Tests

### TC-078: Create Trip with Missing Mandatory Fields
**Objective**: Verify validation for required fields
**Prerequisites**: Login as shipper
**Steps**:
1. Click "Create New Trip"
2. Leave origin field empty
3. Fill other fields
4. Click "Create Trip"

**Expected Result**:
- Form validation error
- Red highlight on origin field
- Error message: "Origin is required"
- Trip not created

**Status**: [ ] Pass [ ] Fail

---

### TC-079: Create Trip with Invalid Amount
**Objective**: Verify amount validation
**Prerequisites**: Login as shipper
**Steps**:
1. Create new trip
2. Enter amount: "-5000" (negative)
3. Submit form

**Expected Result**:
- Validation error
- Error message: "Amount must be positive"
- Cannot submit
- Minimum amount requirement shown (if any)

**Status**: [ ] Pass [ ] Fail

---

### TC-080: Create Trip with Zero Interest Rate
**Objective**: Verify handling of zero interest
**Prerequisites**: Login as shipper
**Steps**:
1. Create trip with 0% interest rate
2. Submit form

**Expected Result**:
- Trip created successfully
- Warning shown: "0% interest - no returns for lenders"
- Lenders see trip but warned about no returns
- Calculations handle 0% correctly

**Status**: [ ] Pass [ ] Fail

---

### TC-081: Edit Trip After Receiving Bids
**Objective**: Verify restrictions on editing trip with bids
**Prerequisites**: Login as shipper, trip has pending bids
**Steps**:
1. Navigate to trip with bids
2. Attempt to edit amount or interest rate

**Expected Result**:
- Edit restricted or warning shown
- Message: "Editing will invalidate existing bids"
- Option to proceed with edit and auto-reject bids
- Lenders notified of changes

**Status**: [ ] Pass [ ] Fail

---

### TC-082: Delete Trip with Active Investment
**Objective**: Verify cannot delete funded trip
**Prerequisites**: Login as shipper, trip is funded
**Steps**:
1. Navigate to funded trip
2. Attempt to delete/cancel trip

**Expected Result**:
- Deletion prevented
- Error message: "Cannot delete funded trip"
- Alternative options shown (mark completed, contact support)
- Trip data protected

**Status**: [ ] Pass [ ] Fail

---

### TC-083: Create Trip with Future Start Date
**Objective**: Verify scheduled trip creation
**Prerequisites**: Login as shipper
**Steps**:
1. Create trip with start date 7 days in future
2. Submit form

**Expected Result**:
- Trip created with "Scheduled" status
- Becomes active on start date
- Notifications sent when active
- Calendar/timeline view shows scheduled trips

**Status**: [ ] Pass [ ] Fail

---

### TC-084: Bulk Trip Creation
**Objective**: Verify creating multiple trips at once
**Prerequisites**: Login as shipper
**Steps**:
1. Navigate to bulk create option (if available)
2. Upload CSV with 10 trip records
3. Validate and submit

**Expected Result**:
- All valid trips created
- Invalid records flagged with errors
- Bulk notification sent to lenders
- Summary report shown

**Status**: [ ] Pass [ ] Fail

---

### TC-085: Trip with Very Short Maturity Period
**Objective**: Verify handling of short-term trips
**Prerequisites**: Login as shipper
**Steps**:
1. Create trip with 1 day maturity
2. Check interest calculations

**Expected Result**:
- Trip created successfully
- Daily interest rate calculated correctly
- Lenders see short maturity warning
- ROI annualized correctly

**Status**: [ ] Pass [ ] Fail

---

### TC-086: Trip with Very Long Maturity Period
**Objective**: Verify handling of long-term trips
**Prerequisites**: Login as shipper
**Steps**:
1. Create trip with 365 days maturity
2. Check calculations

**Expected Result**:
- Trip created successfully
- Interest calculated for full year
- Long-term flag shown
- Risk factors for long duration displayed

**Status**: [ ] Pass [ ] Fail

---

## Advanced Bidding Tests

### TC-087: Bid Amount Less Than Trip Amount
**Objective**: Verify partial funding bid handling
**Prerequisites**: Login as lender, trip needs ₹50000
**Steps**:
1. Place bid for ₹30000 (60% of required)
2. Submit bid

**Expected Result**:
- Bid rejected or partial funding enabled
- If allowed: Multiple bids needed to fully fund
- Clear indication of funding percentage
- Shipper sees funding progress

**Status**: [ ] Pass [ ] Fail

---

### TC-088: Bid Amount More Than Trip Amount
**Objective**: Verify overfunding prevention
**Prerequisites**: Login as lender, trip needs ₹50000
**Steps**:
1. Attempt to bid ₹60000
2. Submit bid

**Expected Result**:
- Validation error
- Error message: "Bid cannot exceed trip amount"
- Maximum amount shown
- Cannot submit bid

**Status**: [ ] Pass [ ] Fail

---

### TC-089: Bid with Negative Interest Rate
**Objective**: Verify interest rate validation
**Prerequisites**: Login as lender
**Steps**:
1. Place bid with -5% interest rate
2. Submit bid

**Expected Result**:
- Validation error
- Error message: "Interest rate must be positive"
- Cannot submit bid
- Valid range shown

**Status**: [ ] Pass [ ] Fail

---

### TC-090: Bid on Own Trip
**Objective**: Verify shipper cannot bid on their own trip
**Prerequisites**: Login as user who is both shipper and lender
**Steps**:
1. Create trip as shipper
2. Attempt to bid on it as lender

**Expected Result**:
- Bid prevented
- Error message: "Cannot bid on your own trip"
- Bid button disabled
- Clear indication of ownership

**Status**: [ ] Pass [ ] Fail

---

### TC-091: Multiple Bids from Same Lender on Same Trip
**Objective**: Verify handling of duplicate bids
**Prerequisites**: Login as lender, already bid on trip
**Steps**:
1. Place bid on Trip A
2. Attempt to place another bid on same Trip A

**Expected Result**:
- Second bid replaces first (or)
- Error: "You already have a pending bid on this trip"
- Option to edit existing bid
- No duplicate bids created

**Status**: [ ] Pass [ ] Fail

---

### TC-092: Bid on Expired Trip
**Objective**: Verify cannot bid on expired opportunity
**Prerequisites**: Trip maturity date passed
**Steps**:
1. Navigate to expired trip
2. Attempt to place bid

**Expected Result**:
- Bid button disabled
- Status shown as "Expired"
- Message: "This opportunity is no longer available"
- Trip removed from active opportunities

**Status**: [ ] Pass [ ] Fail

---

### TC-093: Bid Expiration
**Objective**: Verify bids expire after set time
**Prerequisites**: Login as lender, placed bid 30 days ago
**Steps**:
1. View old pending bid
2. Check bid status

**Expected Result**:
- Bid expired if configured
- Status changed to "Expired"
- Lender notified
- Can place new bid

**Status**: [ ] Pass [ ] Fail

---

### TC-094: Competitive Bidding Notification
**Objective**: Verify lenders notified of competing bids
**Prerequisites**: Multiple lenders, one trip
**Steps**:
1. Lender A bids ₹50000 at 12%
2. Lender B places competing bid ₹50000 at 10%
3. Check Lender A notifications

**Expected Result**:
- Lender A notified of competing bid (optional feature)
- Option to improve offer
- Current best offer indicated
- Competitive environment displayed

**Status**: [ ] Pass [ ] Fail

---

## Advanced Notification Tests

### TC-095: Notification for Bid Acceptance
**Objective**: Verify lender notified when bid accepted
**Prerequisites**: Lender has pending bid
**Steps**:
1. Shipper accepts lender's bid
2. Check lender notifications

**Expected Result**:
- Notification received: "Your bid has been accepted!"
- Investment details included
- Link to investment details page
- Priority: High

**Status**: [ ] Pass [ ] Fail

---

### TC-096: Notification for Bid Rejection
**Objective**: Verify lender notified when bid rejected
**Prerequisites**: Lender has pending bid
**Steps**:
1. Shipper rejects lender's bid
2. Check lender notifications

**Expected Result**:
- Notification received: "Your bid was not accepted"
- Reason provided (if given)
- Link to other opportunities
- Priority: Medium

**Status**: [ ] Pass [ ] Fail

---

### TC-097: Notification for Trip Completion
**Objective**: Verify lender notified on trip completion
**Prerequisites**: Lender has active investment
**Steps**:
1. Shipper marks trip as completed
2. Check lender notifications

**Expected Result**:
- Notification: "Trip completed - returns processed"
- Final return amount shown
- Link to payment details
- Priority: High

**Status**: [ ] Pass [ ] Fail

---

### TC-098: Notification for Trip Cancellation
**Objective**: Verify notifications sent when trip cancelled
**Prerequisites**: Multiple lenders bid on trip
**Steps**:
1. Shipper cancels trip
2. Check all lenders' notifications

**Expected Result**:
- All bidders notified
- Message: "Trip has been cancelled"
- Reason provided (if given)
- Bids automatically withdrawn

**Status**: [ ] Pass [ ] Fail

---

### TC-099: Notification for Payment Received
**Objective**: Verify lender notified of payment
**Prerequisites**: Trip completed, payment processed
**Steps**:
1. Payment credited to lender
2. Check notifications

**Expected Result**:
- Notification: "Payment received"
- Amount details shown
- Transaction reference included
- Link to transaction history

**Status**: [ ] Pass [ ] Fail

---

### TC-100: Notification for KYC Approval
**Objective**: Verify user notified when KYC approved
**Prerequisites**: User submitted KYC documents
**Steps**:
1. Super admin approves KYC
2. Check user notifications

**Expected Result**:
- Notification: "KYC verified successfully"
- Account features unlocked
- Congratulatory message
- Next steps provided

**Status**: [ ] Pass [ ] Fail

---

### TC-101: Notification for KYC Rejection
**Objective**: Verify user notified when KYC rejected
**Prerequisites**: User submitted KYC documents
**Steps**:
1. Super admin rejects KYC with reason
2. Check user notifications

**Expected Result**:
- Notification: "KYC verification failed"
- Reason clearly stated
- Instructions for resubmission
- Link to upload documents

**Status**: [ ] Pass [ ] Fail

---

### TC-102: Notification Grouping
**Objective**: Verify similar notifications grouped
**Prerequisites**: Multiple similar notifications
**Steps**:
1. Create 5 trips (5 notifications to each lender)
2. Check lender notification display

**Expected Result**:
- Notifications grouped: "5 new investment opportunities"
- Can expand to see individual items
- Reduces notification clutter
- Group actions available (mark all read)

**Status**: [ ] Pass [ ] Fail

---

### TC-103: Notification Sound/Alert (Browser)
**Objective**: Verify browser notifications work
**Prerequisites**: User granted notification permission
**Steps**:
1. Keep app open in browser
2. Trigger notification (new trip)
3. Check browser notification

**Expected Result**:
- Browser notification appears
- Sound plays (if enabled)
- Desktop alert shows (if supported)
- Click opens app to relevant page

**Status**: [ ] Pass [ ] Fail

---

### TC-104: Email Notification
**Objective**: Verify critical notifications sent via email
**Prerequisites**: User email configured
**Steps**:
1. Trigger high-priority notification (bid accepted)
2. Check user's email inbox

**Expected Result**:
- Email received within 5 minutes
- Subject clear and descriptive
- HTML email well-formatted
- Links work correctly
- Unsubscribe option available

**Status**: [ ] Pass [ ] Fail

---

### TC-105: Notification Preferences
**Objective**: Verify user can customize notification settings
**Prerequisites**: Login as user
**Steps**:
1. Navigate to notification settings
2. Disable "Investment Opportunity" notifications
3. Create new trip
4. Check if notification sent

**Expected Result**:
- Notification settings saved
- Disabled notification types not sent
- In-app vs email preferences separate
- Changes apply immediately

**Status**: [ ] Pass [ ] Fail

---

## Data Validation Tests

### TC-106: Phone Number Format Validation
**Objective**: Verify phone number validation
**Prerequisites**: Registration or profile update
**Steps**:
1. Enter invalid phone: "123"
2. Enter valid phone: "+91 9876543210"
3. Submit

**Expected Result**:
- Invalid format rejected
- Valid formats accepted
- Country code handling
- Format hints shown

**Status**: [ ] Pass [ ] Fail

---

### TC-107: Email Format Validation
**Objective**: Verify email format validation
**Prerequisites**: Registration
**Steps**:
1. Enter invalid email: "notanemail"
2. Enter invalid: "test@"
3. Enter valid: "test@example.com"

**Expected Result**:
- Invalid formats rejected
- Clear error messages
- Valid format accepted
- Real-time validation feedback

**Status**: [ ] Pass [ ] Fail

---

### TC-108: Date Range Validation
**Objective**: Verify date range validation in reports
**Prerequisites**: Login as user with report access
**Steps**:
1. Select start date: 2025-01-15
2. Select end date: 2025-01-10 (before start)
3. Generate report

**Expected Result**:
- Validation error
- Error: "End date must be after start date"
- Cannot generate report
- Dates auto-corrected or highlighted

**Status**: [ ] Pass [ ] Fail

---

### TC-109: Distance Validation
**Objective**: Verify distance field validation
**Prerequisites**: Creating trip
**Steps**:
1. Enter distance: "-100" km
2. Enter distance: "0" km
3. Enter distance: "10000" km

**Expected Result**:
- Negative rejected
- Zero rejected or warned
- Reasonable maximum enforced
- Validation messages clear

**Status**: [ ] Pass [ ] Fail

---

### TC-110: Interest Rate Boundaries
**Objective**: Verify interest rate limits
**Prerequisites**: Creating trip
**Steps**:
1. Enter 0% interest
2. Enter 100% interest
3. Enter 500% interest

**Expected Result**:
- 0% allowed with warning
- High rates warned or capped
- Maximum reasonable rate enforced
- Industry standards referenced

**Status**: [ ] Pass [ ] Fail

---

## Financial Calculation Tests

### TC-111: Simple Interest Calculation Accuracy
**Objective**: Verify interest calculations are accurate
**Prerequisites**: None
**Steps**:
1. Create trip: ₹100,000, 12% interest, 30 days
2. Calculate expected interest: 100000 × 12% × 30/365 = ₹986.30
3. Check system calculation

**Expected Result**:
- System shows ₹986.30
- Total return: ₹100,986.30
- Calculations match exactly
- Rounding handled correctly (2 decimal places)

**Status**: [ ] Pass [ ] Fail

---

### TC-112: Compound Interest Calculation (If Applicable)
**Objective**: Verify compound interest calculation
**Prerequisites**: System supports compound interest
**Steps**:
1. Create investment with compound interest
2. Verify calculations against formula

**Expected Result**:
- Compound interest calculated correctly
- Formula A = P(1 + r/n)^(nt) applied
- More returns than simple interest
- Compounding period clearly stated

**Status**: [ ] Pass [ ] Fail

---

### TC-113: Annualized Return Rate (ARR) Calculation
**Objective**: Verify ARR displayed correctly
**Prerequisites**: Viewing trip details
**Steps**:
1. View trip: 12% interest, 30 days maturity
2. Calculate ARR: 12% × 365/30 = 146% ARR
3. Check system display

**Expected Result**:
- System shows 146% ARR
- Tooltip explains calculation
- Helps compare investments
- Industry standard format

**Status**: [ ] Pass [ ] Fail

---

### TC-114: Leap Year Interest Calculation
**Objective**: Verify interest calculations in leap year
**Prerequisites**: Testing during leap year
**Steps**:
1. Create investment during leap year
2. Check if 366 days used instead of 365

**Expected Result**:
- System uses correct days in year
- Slightly lower daily rate in leap year
- Accurate calculations
- Documentation mentions leap year handling

**Status**: [ ] Pass [ ] Fail

---

### TC-115: Partial Month Interest Calculation
**Objective**: Verify pro-rata interest for partial months
**Prerequisites**: Trip completed early
**Steps**:
1. Create 30-day trip
2. Complete after 20 days
3. Check interest calculation

**Expected Result**:
- Interest calculated for 20 days only
- Pro-rata calculation accurate
- Lender sees adjusted returns
- Clear explanation provided

**Status**: [ ] Pass [ ] Fail

---

### TC-116: Currency Formatting
**Objective**: Verify amounts displayed correctly
**Prerequisites**: Various amount fields
**Steps**:
1. Check ₹50,000 displayed as "₹50,000" or "₹50K"
2. Check ₹10,00,000 displayed as "₹10,00,000" or "₹10L"
3. Check decimal handling: ₹50,000.50

**Expected Result**:
- Indian numbering system (lakhs, crores)
- Comma placement correct
- Decimals shown when needed
- Consistent formatting throughout

**Status**: [ ] Pass [ ] Fail

---

### TC-117: Tax Calculation (If Applicable)
**Objective**: Verify TDS or tax calculations
**Prerequisites**: Tax feature enabled
**Steps**:
1. Complete investment with returns
2. Check if TDS deducted
3. Verify net payment

**Expected Result**:
- TDS calculated at applicable rate
- Gross and net amounts shown
- Tax certificate generated
- Compliant with regulations

**Status**: [ ] Pass [ ] Fail

---

## Search and Filter Tests

### TC-118: Search Trips by Origin
**Objective**: Verify trip search by origin city
**Prerequisites**: Multiple trips exist
**Steps**:
1. Navigate to investment opportunities
2. Search: "Delhi"
3. View results

**Expected Result**:
- Only trips from Delhi shown
- Case-insensitive search
- Partial matches included
- Result count displayed

**Status**: [ ] Pass [ ] Fail

---

### TC-119: Search Trips by Destination
**Objective**: Verify trip search by destination
**Prerequisites**: Multiple trips exist
**Steps**:
1. Search: "Mumbai"
2. View results

**Expected Result**:
- Only trips to Mumbai shown
- Accurate filtering
- Fast search performance
- Clear indication of filter applied

**Status**: [ ] Pass [ ] Fail

---

### TC-120: Filter by Multiple Criteria
**Objective**: Verify combined filters work
**Prerequisites**: Many trips available
**Steps**:
1. Filter: Risk Level = "Low"
2. Filter: Amount Range = "20000-50000"
3. Filter: Interest Rate = "10-15%"
4. Apply all filters

**Expected Result**:
- All filters applied together (AND logic)
- Results match all criteria
- No trips outside criteria shown
- Filter combination explained

**Status**: [ ] Pass [ ] Fail

---

### TC-121: Sort Investment Opportunities
**Objective**: Verify sorting functionality
**Prerequisites**: Investment opportunities page
**Steps**:
1. Sort by "Interest Rate - High to Low"
2. Sort by "Amount - Low to High"
3. Sort by "Maturity - Shortest First"

**Expected Result**:
- Sorting works correctly
- Order changes as expected
- Sort indicator shown
- Sort persists during session

**Status**: [ ] Pass [ ] Fail

---

### TC-122: Search with No Results
**Objective**: Verify handling of empty search results
**Prerequisites**: Search feature
**Steps**:
1. Search for non-existent city: "Atlantis"
2. View results

**Expected Result**:
- Empty state displayed
- Message: "No trips found matching your search"
- Suggestions to broaden search
- Clear filters option

**Status**: [ ] Pass [ ] Fail

---

### TC-123: Search Performance with Large Dataset
**Objective**: Verify search performs well with many records
**Prerequisites**: 1000+ trips in database
**Steps**:
1. Perform search
2. Measure response time

**Expected Result**:
- Results returned < 1 second
- Pagination implemented
- Database queries optimized
- No UI freezing

**Status**: [ ] Pass [ ] Fail

---

## Pagination Tests

### TC-124: Navigate Through Pages
**Objective**: Verify pagination works correctly
**Prerequisites**: More than 20 trips (assuming 20 per page)
**Steps**:
1. View investment opportunities
2. Click "Next Page"
3. Click "Previous Page"
4. Jump to page 3

**Expected Result**:
- Page navigation smooth
- Correct items shown per page
- Current page highlighted
- Total pages displayed

**Status**: [ ] Pass [ ] Fail

---

### TC-125: Change Items Per Page
**Objective**: Verify items per page selector
**Prerequisites**: Pagination available
**Steps**:
1. Select "50 items per page"
2. Select "100 items per page"

**Expected Result**:
- Display updates correctly
- More items shown
- Page count adjusts
- Performance acceptable

**Status**: [ ] Pass [ ] Fail

---

### TC-126: Last Page Partial Results
**Objective**: Verify last page shows correct count
**Prerequisites**: 45 total items, 20 per page
**Steps**:
1. Navigate to page 3 (last page)

**Expected Result**:
- Page 3 shows 5 items
- No blank spaces
- Pagination indicates last page
- "Next" button disabled

**Status**: [ ] Pass [ ] Fail

---

## File Upload Tests

### TC-127: Upload Valid KYC Document
**Objective**: Verify document upload works
**Prerequisites**: Login as user
**Steps**:
1. Navigate to KYC section
2. Select PDF file (2 MB)
3. Upload

**Expected Result**:
- File uploads successfully
- Progress bar shown
- Success message displayed
- Preview available

**Status**: [ ] Pass [ ] Fail

---

### TC-128: Upload File Too Large
**Objective**: Verify file size limits enforced
**Prerequisites**: Login as user
**Steps**:
1. Attempt to upload 15 MB file
2. Check validation

**Expected Result**:
- Upload rejected
- Error: "File size exceeds 10 MB limit"
- Maximum size clearly stated
- No partial upload

**Status**: [ ] Pass [ ] Fail

---

### TC-129: Upload Invalid File Type
**Objective**: Verify file type validation
**Prerequisites**: KYC document upload
**Steps**:
1. Attempt to upload .exe file
2. Attempt to upload .mp3 file

**Expected Result**:
- Upload rejected
- Error: "Invalid file type"
- Accepted types listed (PDF, JPG, PNG)
- Security maintained

**Status**: [ ] Pass [ ] Fail

---

### TC-130: Upload Multiple Documents
**Objective**: Verify multiple file upload
**Prerequisites**: KYC requires multiple documents
**Steps**:
1. Select 4 documents
2. Upload all at once

**Expected Result**:
- All files uploaded
- Individual progress for each
- Can remove individual files
- All or nothing upload (optional)

**Status**: [ ] Pass [ ] Fail

---

### TC-131: Replace Uploaded Document
**Objective**: Verify can replace previously uploaded file
**Prerequisites**: Document already uploaded
**Steps**:
1. Upload new version of document
2. Confirm replacement

**Expected Result**:
- Old file replaced
- New file stored
- Version history maintained (optional)
- Confirmation required

**Status**: [ ] Pass [ ] Fail

---

## Export and Print Tests

### TC-132: Export Report to PDF
**Objective**: Verify PDF export functionality
**Prerequisites**: Report generated
**Steps**:
1. Generate investment report
2. Click "Export to PDF"
3. Check downloaded file

**Expected Result**:
- PDF downloaded
- Content matches screen display
- Formatting preserved
- File opens correctly

**Status**: [ ] Pass [ ] Fail

---

### TC-133: Export Report to Excel
**Objective**: Verify Excel export
**Prerequisites**: Report generated
**Steps**:
1. Generate trip report
2. Click "Export to Excel"
3. Open in Excel

**Expected Result**:
- Excel file downloaded
- Data in proper columns
- Formulas working (if any)
- Formatting reasonable

**Status**: [ ] Pass [ ] Fail

---

### TC-134: Print Trip Details
**Objective**: Verify print functionality
**Prerequisites**: Viewing trip details
**Steps**:
1. Click "Print" button
2. Check print preview

**Expected Result**:
- Print-friendly format
- No navigation elements
- Content fits page
- Headers/footers appropriate

**Status**: [ ] Pass [ ] Fail

---

### TC-135: Export Notification History
**Objective**: Verify can export notification history
**Prerequisites**: User has notifications
**Steps**:
1. Navigate to notifications
2. Click "Export History"

**Expected Result**:
- CSV or PDF generated
- All notifications included
- Timestamps accurate
- Readable format

**Status**: [ ] Pass [ ] Fail

---

## Dashboard Widget Tests

### TC-136: Dashboard Auto-Refresh
**Objective**: Verify dashboard data refreshes
**Prerequisites**: Dashboard open
**Steps**:
1. Note current statistics
2. Create new trip in another tab
3. Wait 1 minute
4. Check if dashboard updated

**Expected Result**:
- Statistics updated automatically
- No page refresh needed
- Smooth transition
- Timestamp of last update shown

**Status**: [ ] Pass [ ] Fail

---

### TC-137: Dashboard Chart Interactions
**Objective**: Verify chart interactivity
**Prerequisites**: Dashboard with charts
**Steps**:
1. Hover over chart elements
2. Click on data points
3. Use chart legends

**Expected Result**:
- Tooltips show on hover
- Click reveals details
- Legends toggle data series
- Responsive and smooth

**Status**: [ ] Pass [ ] Fail

---

### TC-138: Dashboard Date Range Selector
**Objective**: Verify dashboard date filtering
**Prerequisites**: Super admin dashboard
**Steps**:
1. Select "Last 7 Days"
2. Select "Last 30 Days"
3. Select "Custom Range"

**Expected Result**:
- Data filters correctly
- Charts update
- Statistics recalculate
- Date range clearly displayed

**Status**: [ ] Pass [ ] Fail

---

### TC-139: Dashboard Empty State (New User)
**Objective**: Verify dashboard for new user
**Prerequisites**: Brand new user account
**Steps**:
1. Login as new user
2. View dashboard

**Expected Result**:
- Welcome message displayed
- Onboarding tips shown
- Call-to-action buttons
- No errors for empty data

**Status**: [ ] Pass [ ] Fail

---

## Accessibility Tests

### TC-140: Keyboard Navigation
**Objective**: Verify app usable with keyboard only
**Prerequisites**: None
**Steps**:
1. Tab through login form
2. Navigate dashboard with arrow keys
3. Use Enter to click buttons

**Expected Result**:
- All elements reachable
- Focus indicators visible
- Logical tab order
- No keyboard traps

**Status**: [ ] Pass [ ] Fail

---

### TC-141: Screen Reader Compatibility
**Objective**: Verify screen reader support
**Prerequisites**: Screen reader software
**Steps**:
1. Navigate app with screen reader
2. Check form labels
3. Check image alt text

**Expected Result**:
- All elements announced properly
- Labels associated with inputs
- Images have alt text
- ARIA attributes correct

**Status**: [ ] Pass [ ] Fail

---

### TC-142: Color Contrast
**Objective**: Verify sufficient color contrast
**Prerequisites**: Accessibility testing tool
**Steps**:
1. Check text on backgrounds
2. Verify button colors
3. Check link visibility

**Expected Result**:
- WCAG AA compliance minimum
- Text readable
- Links distinguishable
- No reliance on color alone

**Status**: [ ] Pass [ ] Fail

---

### TC-143: Text Scaling
**Objective**: Verify app works with large text
**Prerequisites**: Browser or system
**Steps**:
1. Increase browser zoom to 200%
2. Increase system font size
3. Navigate app

**Expected Result**:
- Layout adapts
- No text cut off
- Functionality maintained
- Horizontal scroll minimal

**Status**: [ ] Pass [ ] Fail

---

### TC-144: Form Error Announcements
**Objective**: Verify errors announced to screen readers
**Prerequisites**: Screen reader
**Steps**:
1. Submit form with errors
2. Check error announcement

**Expected Result**:
- Errors announced immediately
- Clear error messages
- Focus moved to first error
- ARIA live regions used

**Status**: [ ] Pass [ ] Fail

---

## Localization Tests (If Applicable)

### TC-145: Language Switch
**Objective**: Verify language switching
**Prerequisites**: Multi-language support
**Steps**:
1. Switch from English to Hindi
2. Navigate app

**Expected Result**:
- UI text changes to Hindi
- Formatting appropriate
- All text translated
- Language persists

**Status**: [ ] Pass [ ] Fail

---

### TC-146: Currency Localization
**Objective**: Verify currency formatting
**Prerequisites**: Indian locale
**Steps**:
1. View amounts in various places

**Expected Result**:
- ₹ symbol used consistently
- Indian numbering (lakhs, crores)
- Decimal separator correct
- Thousands separator correct

**Status**: [ ] Pass [ ] Fail

---

### TC-147: Date Format Localization
**Objective**: Verify date formatting
**Prerequisites**: Date fields throughout app
**Steps**:
1. Check date displays

**Expected Result**:
- DD/MM/YYYY format (or configured)
- Consistent throughout app
- Locale-appropriate
- Timezone handled correctly

**Status**: [ ] Pass [ ] Fail

---

## Concurrency Tests

### TC-148: Simultaneous Trip Creation
**Objective**: Verify handling of concurrent trip creation
**Prerequisites**: Multiple shippers
**Steps**:
1. Shipper A creates trip at same moment
2. Shipper B creates trip at same moment
3. Check both trips

**Expected Result**:
- Both trips created successfully
- Unique IDs generated
- No data corruption
- Both lenders notified

**Status**: [ ] Pass [ ] Fail

---

### TC-149: Concurrent Bid Acceptance
**Objective**: Verify only one bid accepted
**Prerequisites**: Multiple bids on trip
**Steps**:
1. Shipper attempts to accept two bids simultaneously

**Expected Result**:
- Only first acceptance processed
- Second fails with error
- Data consistency maintained
- Proper locking mechanism

**Status**: [ ] Pass [ ] Fail

---

### TC-150: Concurrent Notification Marking
**Objective**: Verify race condition handling
**Prerequisites**: User with notifications
**Steps**:
1. Click "Mark All Read" in Browser A
2. Delete notification in Browser B simultaneously

**Expected Result**:
- Operations handled gracefully
- No errors thrown
- Final state consistent
- No duplicate updates

**Status**: [ ] Pass [ ] Fail

---

## Offline/Network Tests

### TC-151: Offline Mode Detection
**Objective**: Verify app detects offline state
**Prerequisites**: App running
**Steps**:
1. Disconnect internet
2. Attempt action

**Expected Result**:
- Offline indicator shown
- Error message: "No internet connection"
- Actions queued or blocked
- Reconnect detected automatically

**Status**: [ ] Pass [ ] Fail

---

### TC-152: Slow Network Performance
**Objective**: Verify app works on slow connection
**Prerequisites**: Network throttling
**Steps**:
1. Throttle to 3G speed
2. Navigate app

**Expected Result**:
- Loading indicators shown
- Reasonable timeouts
- Progressive loading
- No broken functionality

**Status**: [ ] Pass [ ] Fail

---

### TC-153: Request Timeout Handling
**Objective**: Verify timeout errors handled
**Prerequisites**: Simulate server delay
**Steps**:
1. Make API request
2. Simulate 30-second delay

**Expected Result**:
- Request times out gracefully
- Error message shown
- Retry option available
- No infinite loading

**Status**: [ ] Pass [ ] Fail

---

### TC-154: Network Reconnection
**Objective**: Verify app resumes after reconnection
**Prerequisites**: App in use
**Steps**:
1. Disconnect network mid-operation
2. Reconnect after 1 minute
3. Continue using app

**Expected Result**:
- Connection restored automatically
- Pending operations resume
- Data sync occurs
- User notified of reconnection

**Status**: [ ] Pass [ ] Fail

---

## Data Import/Export Tests

### TC-155: Bulk User Import
**Objective**: Verify admin can import users (if feature exists)
**Prerequisites**: Super admin access
**Steps**:
1. Prepare CSV with 100 user records
2. Upload via bulk import
3. Validate

**Expected Result**:
- Valid users imported
- Invalid records flagged
- Duplicate detection
- Import summary report

**Status**: [ ] Pass [ ] Fail

---

### TC-156: Export All Trips Data
**Objective**: Verify can export complete trip data
**Prerequisites**: Super admin access
**Steps**:
1. Navigate to data export
2. Select "All Trips"
3. Export

**Expected Result**:
- Complete data exported
- All fields included
- Format is standard (CSV/JSON)
- Large dataset handled

**Status**: [ ] Pass [ ] Fail

---

### TC-157: Backup Data Download
**Objective**: Verify database backup feature
**Prerequisites**: Super admin access
**Steps**:
1. Request database backup
2. Download

**Expected Result**:
- Backup created successfully
- Encrypted or secured
- Complete data included
- Can be restored

**Status**: [ ] Pass [ ] Fail

---

## Compliance and Legal Tests

### TC-158: Terms and Conditions Acceptance
**Objective**: Verify T&C must be accepted
**Prerequisites**: New registration
**Steps**:
1. Fill registration form
2. Leave T&C unchecked
3. Submit

**Expected Result**:
- Registration blocked
- Error: "You must accept terms and conditions"
- T&C easily accessible
- Version tracking

**Status**: [ ] Pass [ ] Fail

---

### TC-159: Privacy Policy Display
**Objective**: Verify privacy policy accessible
**Prerequisites**: None
**Steps**:
1. Find privacy policy link
2. View policy

**Expected Result**:
- Link in footer
- Policy comprehensive
- Last updated date shown
- GDPR compliant (if applicable)

**Status**: [ ] Pass [ ] Fail

---

### TC-160: Data Deletion Request
**Objective**: Verify user can request account deletion
**Prerequisites**: User account
**Steps**:
1. Navigate to account settings
2. Request account deletion
3. Confirm

**Expected Result**:
- Deletion request submitted
- Confirmation required
- Grace period provided
- Data deleted per policy

**Status**: [ ] Pass [ ] Fail

---

## Test Summary

**Total Test Cases**: 160
**Passed**: ___
**Failed**: ___
**Blocked**: ___
**Not Executed**: ___

**Test Coverage**:
- Authentication: 12 test cases (TC-001 to TC-005, TC-071 to TC-077)
- Super Admin: 4 test cases (TC-006 to TC-009)
- Shipper Dashboard: 7 test cases (TC-010 to TC-016)
- Lender Dashboard: 6 test cases (TC-017 to TC-022)
- Investment Opportunities: 3 test cases (TC-023 to TC-025)
- Trip Management: 12 test cases (TC-026 to TC-028, TC-078 to TC-086)
- Bidding System: 12 test cases (TC-029 to TC-032, TC-087 to TC-094)
- Notification System: 20 test cases (TC-033 to TC-042, TC-095 to TC-105)
- KYC Verification: 3 test cases (TC-043 to TC-045)
- Reports & Analytics: 3 test cases (TC-046 to TC-048)
- Profile Management: 2 test cases (TC-049 to TC-050)
- Integration Tests: 2 test cases (TC-051 to TC-052)
- Performance Tests: 2 test cases (TC-053 to TC-054)
- Security Tests: 3 test cases (TC-055 to TC-057)
- Browser Compatibility: 4 test cases (TC-058 to TC-061)
- Mobile Responsiveness: 2 test cases (TC-062 to TC-063)
- Edge Cases: 3 test cases (TC-064 to TC-066)
- Database Tests: 2 test cases (TC-067 to TC-068)
- API Tests: 2 test cases (TC-069 to TC-070)
- Data Validation: 5 test cases (TC-106 to TC-110)
- Financial Calculations: 7 test cases (TC-111 to TC-117)
- Search and Filters: 6 test cases (TC-118 to TC-123)
- Pagination: 3 test cases (TC-124 to TC-126)
- File Upload: 5 test cases (TC-127 to TC-131)
- Export/Print: 4 test cases (TC-132 to TC-135)
- Dashboard Widgets: 4 test cases (TC-136 to TC-139)
- Accessibility: 5 test cases (TC-140 to TC-144)
- Localization: 3 test cases (TC-145 to TC-147)
- Concurrency: 3 test cases (TC-148 to TC-150)
- Network/Offline: 4 test cases (TC-151 to TC-154)
- Data Import/Export: 3 test cases (TC-155 to TC-157)
- Compliance/Legal: 3 test cases (TC-158 to TC-160)

---

## Notes for Testers

1. **Test Environment**: Ensure clean database before starting test suite
2. **Test Data**: Use consistent test data across test cases
3. **Screenshots**: Capture screenshots for failed test cases
4. **Logs**: Check browser console and server logs for errors
5. **Timing**: Some tests require waiting for polling intervals (30 seconds for notifications)
6. **Cleanup**: Clear test data after completing test suite

## Bug Report Template

When reporting bugs, include:
- Test Case ID
- Steps to reproduce
- Expected result
- Actual result
- Screenshots/videos
- Browser/device information
- Server logs (if applicable)
- Severity (Critical/High/Medium/Low)

---

**Document Version**: 1.0
**Last Updated**: October 13, 2025
**Prepared By**: Test Team
**Application**: Truck-Fin-Hub
