import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/auth';
import {
  Sun,
  Moon,
  Monitor,
  Sparkles,
  RotateCcw,
  Save,
  Palette,
  FileText,
  Upload
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/api/client';

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const defaultTheme: ThemeSettings = {
  mode: 'light',
  primaryColor: '#084570', // LogiFin Primary
  secondaryColor: '#1D923C', // LogiFin Secondary
  accentColor: '#1D923C', // Same as secondary
};

const presetThemes = [
  {
    name: 'Default (LogiFin)',
    primaryColor: '#084570',
    secondaryColor: '#1D923C',
    accentColor: '#1D923C',
  },
  {
    name: 'Ocean Blue',
    primaryColor: '#0077BE',
    secondaryColor: '#00C9A7',
    accentColor: '#00C9A7',
  },
  {
    name: 'Sunset Orange',
    primaryColor: '#FF6B35',
    secondaryColor: '#F7931E',
    accentColor: '#FFD23F',
  },
  {
    name: 'Forest Green',
    primaryColor: '#2D6A4F',
    secondaryColor: '#52B788',
    accentColor: '#95D5B2',
  },
  {
    name: 'Royal Purple',
    primaryColor: '#6A4C93',
    secondaryColor: '#8B5FBF',
    accentColor: '#C084FC',
  },
  {
    name: 'Crimson Red',
    primaryColor: '#C1121F',
    secondaryColor: '#E63946',
    accentColor: '#F4A261',
  },
];

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

/**
 * Apply theme colors to CSS variables
 */
function applyThemeColors(colors: Omit<ThemeSettings, 'mode'>) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(colors.primaryColor);
  const secondaryHSL = hexToHSL(colors.secondaryColor);
  const accentHSL = hexToHSL(colors.accentColor);

  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--accent', accentHSL);

  // Update primary variations
  const [h, s, l] = primaryHSL.split(' ');
  const lightness = parseInt(l);
  root.style.setProperty('--primary-light', `${h} ${s} ${Math.min(lightness + 15, 95)}%`);
  root.style.setProperty('--primary-dark', `${h} ${s} ${Math.max(lightness - 6, 5)}%`);

  // Update ring and sidebar colors
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-ring', primaryHSL);

  // Update gradients
  const primaryHue = h;
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${Number(primaryHue) - 20} 70% 55%) 100%)`
  );
  root.style.setProperty(
    '--gradient-hero',
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${secondaryHSL}) 100%)`
  );
}

/**
 * Apply dark/light mode
 */
function applyThemeMode(mode: 'light' | 'dark' | 'system') {
  const root = document.documentElement;

  if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', mode === 'dark');
  }
}

const Settings = () => {
  const { toast } = useToast();
  const user = auth.getCurrentUser();

  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-settings');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme(parsed);
        applyThemeColors(parsed);
        applyThemeMode(parsed.mode);
      } catch (error) {
        console.error('Failed to load saved theme:', error);
      }
    }
  }, []);

  const handleThemeChange = (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);

    // Apply immediately for preview
    if ('mode' in updates) {
      applyThemeMode(newTheme.mode);
    } else {
      applyThemeColors(newTheme);
    }
  };

  const handlePresetSelect = (preset: typeof presetThemes[0]) => {
    handleThemeChange({
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
    });
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    applyThemeColors(defaultTheme);
    applyThemeMode(defaultTheme.mode);
    localStorage.removeItem('theme-settings');

    toast({
      title: 'Theme reset',
      description: 'Theme has been reset to default settings.',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem('theme-settings', JSON.stringify(theme));

      // Save to database (if API exists)
      try {
        await apiClient.post('/theme', {
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          mode: theme.mode,
        });
      } catch (apiError) {
        console.log('API save failed, using localStorage only:', apiError);
      }

      toast({
        title: 'Theme saved!',
        description: 'Your theme preferences have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save theme settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role={user?.role || 'lender'}>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your application preferences and configurations
          </p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="agreements" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Agreements</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Other</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            {/* Theme Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Mode
                </CardTitle>
                <CardDescription>
                  Choose how the application should appear
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange({ mode: 'light' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange({ mode: 'dark' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="font-medium">Dark</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange({ mode: 'system' })}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:border-primary ${
                      theme.mode === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="font-medium">System</span>
                  </button>
                </div>

                {theme.mode === 'system' && (
                  <p className="text-sm text-muted-foreground">
                    The theme will automatically switch based on your device settings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Theme Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Theme Presets
                </CardTitle>
                <CardDescription>
                  Quick theme presets to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {presetThemes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition-all text-left"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Theme'}
              </Button>
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </TabsContent>

          {/* Upload Agreement Tab */}
          <TabsContent value="agreements" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Agreement
                </CardTitle>
                <CardDescription>
                  Upload and manage agreement documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Upload agreement functionality will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Settings Tab */}
          <TabsContent value="other" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Other Settings</CardTitle>
                <CardDescription>
                  Additional application settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Additional settings will be added here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
