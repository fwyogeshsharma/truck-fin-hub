import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, X, Shield, TrendingUp, UserCheck } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'logifin_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'logifin_cookie_preferences';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }

    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Apply saved preferences
      if (savedPreferences) {
        applyCookiePreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Necessary cookies are always enabled
    // Here you can initialize your analytics, marketing tools based on preferences

    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics)
      console.log('Analytics cookies enabled');
      // Example: window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }

    if (prefs.marketing) {
      // Initialize marketing cookies (e.g., Facebook Pixel, Google Ads)
      console.log('Marketing cookies enabled');
    }

    if (prefs.functional) {
      // Enable functional cookies
      console.log('Functional cookies enabled');
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };

    savePreferences(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };

    savePreferences(onlyNecessary);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowSettings(false);
    setShowBanner(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    applyCookiePreferences(prefs);
    setPreferences(prefs);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies

    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
        <Card className="max-w-5xl mx-auto border-2 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1">We Value Your Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your browsing experience, serve personalized content,
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    You can customize your preferences by clicking "Cookie Settings".
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleAcceptAll}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Cookie className="h-4 w-4 mr-2" />
                    Accept All Cookies
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="outline"
                  >
                    Reject All
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="ghost"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Cookie Settings
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Read our{' '}
                  <a href="/privacy-policy" className="underline hover:text-primary">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="/cookie-policy" className="underline hover:text-primary">
                    Cookie Policy
                  </a>{' '}
                  to learn more.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleRejectAll}
                className="flex-shrink-0 p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie settings. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">Necessary Cookies</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded dark:bg-green-900/30 dark:text-green-400">
                        Always Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      These cookies are essential for the website to function properly. They enable basic
                      functions like page navigation, access to secure areas, and remember your login status.
                      The website cannot function properly without these cookies.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Examples: Session cookies, security cookies, load balancing cookies
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.necessary}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-semibold">Functional Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      These cookies enable enhanced functionality and personalization, such as remembering
                      your preferences (language, region, theme), chat services, and video content. They may
                      be set by us or by third-party providers.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Examples: Language preference, theme settings, video player settings
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch
                    checked={preferences.functional}
                    onCheckedChange={() => togglePreference('functional')}
                    className="mt-1"
                  />
                  <Label className="text-xs text-muted-foreground">
                    {preferences.functional ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-semibold">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      These cookies help us understand how visitors interact with our website by collecting
                      and reporting information anonymously. This helps us improve the website's functionality
                      and user experience. We use services like Google Analytics.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Examples: Google Analytics, page visit tracking, user behavior analysis
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={() => togglePreference('analytics')}
                    className="mt-1"
                  />
                  <Label className="text-xs text-muted-foreground">
                    {preferences.analytics ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-semibold">Marketing Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      These cookies are used to track visitors across websites and display ads that are
                      relevant and engaging. They help measure the effectiveness of advertising campaigns
                      and may be set by advertising partners through our site.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Examples: Facebook Pixel, Google Ads, retargeting cookies
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={() => togglePreference('marketing')}
                    className="mt-1"
                  />
                  <Label className="text-xs text-muted-foreground">
                    {preferences.marketing ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              onClick={handleSavePreferences}
              className="flex-1"
            >
              Save Preferences
            </Button>
            <Button
              onClick={handleAcceptAll}
              variant="outline"
              className="flex-1"
            >
              Accept All
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            You can change these settings at any time from the footer of our website
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;

// Export utility functions for checking cookie consent
export const hasCookieConsent = (type: keyof CookiePreferences): boolean => {
  const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (!savedPreferences) return false;

  const preferences: CookiePreferences = JSON.parse(savedPreferences);
  return preferences[type] === true;
};

export const resetCookieConsent = () => {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
  window.location.reload();
};
