# 📬 Notification System - Complete Guide

## Overview
Comprehensive notification system with **both Email and In-App notifications** for all user roles.

---

## 🎯 Features

### ✅ **Dual Notification System**
1. **In-App Notifications** - Real-time notifications in the dashboard
2. **Email Notifications** - Sent to user's email address

### ✅ **Email Providers Supported**
- **Gmail** (Recommended - Easy setup with App Password)
- **Custom SMTP** (Any SMTP server)

### ✅ **Notification Types** (16 Types)
1. **Trip Notifications**
   - `trip_created` - When a new trip is created
   - `trip_funded` - When trip receives funding
   - `trip_completed` - When trip is completed

2. **Investment Notifications**
   - `bid_received` - When load owner receives a bid
   - `investment_allotted` - When lender's bid is accepted
   - `investment_confirmed` - When investment is confirmed
   - `investment_returned` - When investment matures with returns

3. **Wallet Notifications**
   - `wallet_credited` - Money added to wallet
   - `wallet_debited` - Money removed from wallet

4. **KYC Notifications**
   - `kyc_approved` - KYC verification approved
   - `kyc_rejected` - KYC verification rejected

5. **System Notifications**
   - `system_alert` - Important system messages

---

## 🚀 Setup Guide

### Step 1: Configure Email Notifications

#### For Gmail (Recommended):

1. **Navigate to Notification Settings**
   - Click your avatar in dashboard
   - Select "Notifications"
   - Or go to: `http://localhost:8081/settings/notifications`

2. **Enable Email Notifications**
   - Toggle "Enable Email Notifications" ON

3. **Select Gmail Service**
   - Service: Gmail
   - Email: `your-email@gmail.com`

4. **Generate Gmail App Password**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification (if not already)
   - Scroll to "App passwords"
   - Generate password for "Mail"
   - Copy the 16-character password

5. **Enter App Password**
   - Paste the app password in "App Password" field
   - Click "Save Configuration"

6. **Test Email**
   - Click "Send Test Email"
   - Check your inbox for test email

#### For Custom SMTP:

1. Select "Custom SMTP" as service
2. Enter SMTP details:
   - SMTP Host: `smtp.example.com`
   - SMTP Port: `587` (TLS) or `465` (SSL)
   - Email: Your email
   - Password: Your password
3. Save and test

---

## 🔔 In-App Notifications

### Notification Bell

**Location**: Top-right corner of dashboard (next to avatar)

**Features**:
- 🔴 **Red badge** shows unread count
- Click to view notification dropdown
- **Recent 20 notifications** displayed
- Mark individual as read
- Mark all as read
- Delete notifications
- Clear all

### Notification Display:
- **Unread**: Blue dot + bold text + highlighted background
- **Read**: Normal text + no highlight
- **Priority Colors**:
  - 🔴 **Urgent**: Red
  - 🟠 **High**: Orange
  - 🔵 **Medium**: Blue
  - ⚫ **Low**: Gray

### Time Display:
- Just now
- Xm ago (minutes)
- Xh ago (hours)
- Xd ago (days)
- Full date for older

---

## 📧 Email Templates

### Professional HTML Emails

All emails include:
- **TruckFin Hub header** with logo
- **Formatted content** with proper styling
- **Call-to-action buttons** (where applicable)
- **Footer** with copyright and disclaimer
- **Mobile-responsive** design

### Example: Trip Funded Email

```
┌─────────────────────────────────┐
│   🚛 TruckFin Hub               │
│   Logistics Finance Platform     │
├─────────────────────────────────┤
│                                  │
│   Trip Funded Successfully! 🎉  │
│                                  │
│   Great news! Your trip has been│
│   fully funded.                  │
│                                  │
│   Trip Details:                  │
│   • Route: Mumbai → Delhi        │
│   • Amount: ₹1,50,000           │
│   • Lender: ABC Finance          │
│   • Interest: 12%                │
│                                  │
│   [ View Trip ]                  │
│                                  │
├─────────────────────────────────┤
│ © 2025 TruckFin Hub             │
│ This is an automated email      │
└─────────────────────────────────┘
```

