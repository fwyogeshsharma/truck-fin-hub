import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import { emailConfigService } from '@/services/emailConfig';
import type { EmailConfig } from '@/types/notification';
import { Mail, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const NotificationSettings = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [config, setConfig] = useState<EmailConfig>(emailConfigService.getDefaultConfig());
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedConfig = emailConfigService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save config locally
      emailConfigService.saveConfig(config);

      // Initialize email service on backend
      const response = await fetch('/api/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        toast({
          title: 'Configuration saved!',
          description: 'Email notifications are now enabled.',
        });
      } else if (data.success && !data.verified) {
        toast({
          variant: 'destructive',
          title: 'Configuration saved but not verified',
          description: 'Please check your email credentials.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save configuration.',
        });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!user?.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No email address found for your account.',
      });
      return;
    }

    setIsTesting(true);

    try {
      // Save config first
      emailConfigService.saveConfig(config);

      // Initialize email service
      await fetch('/api/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      // Send test email
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Test email sent!',
          description: `Check your inbox at ${user.email}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to send test email',
          description: 'Please check your configuration and try again.',
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send test email.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <DashboardLayout role={user?.role || 'lender'}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure email notifications and preferences
          </p>
        </div>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notification Setup
            </CardTitle>
            <CardDescription>
              Configure your email settings to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Email Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="enable-email" className="text-base font-medium">
                  Enable Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive important updates via email
                </p>
              </div>
              <Switch
                id="enable-email"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            {config.enabled && (
              <>
                {/* Email Service Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service">Email Service</Label>
                  <Select
                    value={config.service}
                    onValueChange={(value: 'gmail' | 'smtp') =>
                      setConfig({ ...config, service: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select email service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail (Recommended)</SelectItem>
                      <SelectItem value="smtp">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Gmail is recommended for easy setup
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  />
                </div>

                {/* Password / App Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {config.service === 'gmail' ? 'App Password' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={config.password}
                      onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {config.service === 'gmail' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>How to get Gmail App Password:</strong>
                        <ol className="list-decimal ml-4 mt-2 space-y-1">
                          <li>Go to your Google Account Settings</li>
                          <li>Navigate to Security → 2-Step Verification</li>
                          <li>Scroll down to "App passwords"</li>
                          <li>Generate a new app password for "Mail"</li>
                          <li>Copy and paste the 16-character password here</li>
                        </ol>
                        <a
                          href="https://support.google.com/accounts/answer/185833"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline mt-2 block"
                        >
                          Learn more →
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* SMTP Custom Settings */}
                {config.service === 'smtp' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        placeholder="smtp.example.com"
                        value={config.smtpHost || ''}
                        onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        placeholder="587"
                        value={config.smtpPort || ''}
                        onChange={(e) =>
                          setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)
                      </p>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={isTesting || !config.email || !config.password}
                  >
                    {isTesting ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Trip Updates</p>
                <p className="text-xs text-muted-foreground">New trips, funding, completion</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Investment Updates</p>
                <p className="text-xs text-muted-foreground">Bids, allotments, returns</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Wallet Transactions</p>
                <p className="text-xs text-muted-foreground">Credits, debits, balance updates</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">KYC Updates</p>
                <p className="text-xs text-muted-foreground">Verification status changes</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">System Alerts</p>
                <p className="text-xs text-muted-foreground">Important platform updates</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;
