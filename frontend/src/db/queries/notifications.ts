import { getDatabase } from '../database';
import { NotificationType, NotificationPriority } from '@/types/notification';

export interface DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: number;
  action_url?: string;
  metadata?: string;
  created_at: string;
  read_at?: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification
 */
export const createNotification = (input: CreateNotificationInput): DbNotification => {
  const db = getDatabase();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO notifications (
      id, user_id, type, title, message, priority, read, link, action_url, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.userId,
    input.type,
    input.title,
    input.message,
    input.priority || 'medium',
    input.actionUrl || null,
    input.actionUrl || null,
    input.metadata ? JSON.stringify(input.metadata) : null
  );

  const notification = getNotificationById(id);
  if (!notification) {
    throw new Error('Failed to create notification');
  }

  return notification;
};

/**
 * Get notification by ID
 */
export const getNotificationById = (id: string): DbNotification | null => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM notifications WHERE id = ?');
  return stmt.get(id) as DbNotification | null;
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = (userId: string, limit: number = 50): DbNotification[] => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(userId, limit) as DbNotification[];
};

/**
 * Get unread notifications count for a user
 */
export const getUnreadCount = (userId: string): number => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0');
  const result = stmt.get(userId) as { count: number };
  return result.count;
};

/**
 * Mark notification as read
 */
export const markAsRead = (userId: string, notificationId: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE notifications
    SET read = 1, read_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(notificationId, userId);
  return result.changes > 0;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = (userId: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE notifications
    SET read = 1, read_at = datetime('now')
    WHERE user_id = ? AND read = 0
  `);
  const result = stmt.run(userId);
  return result.changes > 0;
};

/**
 * Delete a notification
 */
export const deleteNotification = (userId: string, notificationId: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?');
  const result = stmt.run(notificationId, userId);
  return result.changes > 0;
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = (userId: string): boolean => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM notifications WHERE user_id = ?');
  const result = stmt.run(userId);
  return result.changes > 0;
};

/**
 * Get notifications by type
 */
export const getNotificationsByType = (userId: string, type: NotificationType): DbNotification[] => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? AND type = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(userId, type) as DbNotification[];
};

export default {
  createNotification,
  getNotificationById,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationsByType,
};