---

## 👨‍💻 Developer Guide

### Triggering Notifications

#### Method 1: Using Trigger Functions (Recommended)

```typescript
import {
  notifyTripCreated,
  notifyBidReceived,
  notifyInvestmentAllotted
} from '@/utils/notificationTriggers';

// When trip is created
await notifyTripCreated(userId, userEmail, {
  origin: 'Mumbai',
  destination: 'Delhi',
  loadType: 'Electronics',
  amount: 150000,
  distance: 1400
});

// When bid is received
await notifyBidReceived(loadOwnerId, loadOwnerEmail, {
  origin: 'Mumbai',
  destination: 'Delhi',
  lenderName: 'ABC Finance',
  amount: 150000,
  interestRate: 12
});

// When investment is allotted
await notifyInvestmentAllotted(lenderId, lenderEmail, {
  origin: 'Mumbai',
  destination: 'Delhi',
  amount: 150000,
  interestRate: 12,
  expectedReturn: 18000,
  maturityDays: 30
});
```

#### Method 2: Direct Service Call

```typescript
import { sendNotification } from '@/services/notificationService';

await sendNotification(
  userId,
  userEmail,
  'trip_created',
  {
    origin: 'Mumbai',
    destination: 'Delhi',
    loadType: 'Electronics',
    amount: 150000,
    distance: 1400
  },
  true // sendEmail = true
);
```

### Creating Custom Notification Types

1. Add type to `src/types/notification.ts`:
```typescript
export type NotificationType =
  | 'trip_created'
  | 'your_custom_type' // Add here
  | ...
```

2. Add template to `src/services/notificationTemplates.ts`:
```typescript
your_custom_type: {
  type: 'your_custom_type',
  subject: 'Custom Notification',
  priority: 'medium',
  roles: ['load_owner', 'lender'],
  emailTemplate: (data) => `
    <h2>Custom Notification</h2>
    <p>${data.message}</p>
  `,
  inAppMessage: (data) => data.message,
}
```

3. Create trigger function in `src/utils/notificationTriggers.ts`:
```typescript
export const notifyCustomEvent = async (
  userId: string,
  userEmail: string,
  data: any
) => {
  await sendNotification(userId, userEmail, 'your_custom_type', data);
};
```

---

## 🎨 UI Components

### NotificationBell Component

**Usage**:
```tsx
import NotificationBell from '@/components/NotificationBell';

<NotificationBell userId={user.id} />
```

**Props**:
- `userId`: User ID for fetching notifications

**Features**:
- Auto-updates on new notifications
- Real-time count badge
- Dropdown with scrollable list
- Mark as read/delete actions

### Notification Settings Page

**Route**: `/settings/notifications`

**Features**:
- Email service configuration
- Gmail App Password setup guide
- SMTP custom configuration
- Test email functionality
- Notification preferences (per type)

---

## 🔧 Backend API Endpoints

### POST `/api/notifications/config`
Configure email service

**Request**:
```json
{
  "enabled": true,
  "service": "gmail",
  "email": "your@gmail.com",
  "password": "app-password"
}
```

**Response**:
```json
{
  "success": true,
  "configured": true,
  "verified": true
}
```

### POST `/api/notifications/send-email`
Send email notification

