import express from 'express';
import { emailService } from '../services/emailService';
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, } from '../../src/db/queries/notifications.ts';
const router = express.Router();
// Initialize email service with config
router.post('/config', async (req, res) => {
    try {
        const config = req.body;
        emailService.initialize(config);
        // Verify configuration
        const isValid = await emailService.verifyConfig();
        res.json({
            success: true,
            configured: emailService.isConfigured(),
            verified: isValid,
        });
    }
    catch (error) {
        console.error('Error configuring email service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure email service',
        });
    }
});
// Send email
router.post('/send-email', async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;
        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, subject, html',
            });
        }
        const sent = await emailService.sendEmail({
            to,
            subject,
            html,
            text,
        });
        res.json({
            success: sent,
            message: sent ? 'Email sent successfully' : 'Email service not configured',
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email',
        });
    }
});
// Send test email
router.post('/test-email', async (req, res) => {
    try {
        const { to } = req.body;
        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required',
            });
        }
        const sent = await emailService.sendTestEmail(to);
        res.json({
            success: sent,
            message: sent ? 'Test email sent successfully' : 'Failed to send test email',
        });
    }
    catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test email',
        });
    }
});
// Check email service status
router.get('/status', (req, res) => {
    res.json({
        configured: emailService.isConfigured(),
    });
});
// ============================================================
// Notification CRUD Endpoints
// ============================================================
// GET /api/notifications/:userId/unread-count - Get unread count
// IMPORTANT: This must be defined BEFORE the general /:userId route
// to prevent Express from treating "unread-count" as a userId
router.get('/:userId/unread-count', async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await getUnreadCount(userId);
        res.json({ count });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count', message: error.message });
    }
});
// GET /api/notifications/:userId - Get all notifications for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const notifications = await getUserNotifications(userId, limit);
        res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications', message: error.message });
    }
});
// PUT /api/notifications/:userId/:notificationId/read - Mark notification as read
router.put('/:userId/:notificationId/read', async (req, res) => {
    try {
        const { userId, notificationId } = req.params;
        const success = await markAsRead(userId, notificationId);
        if (success) {
            res.json({ success: true, message: 'Notification marked as read' });
        }
        else {
            res.status(404).json({ error: 'Notification not found' });
        }
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read', message: error.message });
    }
});
// PUT /api/notifications/:userId/read-all - Mark all notifications as read
router.put('/:userId/read-all', async (req, res) => {
    try {
        const { userId } = req.params;
        const success = await markAllAsRead(userId);
        res.json({ success, message: success ? 'All notifications marked as read' : 'No unread notifications' });
    }
    catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read', message: error.message });
    }
});
// DELETE /api/notifications/:userId/:notificationId - Delete notification
router.delete('/:userId/:notificationId', async (req, res) => {
    try {
        const { userId, notificationId } = req.params;
        const success = await deleteNotification(userId, notificationId);
        if (success) {
            res.json({ success: true, message: 'Notification deleted' });
        }
        else {
            res.status(404).json({ error: 'Notification not found' });
        }
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification', message: error.message });
    }
});
// DELETE /api/notifications/:userId - Delete all notifications
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const success = await deleteAllNotifications(userId);
        res.json({ success, message: 'All notifications deleted' });
    }
    catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ error: 'Failed to delete all notifications', message: error.message });
    }
});
export default router;
