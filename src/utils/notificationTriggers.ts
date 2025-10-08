import { sendNotification } from '@/services/notificationService';
import { NotificationType } from '@/types/notification';

/**
 * Trigger notifications for various events
 * These functions should be called when specific events occur in the application
 */

// Trip-related notifications
export const notifyTripCreated = async (userId: string, userEmail: string, tripData: any) => {
  await sendNotification(userId, userEmail, 'trip_created', tripData);
};

export const notifyTripFunded = async (userId: string, userEmail: string, tripData: any) => {
  await sendNotification(userId, userEmail, 'trip_funded', tripData);
};

export const notifyTripCompleted = async (userId: string, userEmail: string, tripData: any) => {
  await sendNotification(userId, userEmail, 'trip_completed', tripData);
};

// Investment-related notifications
export const notifyBidReceived = async (userId: string, userEmail: string, bidData: any) => {
  await sendNotification(userId, userEmail, 'bid_received', bidData);
};

export const notifyInvestmentAllotted = async (userId: string, userEmail: string, investmentData: any) => {
  await sendNotification(userId, userEmail, 'investment_allotted', investmentData);
};

export const notifyInvestmentConfirmed = async (userId: string, userEmail: string, investmentData: any) => {
  await sendNotification(userId, userEmail, 'investment_confirmed', investmentData);
};

export const notifyInvestmentReturned = async (userId: string, userEmail: string, returnData: any) => {
  await sendNotification(userId, userEmail, 'investment_returned', returnData);
};

// Wallet notifications
export const notifyWalletCredited = async (userId: string, userEmail: string, transactionData: any) => {
  await sendNotification(userId, userEmail, 'wallet_credited', transactionData);
};

export const notifyWalletDebited = async (userId: string, userEmail: string, transactionData: any) => {
  await sendNotification(userId, userEmail, 'wallet_debited', transactionData);
};

// KYC notifications
export const notifyKYCApproved = async (userId: string, userEmail: string) => {
  await sendNotification(userId, userEmail, 'kyc_approved', {});
};

export const notifyKYCRejected = async (userId: string, userEmail: string, reason: string, corrections?: string[]) => {
  await sendNotification(userId, userEmail, 'kyc_rejected', { reason, corrections });
};

// System notifications
export const notifySystemAlert = async (userId: string, userEmail: string, message: string, details?: string) => {
  await sendNotification(userId, userEmail, 'system_alert', { message, details });
};

// Bulk notification helper (for notifying multiple users)
export const notifyMultipleUsers = async (
  users: Array<{ id: string; email: string }>,
  type: NotificationType,
  data: any
) => {
  await Promise.all(
    users.map(user => sendNotification(user.id, user.email, type, data))
  );
};
