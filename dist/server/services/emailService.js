import nodemailer from 'nodemailer';
class EmailService {
    constructor() {
        this.transporter = null;
        this.config = null;
    }
    // Initialize email service with configuration
    initialize(config) {
        if (!config.enabled) {
            console.log('Email notifications are disabled');
            this.transporter = null;
            this.config = null;
            return;
        }
        try {
            if (config.service === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: config.email,
                        pass: config.password,
                    },
                });
            }
            else if (config.service === 'smtp') {
                this.transporter = nodemailer.createTransport({
                    host: config.smtpHost,
                    port: config.smtpPort || 587,
                    secure: config.smtpPort === 465, // true for 465, false for other ports
                    auth: {
                        user: config.email,
                        pass: config.password,
                    },
                });
            }
            this.config = config;
            console.log('Email service initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize email service:', error);
            this.transporter = null;
            this.config = null;
        }
    }
    // Send email
    async sendEmail(options) {
        if (!this.transporter || !this.config) {
            console.log('Email service not configured, skipping email send');
            return false;
        }
        try {
            const mailOptions = {
                from: {
                    name: 'TruckFin Hub',
                    address: this.config.email,
                },
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: this.wrapEmailTemplate(options.html),
                text: options.text,
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
        }
        catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
    // Verify email configuration
    async verifyConfig() {
        if (!this.transporter) {
            return false;
        }
        try {
            await this.transporter.verify();
            console.log('Email configuration verified successfully');
            return true;
        }
        catch (error) {
            console.error('Email configuration verification failed:', error);
            return false;
        }
    }
    // Wrap email content in a nice HTML template
    wrapEmailTemplate(content) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TruckFin Hub Notification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #0ea5e9;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
          }
          h1, h2, h3 {
            color: #1e293b;
          }
          h2 {
            font-size: 24px;
            margin-top: 0;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0ea5e9;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .alert-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 16px 0;
          }
          .success-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 12px;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🚛 TruckFin Hub</div>
            <p style="margin: 5px 0; color: #64748b;">Logistics Finance Platform</p>
          </div>

          <div class="content">
            ${content}
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} TruckFin Hub. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    // Send test email
    async sendTestEmail(to) {
        return this.sendEmail({
            to,
            subject: 'TruckFin Hub - Test Email',
            html: `
        <h2>Email Configuration Test ✅</h2>
        <p>Congratulations! Your email configuration is working correctly.</p>
        <p>You will now receive email notifications for important events on the platform.</p>
        <div class="success-box">
          <strong>Test successful!</strong> You can now receive email notifications.
        </div>
      `,
        });
    }
    // Get current configuration status
    isConfigured() {
        return this.transporter !== null && this.config !== null;
    }
}
// Export singleton instance
export const emailService = new EmailService();
