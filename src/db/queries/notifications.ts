import { getDatabase } from '../database.js';
import { NotificationType, NotificationPriority } from '@/types/notification';

export interface DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
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
export const createNotification = async (input: CreateNotificationInput): Promise<DbNotification> => {
  try {
    const db = getDatabase();
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔔 [NOTIFICATION] Creating notification:', {
      id,
      userId: input.userId,
      type: input.type,
      title: input.title
    });

    await db.query(`
      INSERT INTO notifications (
        id, user_id, type, title, message, priority, read, link, action_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8, $9)
    `, [
      id,
      input.userId,
      input.type,
      input.title,
      input.message,
      input.priority || 'medium',
      input.actionUrl || null,
      input.actionUrl || null,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]);

    console.log('✅ [NOTIFICATION] Notification created successfully:', id);

    const notification = await getNotificationById(id);
    if (!notification) {
      throw new Error('Failed to create notification');
    }

    return notification;
  } catch (error) {
    console.error('❌ [NOTIFICATION] Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (id: string): Promise<DbNotification | null> => {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId: string, limit: number = 50): Promise<DbNotification[]> => {
  const db = getDatabase();
  console.log(`🔔 [NOTIFICATION] Fetching notifications for user: ${userId}, limit: ${limit}`);
  const result = await db.query(`
    SELECT * FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [userId, limit]);
  console.log(`✅ [NOTIFICATION] Found ${result.rows.length} notifications for user: ${userId}`);
  return result.rows;
};

/**
 * Get unread notifications count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const db = getDatabase();
  const result = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE', [userId]);
  const count = parseInt(result.rows[0].count);
  console.log(`🔔 [NOTIFICATION] Unread count for user ${userId}: ${count}`);
  return count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (userId: string, notificationId: string): Promise<boolean> => {
  const db = getDatabase();
  const result = await db.query(`
    UPDATE notifications
    SET read = TRUE, read_at = NOW()
    WHERE id = $1 AND user_id = $2
  `, [notificationId, userId]);
  return result.rowCount > 0;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<boolean> => {
  const db = getDatabase();
  const result = await db.query(`
    UPDATE notifications
    SET read = TRUE, read_at = NOW()
    WHERE user_id = $1 AND read = FALSE
  `, [userId]);
  return result.rowCount > 0;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (userId: string, notificationId: string): Promise<boolean> => {
  const db = getDatabase();
  const result = await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);
  return result.rowCount > 0;
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId: string): Promise<boolean> => {
  const db = getDatabase();
  const result = await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
  return result.rowCount > 0;
};

/**
 * Get notifications by type
 */
export const getNotificationsByType = async (userId: string, type: NotificationType): Promise<DbNotification[]> => {
  const db = getDatabase();
  const result = await db.query(`
    SELECT * FROM notifications
    WHERE user_id = $1 AND type = $2
    ORDER BY created_at DESC
  `, [userId, type]);
  return result.rows;
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
