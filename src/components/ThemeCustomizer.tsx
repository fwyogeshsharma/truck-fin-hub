/**
 * Theme Customizer Component
 * Allows super admin to customize and save theme colors to database
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, Save, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ThemeColors {
  primary_color: string;
  primary_color_dark: string;
  secondary_color: string;
  accent_color: string;
}

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
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
function applyColors(colors: ThemeColors) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(colors.primary_color);
  const primaryDarkHSL = hexToHSL(colors.primary_color_dark);
  const secondaryHSL = hexToHSL(colors.secondary_color);
  const accentHSL = hexToHSL(colors.accent_color);

  root.style.setProperty("--primary", primaryHSL);
  root.style.setProperty("--primary-dark", primaryDarkHSL);
  root.style.setProperty("--secondary", secondaryHSL);
  root.style.setProperty("--accent", accentHSL);

  // Update primary light (slightly lighter version)
  const [h, s, l] = primaryHSL.split(' ');
  const lightness = parseInt(l);
  root.style.setProperty("--primary-light", `${h} ${s} ${Math.min(lightness + 15, 95)}%`);

  // Update ring color
  root.style.setProperty("--ring", primaryHSL);
  root.style.setProperty("--sidebar-primary", primaryHSL);
  root.style.setProperty("--sidebar-ring", primaryHSL);

  // Update gradients
  const primaryHue = h;
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${Number(primaryHue) - 20} 70% 55%) 100%)`
  );
  root.style.setProperty(
    "--gradient-hero",
    `linear-gradient(135deg, hsl(${primaryHSL}) 0%, hsl(${secondaryHSL}) 100%)`
  );
}

export function ThemeCustomizer() {
  const { toast } = useToast();
  const user = auth.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState<ThemeColors>({
    primary_color: '#3b82f6',
    primary_color_dark: '#2563eb',
    secondary_color: '#10b981',
    accent_color: '#f59e0b',
  });

  // Fetch current theme colors from database
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/theme`);
        if (response.ok) {
          const data = await response.json();
          setColors(data);
          applyColors(data);
        }
      } catch (error) {
        console.error('Failed to fetch theme colors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, []);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    // Apply preview immediately
    applyColors(newColors);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save theme settings",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...colors,
          updated_by: user.id,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Theme colors updated successfully",
        });
      } else {
        throw new Error('Failed to update theme colors');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: "Failed to save theme colors",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const defaultColors: ThemeColors = {
      primary_color: '#3b82f6',
      primary_color_dark: '#2563eb',
      secondary_color: '#10b981',
      accent_color: '#f59e0b',
    };
    setColors(defaultColors);
    applyColors(defaultColors);
  };

  if (loading) {
    return (
      <Card className="w-full border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading theme settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Customizer
        </CardTitle>
        <CardDescription>
          Customize theme colors. Changes apply to all users immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={colors.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_color_dark">Primary Dark</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color_dark"
                  type="color"
                  value={colors.primary_color_dark}
                  onChange={(e) => handleColorChange('primary_color_dark', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.primary_color_dark}
                  onChange={(e) => handleColorChange('primary_color_dark', e.target.value)}
                  className="flex-1"
                  placeholder="#2563eb"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={colors.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="flex-1"
                  placeholder="#10b981"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={colors.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  className="flex-1"
                  placeholder="#f59e0b"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Color Preview:</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-primary border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="h-12 w-12 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: colors.primary_color_dark }}
                />
                <span className="text-xs text-muted-foreground">Primary Dark</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-secondary border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-accent border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
            </div>
          </div>

          {/* Sample Components */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Sample Components:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="default" size="sm">
                Primary
              </Button>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
              <Button variant="outline" size="sm">
                Outline
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Theme'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg border">
            <p className="font-semibold mb-2 text-foreground">ℹ️ Theme Customization</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Changes preview immediately in this dashboard</li>
              <li>Click "Save Theme" to apply changes for all users</li>
              <li>Colors are stored in the database and persist across sessions</li>
              <li>Users will see the new theme on next page load</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