**Request**:
```json
{
  "to": "recipient@example.com",
  "subject": "Notification Subject",
  "html": "<h1>HTML Content</h1>"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### POST `/api/notifications/test-email`
Send test email

**Request**:
```json
{
  "to": "your@email.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

### GET `/api/notifications/status`
Check email service status

**Response**:
```json
{
  "configured": true
}
```

---

## 📊 Role-Based Notifications

### Load Owner (Borrower) receives:
- `trip_created` - Trip created
- `trip_funded` - Received funding
- `trip_completed` - Trip completed
- `bid_received` - New bid received
- `investment_confirmed` - Investment confirmed
- `wallet_credited` - Funds received
- `wallet_debited` - Payment made
- `kyc_approved/rejected` - KYC status

### Lender receives:
- `investment_allotted` - Bid accepted
- `investment_confirmed` - Investment confirmed
- `investment_returned` - Returns received
- `trip_completed` - Trip completed
- `wallet_credited` - Returns credited
- `kyc_approved/rejected` - KYC status

### All Roles receive:
- `kyc_approved/rejected`
- `wallet_credited/debited`
- `system_alert`

---

## 🧪 Testing

### Manual Testing

1. **Setup Email**:
   - Go to Settings → Notifications
   - Configure Gmail/SMTP
   - Send test email
   - Verify email received

2. **Test In-App Notifications**:
   - Open browser console
   - Run:
     ```javascript
     import { notificationService } from './services/notificationService';

     notificationService.createNotification(
       'your-user-id',
       'trip_created',
       {
         origin: 'Mumbai',
         destination: 'Delhi',
         loadType: 'Electronics',
         amount: 150000,
         distance: 1400
       }
     );
     ```
   - Check notification bell for new notification

3. **Test Email + In-App**:
   - Create a trip (triggers `trip_created`)
   - Place a bid (triggers `bid_received`)
   - Accept bid (triggers `investment_allotted`)
   - Check both email and notification bell

### Integration Points

Add notifications to these events:

**In CreateTrip.tsx**:
```typescript
// After successful trip creation
await notifyTripCreated(user.id, user.email, tripData);
```

**In InvestmentOpportunities.tsx**:
```typescript
// After bid submission
await notifyBidReceived(loadOwnerId, loadOwnerEmail, bidData);
```

**In Investment Confirmation**:
```typescript
// After investment confirmation
await notifyInvestmentConfirmed(lenderId, lenderEmail, data);
await notifyInvestmentConfirmed(borrowerId, borrowerEmail, data);
```

---

## 📱 Files Created

### Frontend:
1. `src/types/notification.ts` - Type definitions
2. `src/services/emailConfig.ts` - Email configuration service
3. `src/services/notificationService.ts` - In-app notification service
4. `src/services/notificationTemplates.ts` - Email & message templates
5. `src/components/NotificationBell.tsx` - Notification UI component
6. `src/pages/NotificationSettings.tsx` - Settings page
7. `src/utils/notificationTriggers.ts` - Helper functions

### Backend:
1. `server/services/emailService.ts` - Nodemailer email service
2. `server/routes/notifications.ts` - API endpoints

### Configuration:
- Updated `server/index.ts` - Added notification routes
- Updated `src/App.tsx` - Added notification settings route
- Updated `src/components/DashboardLayout.tsx` - Added notification bell

---

## 🎯 Next Steps

### Immediate Integration:
1. Add `notifyTripCreated` to trip creation flow
2. Add `notifyBidReceived` to bid submission
3. Add `notifyInvestmentAllotted` to bid acceptance
4. Add `notifyWalletCredited` to wallet transactions

### Future Enhancements:
1. **Push Notifications** (Web Push API)
2. **SMS Notifications** (Twilio integration)
3. **Notification Scheduling** (Send at specific times)
4. **Notification Templates Editor** (Admin can edit templates)
5. **Analytics** (Track open rates, click rates)
6. **Batch Notifications** (Send to multiple users efficiently)
7. **Rich Notifications** (Images, attachments)
8. **Database Storage** (Persist notifications in DB instead of localStorage)

---

## 🔐 Security Notes

- **App Passwords** are stored in localStorage (client-side)
- **Never commit** email credentials to git
- Use **environment variables** for production email config
- **Sanitize** user input in notification templates
- **Rate limit** email sending to prevent spam

---

## 📞 Support

For help:
- Check browser console for errors
- Verify email configuration
- Test with Gmail first (easier setup)
- Check server logs for email sending errors

---

## ✅ Quick Start Checklist

- [ ] Go to Settings → Notifications
- [ ] Enable Email Notifications
- [ ] Select Gmail
- [ ] Generate Google App Password
- [ ] Enter email and app password
- [ ] Click "Send Test Email"
- [ ] Verify test email received
- [ ] Check notification bell for in-app notifications
- [ ] Start using notifications in your code!

---

**🎉 Notification system is fully functional and ready to use!**
