import express from 'express';
import { emailService } from '../services/emailService';

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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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

export default router;
