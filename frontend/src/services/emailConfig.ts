import { EmailConfig } from '@/types/notification';

const EMAIL_CONFIG_KEY = 'email_config';

export const emailConfigService = {
  // Get email configuration
  getConfig(): EmailConfig | null {
    const config = localStorage.getItem(EMAIL_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  },

  // Save email configuration
  saveConfig(config: EmailConfig): void {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  },

  // Update specific config fields
  updateConfig(updates: Partial<EmailConfig>): void {
    const current = this.getConfig() || this.getDefaultConfig();
    const updated = { ...current, ...updates };
    this.saveConfig(updated);
  },

  // Get default configuration
  getDefaultConfig(): EmailConfig {
    return {
      enabled: false,
      service: 'gmail',
      email: '',
      password: '',
    };
  },

  // Clear configuration
  clearConfig(): void {
    localStorage.removeItem(EMAIL_CONFIG_KEY);
  },

  // Validate configuration
  isConfigValid(): boolean {
    const config = this.getConfig();
    if (!config || !config.enabled) return false;

    if (!config.email || !config.password) return false;

    if (config.service === 'smtp') {
      if (!config.smtpHost || !config.smtpPort) return false;
    }

    return true;
  },
};
