/**
 * Theme utility functions
 * Applies theme colors to CSS variables dynamically
 */

import { getActiveTheme, type ThemeColors } from "@/config/theme.config";

/**
 * Applies theme colors to CSS variables
 */
export function applyThemeColors(colors: ThemeColors, isDark: boolean = false) {
  const root = document.documentElement;
  const prefix = isDark ? "" : "";

  // Apply all color variables
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--card-foreground", colors.cardForeground);
  root.style.setProperty("--popover", colors.popover);
  root.style.setProperty("--popover-foreground", colors.popoverForeground);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.primaryForeground);
  root.style.setProperty("--primary-light", colors.primaryLight);
  root.style.setProperty("--primary-dark", colors.primaryDark);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
  root.style.setProperty("--secondary-light", colors.secondaryLight);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.accentForeground);
  root.style.setProperty("--accent-light", colors.accentLight);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--muted-foreground", colors.mutedForeground);
  root.style.setProperty("--destructive", colors.destructive);
  root.style.setProperty("--destructive-foreground", colors.destructiveForeground);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--input", colors.input);
  root.style.setProperty("--ring", colors.ring);
  root.style.setProperty("--sidebar-background", colors.sidebarBackground);
  root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
  root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", colors.sidebarBorder);
  root.style.setProperty("--sidebar-ring", colors.sidebarRing);

  // Update gradients based on primary and secondary colors
  updateGradients(colors);
}

/**
 * Updates gradient CSS variables based on theme colors
 */
function updateGradients(colors: ThemeColors) {
  const root = document.documentElement;

  // Extract hue from primary color for gradient variations
  const primaryHue = colors.primary.split(" ")[0];
  const secondaryHue = colors.secondary.split(" ")[0];

  // Create dynamic gradients
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${Number(primaryHue) - 20} 70% 55%) 100%)`
  );
  root.style.setProperty(
    "--gradient-secondary",
    `linear-gradient(135deg, hsl(${colors.secondary}) 0%, hsl(${Number(secondaryHue) + 20} 60% 50%) 100%)`
  );
  root.style.setProperty(
    "--gradient-hero",
    `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.secondary}) 100%)`
  );
  root.style.setProperty(
    "--gradient-card",
    `linear-gradient(to bottom, hsl(${colors.card}) 0%, hsl(${colors.background}) 100%)`
  );
}

/**
 * Initializes the theme based on the active configuration
 */
export function initializeTheme() {
  const theme = getActiveTheme();
  const isDarkMode = document.documentElement.classList.contains("dark");

  if (isDarkMode) {
    applyThemeColors(theme.dark, true);
  } else {
    applyThemeColors(theme.light, false);
  }
}

/**
 * Observes dark mode changes and updates theme accordingly
 */
export function observeDarkModeChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        initializeTheme();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return observer;
}
