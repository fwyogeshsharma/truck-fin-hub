/**
 * Theme Selector Component
 * Allows users to preview and switch between different theme presets
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { themes } from "@/config/theme.config";
import { applyThemeColors } from "@/lib/theme";
import { Palette, Check } from "lucide-react";

export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<string>("default");

  const handleThemeChange = (themeKey: string) => {
    setSelectedTheme(themeKey);
    const theme = themes[themeKey];
    const isDarkMode = document.documentElement.classList.contains("dark");

    if (isDarkMode) {
      applyThemeColors(theme.dark, true);
    } else {
      applyThemeColors(theme.light, false);
    }

    // Force a small DOM update to trigger chart re-renders
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Selector
        </CardTitle>
        <CardDescription>
          Click a theme to preview. Changes apply immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Theme Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(themes).map(([key, theme]) => (
              <Button
                key={key}
                variant={selectedTheme === key ? "default" : "outline"}
                onClick={() => handleThemeChange(key)}
                className="h-auto py-4 px-4 flex flex-col items-center gap-2 relative"
              >
                {selectedTheme === key && (
                  <Check className="h-4 w-4 absolute top-2 right-2" />
                )}
                <Palette className="h-5 w-5" />
                <span className="text-sm font-medium">{theme.name}</span>
              </Button>
            ))}
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Color Preview:</p>
            <div className="flex gap-2 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-primary border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-secondary border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-accent border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-lg bg-muted border-2 border-border shadow-sm" />
                <span className="text-xs text-muted-foreground">Muted</span>
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

          {/* Instructions */}
          <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg border">
            <p className="font-semibold mb-2 text-foreground">💡 To make this permanent:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <code className="bg-background px-1.5 py-0.5 rounded text-foreground font-mono">src/config/theme.config.ts</code></li>
              <li>Find line: <code className="bg-background px-1.5 py-0.5 rounded text-foreground font-mono">ACTIVE_THEME</code></li>
              <li>Change to: <code className="bg-background px-1.5 py-0.5 rounded text-primary font-mono">"{selectedTheme}"</code></li>
              <li>Save and restart dev server</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
