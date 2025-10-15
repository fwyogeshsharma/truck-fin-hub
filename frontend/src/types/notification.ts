export type NotificationType =
  | 'trip_created'
  | 'trip_funded'
  | 'trip_completed'
  | 'investment_opportunity'
  | 'investment_allotted'
  | 'investment_confirmed'
  | 'investment_returned'
  | 'bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'payment_received'
  | 'payment_sent'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'wallet_credited'
  | 'wallet_debited'
  | 'system_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface EmailConfig {
  enabled: boolean;
  service: 'gmail' | 'smtp';
  email: string;
  password: string;
  smtpHost?: string;
  smtpPort?: number;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  notificationTypes: {
    [key in NotificationType]?: {
      email: boolean;
      inApp: boolean;
    };
  };
}

export interface NotificationTemplate {
  type: NotificationType;
  subject: string;
  emailTemplate: (data: any) => string;
  inAppMessage: (data: any) => string;
  priority: NotificationPriority;
  roles: string[]; // Which roles should receive this notification
}
