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
        <div className="space-y-4 md:space-y-6">
          {/* Theme Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(themes).map(([key, theme]) => (
              <Button
                key={key}
                variant={selectedTheme === key ? "default" : "outline"}
                onClick={() => handleThemeChange(key)}
                className="h-auto py-3 sm:py-4 px-2 sm:px-4 flex flex-col items-center gap-1 sm:gap-2 relative"
              >
                {selectedTheme === key && (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 absolute top-1 sm:top-2 right-1 sm:right-2" />
                )}
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm font-medium">{theme.name}</span>
              </Button>
            ))}
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium">Color Preview:</p>
            <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary border-2 border-border shadow-sm" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-secondary border-2 border-border shadow-sm" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Secondary</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-accent border-2 border-border shadow-sm" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Accent</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted border-2 border-border shadow-sm" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Muted</span>
              </div>
            </div>
          </div>

          {/* Sample Components */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium">Sample Components:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="default" size="sm" className="text-xs sm:text-sm">
                Primary
              </Button>
              <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
                Secondary
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Outline
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-[10px] sm:text-xs text-muted-foreground p-3 sm:p-4 bg-muted/50 rounded-lg border">
            <p className="font-semibold mb-2 text-foreground">💡 To make this permanent:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li className="break-all">Open <code className="bg-background px-1 sm:px-1.5 py-0.5 rounded text-foreground font-mono text-[9px] sm:text-[10px]">src/config/theme.config.ts</code></li>
              <li className="break-all">Find line: <code className="bg-background px-1 sm:px-1.5 py-0.5 rounded text-foreground font-mono text-[9px] sm:text-[10px]">ACTIVE_THEME</code></li>
              <li className="break-all">Change to: <code className="bg-background px-1 sm:px-1.5 py-0.5 rounded text-primary font-mono text-[9px] sm:text-[10px]">"{selectedTheme}"</code></li>
              <li>Save and restart dev server</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
