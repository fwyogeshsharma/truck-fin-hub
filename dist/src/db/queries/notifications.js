import { getDatabase } from '../database.js';
/**
 * Create a new notification
 */
export const createNotification = async (input) => {
    const db = await getDatabase();
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const notification = await getNotificationById(id);
    if (!notification) {
        throw new Error('Failed to create notification');
    }
    return notification;
};
/**
 * Get notification by ID
 */
export const getNotificationById = async (id) => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
    return result.rows[0] || null;
};
/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId, limit = 50) => {
    const db = await getDatabase();
    const result = await db.query(`
    SELECT * FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [userId, limit]);
    return result.rows;
};
/**
 * Get unread notifications count for a user
 */
export const getUnreadCount = async (userId) => {
    const db = await getDatabase();
    const result = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE', [userId]);
    return parseInt(result.rows[0].count);
};
/**
 * Mark notification as read
 */
export const markAsRead = async (userId, notificationId) => {
    const db = await getDatabase();
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
export const markAllAsRead = async (userId) => {
    const db = await getDatabase();
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
export const deleteNotification = async (userId, notificationId) => {
    const db = await getDatabase();
    const result = await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);
    return result.rowCount > 0;
};
/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId) => {
    const db = await getDatabase();
    const result = await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    return result.rowCount > 0;
};
/**
 * Get notifications by type
 */
export const getNotificationsByType = async (userId, type) => {
    const db = await getDatabase();
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
