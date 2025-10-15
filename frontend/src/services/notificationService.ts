import { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import { getNotificationTemplate } from './notificationTemplates';

const NOTIFICATIONS_KEY = 'user_notifications';
const MAX_NOTIFICATIONS = 100;

export const notificationService = {
  // Get all notifications for a user
  getNotifications(userId: string): Notification[] {
    const allNotifications = this._getAllNotifications();
    return allNotifications[userId] || [];
  },

  // Get unread notifications count
  getUnreadCount(userId: string): number {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  },

  // Create a new notification
  createNotification(
    userId: string,
    type: NotificationType,
    data: any,
    priority: NotificationPriority = 'medium'
  ): Notification {
    const template = getNotificationTemplate(type);

    const notification: Notification = {
      id: this._generateId(),
      userId,
      type,
      title: template?.subject || 'Notification',
      message: template?.inAppMessage(data) || 'You have a new notification',
      priority: template?.priority || priority,
      read: false,
      actionUrl: data.actionUrl,
      metadata: data,
      createdAt: new Date().toISOString(),
    };

    this._addNotification(userId, notification);
    return notification;
  },

  // Mark notification as read
  markAsRead(userId: string, notificationId: string): void {
    const allNotifications = this._getAllNotifications();
    const userNotifications = allNotifications[userId] || [];

    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      this._saveAllNotifications(allNotifications);
    }
  },

  // Mark all as read
  markAllAsRead(userId: string): void {
    const allNotifications = this._getAllNotifications();
    const userNotifications = allNotifications[userId] || [];

    userNotifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        n.readAt = new Date().toISOString();
      }
    });

    this._saveAllNotifications(allNotifications);
  },

  // Delete notification
  deleteNotification(userId: string, notificationId: string): void {
    const allNotifications = this._getAllNotifications();
    const userNotifications = allNotifications[userId] || [];

    allNotifications[userId] = userNotifications.filter(n => n.id !== notificationId);
    this._saveAllNotifications(allNotifications);
  },

  // Clear all notifications
  clearAll(userId: string): void {
    const allNotifications = this._getAllNotifications();
    allNotifications[userId] = [];
    this._saveAllNotifications(allNotifications);
  },

  // Get notifications by type
  getByType(userId: string, type: NotificationType): Notification[] {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => n.type === type);
  },

  // Get notifications by priority
  getByPriority(userId: string, priority: NotificationPriority): Notification[] {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => n.priority === priority);
  },

  // Get recent notifications (last N)
  getRecent(userId: string, limit: number = 10): Notification[] {
    const notifications = this.getNotifications(userId);
    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  // Private helper methods
  _getAllNotifications(): Record<string, Notification[]> {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : {};
  },

  _saveAllNotifications(notifications: Record<string, Notification[]>): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  },

  _addNotification(userId: string, notification: Notification): void {
    const allNotifications = this._getAllNotifications();
    const userNotifications = allNotifications[userId] || [];

    // Add new notification at the beginning
    userNotifications.unshift(notification);

    // Keep only the latest MAX_NOTIFICATIONS
    if (userNotifications.length > MAX_NOTIFICATIONS) {
      userNotifications.splice(MAX_NOTIFICATIONS);
    }

    allNotifications[userId] = userNotifications;
    this._saveAllNotifications(allNotifications);

    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('notification-created', {
      detail: { userId, notification }
    }));
  },

  _generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Helper function to create and optionally send email
export const sendNotification = async (
  userId: string,
  userEmail: string,
  type: NotificationType,
  data: any,
  sendEmail: boolean = true
): Promise<Notification> => {
  // Create in-app notification
  const notification = notificationService.createNotification(userId, type, data);

  // Send email if configured and enabled
  if (sendEmail) {
    const template = getNotificationTemplate(type);
    if (template) {
      try {
        // Call backend API to send email
        await fetch('/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userEmail,
            subject: template.subject,
            html: template.emailTemplate(data),
          }),
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  }

  return notification;
};
