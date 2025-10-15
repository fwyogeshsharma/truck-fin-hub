import { NotificationTemplate } from '@/types/notification';
import { formatCurrency } from '@/lib/currency';

export const notificationTemplates: Record<string, NotificationTemplate> = {
  // Trip-related notifications
  trip_created: {
    type: 'trip_created',
    subject: 'New Trip Created',
    priority: 'medium',
    roles: ['load_owner', 'admin'],
    emailTemplate: (data) => `
      <h2>New Trip Created</h2>
      <p>Your trip from <strong>${data.origin}</strong> to <strong>${data.destination}</strong> has been created successfully.</p>
      <p><strong>Trip Details:</strong></p>
      <ul>
        <li>Load Type: ${data.loadType}</li>
        <li>Amount: ${formatCurrency(data.amount)}</li>
        <li>Distance: ${data.distance}km</li>
      </ul>
      <p>Your trip is now available for lenders to bid on.</p>
    `,
    inAppMessage: (data) => `Trip from ${data.origin} to ${data.destination} created successfully. Amount: ${formatCurrency(data.amount)}`,
  },

  trip_funded: {
    type: 'trip_funded',
    subject: 'Trip Funding Received',
    priority: 'high',
    roles: ['load_owner'],
    emailTemplate: (data) => `
      <h2>Trip Funded Successfully! 🎉</h2>
      <p>Great news! Your trip has been fully funded.</p>
      <p><strong>Trip Details:</strong></p>
      <ul>
        <li>Route: ${data.origin} → ${data.destination}</li>
        <li>Funding Amount: ${formatCurrency(data.amount)}</li>
        <li>Lender: ${data.lenderName}</li>
        <li>Interest Rate: ${data.interestRate}%</li>
      </ul>
      <p>The funds will be available in your wallet shortly.</p>
    `,
    inAppMessage: (data) => `Trip funded! ${formatCurrency(data.amount)} received from ${data.lenderName} at ${data.interestRate}% interest.`,
  },

  trip_completed: {
    type: 'trip_completed',
    subject: 'Trip Completed',
    priority: 'high',
    roles: ['load_owner', 'lender', 'admin'],
    emailTemplate: (data) => `
      <h2>Trip Completed ✅</h2>
      <p>The trip from <strong>${data.origin}</strong> to <strong>${data.destination}</strong> has been marked as completed.</p>
      <p><strong>Summary:</strong></p>
      <ul>
        <li>Trip Amount: ${formatCurrency(data.amount)}</li>
        <li>Completion Date: ${new Date(data.completedAt).toLocaleDateString()}</li>
      </ul>
      ${data.role === 'lender' ? `<p>Your returns will be processed shortly.</p>` : ''}
    `,
    inAppMessage: (data) => `Trip ${data.origin} → ${data.destination} completed successfully.`,
  },

  // Investment-related notifications
  investment_opportunity: {
    type: 'investment_opportunity',
    subject: 'New Investment Opportunity Available',
    priority: 'high',
    roles: ['lender'],
    emailTemplate: (data) => `
      <h2>New Investment Opportunity! 💼</h2>
      <p>A new trip is available for funding on the platform.</p>
      <p><strong>Trip Details:</strong></p>
      <ul>
        <li>Route: ${data.origin} → ${data.destination}</li>
        <li>Load Type: ${data.loadType}</li>
        <li>Amount: ${formatCurrency(data.amount)}</li>
        <li>Distance: ${data.distance}km</li>
        <li>Interest Rate: ${data.interestRate || 'N/A'}%</li>
        <li>Risk Level: ${data.riskLevel || 'Low'}</li>
        <li>Maturity: ${data.maturityDays || 30} days</li>
      </ul>
      <p>Review this opportunity and place your bid in the Investment Opportunities section.</p>
    `,
    inAppMessage: (data) => `New investment opportunity: ${data.origin} → ${data.destination}, ${formatCurrency(data.amount)} at ${data.interestRate || 'N/A'}% interest`,
  },

  bid_received: {
    type: 'bid_received',
    subject: 'New Investment Bid Received',
    priority: 'high',
    roles: ['load_owner'],
    emailTemplate: (data) => `
      <h2>New Bid Received 💰</h2>
      <p>You have received a new funding bid for your trip.</p>
      <p><strong>Bid Details:</strong></p>
      <ul>
        <li>Trip: ${data.origin} → ${data.destination}</li>
        <li>Lender: ${data.lenderName}</li>
        <li>Bid Amount: ${formatCurrency(data.amount)}</li>
        <li>Interest Rate: ${data.interestRate}%</li>
      </ul>
      <p>Please review and accept/reject this bid in your dashboard.</p>
    `,
    inAppMessage: (data) => `New bid: ${formatCurrency(data.amount)} at ${data.interestRate}% from ${data.lenderName}`,
  },

  investment_allotted: {
    type: 'investment_allotted',
    subject: 'Investment Allotted - Action Required',
    priority: 'urgent',
    roles: ['lender'],
    emailTemplate: (data) => `
      <h2>Investment Allotted! 🎯</h2>
      <p>Congratulations! Your bid has been accepted by the borrower.</p>
      <p><strong>Investment Details:</strong></p>
      <ul>
        <li>Trip: ${data.origin} → ${data.destination}</li>
        <li>Investment Amount: ${formatCurrency(data.amount)}</li>
        <li>Interest Rate: ${data.interestRate}%</li>
        <li>Expected Return: ${formatCurrency(data.expectedReturn)}</li>
        <li>Maturity: ${data.maturityDays} days</li>
      </ul>
      <p><strong>Action Required:</strong> Please confirm this investment in your dashboard.</p>
    `,
    inAppMessage: (data) => `Investment allotted! ${formatCurrency(data.amount)} for ${data.origin} → ${data.destination}. Confirm now.`,
  },

  investment_confirmed: {
    type: 'investment_confirmed',
    subject: 'Investment Confirmed',
    priority: 'high',
    roles: ['lender', 'load_owner'],
    emailTemplate: (data) => `
      <h2>Investment Confirmed ✅</h2>
      <p>The investment has been confirmed successfully.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Trip: ${data.origin} → ${data.destination}</li>
        <li>Amount: ${formatCurrency(data.amount)}</li>
        <li>Interest Rate: ${data.interestRate}%</li>
        <li>Expected Return: ${formatCurrency(data.expectedReturn)}</li>
      </ul>
      ${data.role === 'lender' ? `<p>Your funds are now actively invested.</p>` : `<p>Funds have been released to your wallet.</p>`}
    `,
    inAppMessage: (data) => `Investment confirmed: ${formatCurrency(data.amount)} for trip ${data.origin} → ${data.destination}`,
  },

  investment_returned: {
    type: 'investment_returned',
    subject: 'Investment Returns Received',
    priority: 'high',
    roles: ['lender'],
    emailTemplate: (data) => `
      <h2>Returns Received! 💰</h2>
      <p>Great news! Your investment has matured and returns have been credited.</p>
      <p><strong>Investment Summary:</strong></p>
      <ul>
        <li>Principal Amount: ${formatCurrency(data.principal)}</li>
        <li>Returns: ${formatCurrency(data.returns)}</li>
        <li>Total Received: ${formatCurrency(data.total)}</li>
        <li>ROI: ${data.roi}%</li>
      </ul>
      <p>The funds are now available in your wallet.</p>
    `,
    inAppMessage: (data) => `Returns received! ${formatCurrency(data.total)} (Principal + ${formatCurrency(data.returns)} profit)`,
  },

  // Wallet notifications
  wallet_credited: {
    type: 'wallet_credited',
    subject: 'Wallet Credited',
    priority: 'medium',
    roles: ['all'],
    emailTemplate: (data) => `
      <h2>Wallet Credited 💳</h2>
      <p>Your wallet has been credited with ${formatCurrency(data.amount)}.</p>
      <p><strong>Transaction Details:</strong></p>
      <ul>
        <li>Amount: ${formatCurrency(data.amount)}</li>
        <li>Reason: ${data.description}</li>
        <li>New Balance: ${formatCurrency(data.newBalance)}</li>
        <li>Date: ${new Date(data.timestamp).toLocaleString()}</li>
      </ul>
    `,
    inAppMessage: (data) => `Wallet credited: ${formatCurrency(data.amount)}. New balance: ${formatCurrency(data.newBalance)}`,
  },

  wallet_debited: {
    type: 'wallet_debited',
    subject: 'Wallet Debited',
    priority: 'medium',
    roles: ['all'],
    emailTemplate: (data) => `
      <h2>Wallet Debited</h2>
      <p>An amount of ${formatCurrency(data.amount)} has been debited from your wallet.</p>
      <p><strong>Transaction Details:</strong></p>
      <ul>
        <li>Amount: ${formatCurrency(data.amount)}</li>
        <li>Reason: ${data.description}</li>
        <li>New Balance: ${formatCurrency(data.newBalance)}</li>
        <li>Date: ${new Date(data.timestamp).toLocaleString()}</li>
      </ul>
    `,
    inAppMessage: (data) => `Wallet debited: ${formatCurrency(data.amount)}. New balance: ${formatCurrency(data.newBalance)}`,
  },

  // KYC notifications
  kyc_approved: {
    type: 'kyc_approved',
    subject: 'KYC Approved - Welcome!',
    priority: 'high',
    roles: ['all'],
    emailTemplate: (data) => `
      <h2>KYC Approved! ✅</h2>
      <p>Congratulations! Your KYC verification has been approved.</p>
      <p>You now have full access to all platform features:</p>
      <ul>
        <li>Create and fund trips</li>
        <li>Make investments</li>
        <li>Full wallet functionality</li>
        <li>Transaction history</li>
      </ul>
      <p>Welcome to the platform!</p>
    `,
    inAppMessage: (data) => `KYC approved! You now have full platform access.`,
  },

  kyc_rejected: {
    type: 'kyc_rejected',
    subject: 'KYC Verification - Action Required',
    priority: 'urgent',
    roles: ['all'],
    emailTemplate: (data) => `
      <h2>KYC Verification Needs Attention</h2>
      <p>We were unable to verify your KYC documents.</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>Please resubmit your documents with the following corrections:</p>
      <ul>
        ${data.corrections?.map((c: string) => `<li>${c}</li>`).join('') || ''}
      </ul>
      <p>If you have questions, please contact our support team.</p>
    `,
    inAppMessage: (data) => `KYC verification failed. Please resubmit documents. Reason: ${data.reason}`,
  },

  // System alerts
  system_alert: {
    type: 'system_alert',
    subject: 'System Alert',
    priority: 'medium',
    roles: ['all'],
    emailTemplate: (data) => `
      <h2>System Alert</h2>
      <p>${data.message}</p>
      ${data.details ? `<p><strong>Details:</strong> ${data.details}</p>` : ''}
    `,
    inAppMessage: (data) => data.message,
  },
};

// Helper to get template
export const getNotificationTemplate = (type: string): NotificationTemplate | undefined => {
  return notificationTemplates[type];
};
