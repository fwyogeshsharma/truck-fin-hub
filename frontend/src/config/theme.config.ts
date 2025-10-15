/**
 * Theme Configuration File
 *
 * This file defines the color themes for the entire application.
 * Change the colors in the 'active' theme or switch between predefined themes
 * to instantly update the look of your entire site.
 *
 * All colors must be in HSL format (Hue Saturation Lightness)
 * Format: "hue saturation% lightness%" (without hsl() wrapper)
 * Example: "220 70% 50%" represents a blue color
 */

export interface ThemeColors {
  // Background and foreground
  background: string;
  foreground: string;

  // Card colors
  card: string;
  cardForeground: string;

  // Popover colors
  popover: string;
  popoverForeground: string;

  // Primary colors (main brand color)
  primary: string;
  primaryForeground: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors (complementary color)
  secondary: string;
  secondaryForeground: string;
  secondaryLight: string;

  // Accent colors (call-to-action)
  accent: string;
  accentForeground: string;
  accentLight: string;

  // Muted colors (subtle backgrounds)
  muted: string;
  mutedForeground: string;

  // Destructive colors (errors, warnings)
  destructive: string;
  destructiveForeground: string;

  // Border and input
  border: string;
  input: string;
  ring: string;

  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface Theme {
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
}

// Predefined theme presets
export const themes: Record<string, Theme> = {
  // Default blue theme (financial, trustworthy)
  default: {
    name: "Default Blue",
    light: {
      background: "210 20% 98%",
      foreground: "220 15% 15%",
      card: "0 0% 100%",
      cardForeground: "220 15% 15%",
      popover: "0 0% 100%",
      popoverForeground: "220 15% 15%",
      primary: "220 70% 50%",
      primaryForeground: "0 0% 100%",
      primaryLight: "220 70% 65%",
      primaryDark: "220 70% 35%",
      secondary: "160 60% 45%",
      secondaryForeground: "0 0% 100%",
      secondaryLight: "160 60% 60%",
      accent: "25 90% 55%",
      accentForeground: "0 0% 100%",
      accentLight: "25 90% 70%",
      muted: "210 20% 95%",
      mutedForeground: "220 10% 45%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "220 15% 88%",
      input: "220 15% 88%",
      ring: "220 70% 50%",
      sidebarBackground: "0 0% 98%",
      sidebarForeground: "220 15% 25%",
      sidebarPrimary: "220 70% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "210 20% 95%",
      sidebarAccentForeground: "220 15% 25%",
      sidebarBorder: "220 15% 88%",
      sidebarRing: "220 70% 50%",
    },
    dark: {
      background: "220 20% 10%",
      foreground: "210 20% 95%",
      card: "220 20% 12%",
      cardForeground: "210 20% 95%",
      popover: "220 20% 12%",
      popoverForeground: "210 20% 95%",
      primary: "220 70% 60%",
      primaryForeground: "220 20% 10%",
      primaryLight: "220 70% 70%",
      primaryDark: "220 70% 45%",
      secondary: "160 60% 50%",
      secondaryForeground: "220 20% 10%",
      secondaryLight: "160 60% 65%",
      accent: "25 90% 60%",
      accentForeground: "220 20% 10%",
      accentLight: "25 90% 75%",
      muted: "220 20% 18%",
      mutedForeground: "210 15% 60%",
      destructive: "0 70% 55%",
      destructiveForeground: "210 20% 95%",
      border: "220 20% 20%",
      input: "220 20% 20%",
      ring: "220 70% 60%",
      sidebarBackground: "220 20% 12%",
      sidebarForeground: "210 20% 90%",
      sidebarPrimary: "220 70% 60%",
      sidebarPrimaryForeground: "220 20% 10%",
      sidebarAccent: "220 20% 18%",
      sidebarAccentForeground: "210 20% 90%",
      sidebarBorder: "220 20% 20%",
      sidebarRing: "220 70% 60%",
    },
  },

  // Purple theme (creative, modern)
  purple: {
    name: "Purple",
    light: {
      background: "270 20% 98%",
      foreground: "280 15% 15%",
      card: "0 0% 100%",
      cardForeground: "280 15% 15%",
      popover: "0 0% 100%",
      popoverForeground: "280 15% 15%",
      primary: "270 70% 50%",
      primaryForeground: "0 0% 100%",
      primaryLight: "270 70% 65%",
      primaryDark: "270 70% 35%",
      secondary: "320 60% 50%",
      secondaryForeground: "0 0% 100%",
      secondaryLight: "320 60% 65%",
      accent: "45 90% 55%",
      accentForeground: "0 0% 100%",
      accentLight: "45 90% 70%",
      muted: "270 20% 95%",
      mutedForeground: "280 10% 45%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "280 15% 88%",
      input: "280 15% 88%",
      ring: "270 70% 50%",
      sidebarBackground: "0 0% 98%",
      sidebarForeground: "280 15% 25%",
      sidebarPrimary: "270 70% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "270 20% 95%",
      sidebarAccentForeground: "280 15% 25%",
      sidebarBorder: "280 15% 88%",
      sidebarRing: "270 70% 50%",
    },
    dark: {
      background: "280 20% 10%",
      foreground: "270 20% 95%",
      card: "280 20% 12%",
      cardForeground: "270 20% 95%",
      popover: "280 20% 12%",
      popoverForeground: "270 20% 95%",
      primary: "270 70% 60%",
      primaryForeground: "280 20% 10%",
      primaryLight: "270 70% 70%",
      primaryDark: "270 70% 45%",
      secondary: "320 60% 55%",
      secondaryForeground: "280 20% 10%",
      secondaryLight: "320 60% 70%",
      accent: "45 90% 60%",
      accentForeground: "280 20% 10%",
      accentLight: "45 90% 75%",
      muted: "280 20% 18%",
      mutedForeground: "270 15% 60%",
      destructive: "0 70% 55%",
      destructiveForeground: "270 20% 95%",
      border: "280 20% 20%",
      input: "280 20% 20%",
      ring: "270 70% 60%",
      sidebarBackground: "280 20% 12%",
      sidebarForeground: "270 20% 90%",
      sidebarPrimary: "270 70% 60%",
      sidebarPrimaryForeground: "280 20% 10%",
      sidebarAccent: "280 20% 18%",
      sidebarAccentForeground: "270 20% 90%",
      sidebarBorder: "280 20% 20%",
      sidebarRing: "270 70% 60%",
    },
  },

  // Green theme (eco-friendly, growth)
  green: {
    name: "Green",
    light: {
      background: "140 20% 98%",
      foreground: "150 15% 15%",
      card: "0 0% 100%",
      cardForeground: "150 15% 15%",
      popover: "0 0% 100%",
      popoverForeground: "150 15% 15%",
      primary: "150 65% 45%",
      primaryForeground: "0 0% 100%",
      primaryLight: "150 65% 60%",
      primaryDark: "150 65% 30%",
      secondary: "190 60% 50%",
      secondaryForeground: "0 0% 100%",
      secondaryLight: "190 60% 65%",
      accent: "35 90% 55%",
      accentForeground: "0 0% 100%",
      accentLight: "35 90% 70%",
      muted: "140 20% 95%",
      mutedForeground: "150 10% 45%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "150 15% 88%",
      input: "150 15% 88%",
      ring: "150 65% 45%",
      sidebarBackground: "0 0% 98%",
      sidebarForeground: "150 15% 25%",
      sidebarPrimary: "150 65% 45%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "140 20% 95%",
      sidebarAccentForeground: "150 15% 25%",
      sidebarBorder: "150 15% 88%",
      sidebarRing: "150 65% 45%",
    },
    dark: {
      background: "150 20% 10%",
      foreground: "140 20% 95%",
      card: "150 20% 12%",
      cardForeground: "140 20% 95%",
      popover: "150 20% 12%",
      popoverForeground: "140 20% 95%",
      primary: "150 65% 50%",
      primaryForeground: "150 20% 10%",
      primaryLight: "150 65% 65%",
      primaryDark: "150 65% 35%",
      secondary: "190 60% 55%",
      secondaryForeground: "150 20% 10%",
      secondaryLight: "190 60% 70%",
      accent: "35 90% 60%",
      accentForeground: "150 20% 10%",
      accentLight: "35 90% 75%",
      muted: "150 20% 18%",
      mutedForeground: "140 15% 60%",
      destructive: "0 70% 55%",
      destructiveForeground: "140 20% 95%",
      border: "150 20% 20%",
      input: "150 20% 20%",
      ring: "150 65% 50%",
      sidebarBackground: "150 20% 12%",
      sidebarForeground: "140 20% 90%",
      sidebarPrimary: "150 65% 50%",
      sidebarPrimaryForeground: "150 20% 10%",
      sidebarAccent: "150 20% 18%",
      sidebarAccentForeground: "140 20% 90%",
      sidebarBorder: "150 20% 20%",
      sidebarRing: "150 65% 50%",
    },
  },

  // Rose theme (elegant, warm)
  rose: {
    name: "Rose",
    light: {
      background: "340 20% 98%",
      foreground: "350 15% 15%",
      card: "0 0% 100%",
      cardForeground: "350 15% 15%",
      popover: "0 0% 100%",
      popoverForeground: "350 15% 15%",
      primary: "350 70% 55%",
      primaryForeground: "0 0% 100%",
      primaryLight: "350 70% 70%",
      primaryDark: "350 70% 40%",
      secondary: "280 60% 55%",
      secondaryForeground: "0 0% 100%",
      secondaryLight: "280 60% 70%",
      accent: "30 90% 55%",
      accentForeground: "0 0% 100%",
      accentLight: "30 90% 70%",
      muted: "340 20% 95%",
      mutedForeground: "350 10% 45%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "350 15% 88%",
      input: "350 15% 88%",
      ring: "350 70% 55%",
      sidebarBackground: "0 0% 98%",
      sidebarForeground: "350 15% 25%",
      sidebarPrimary: "350 70% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "340 20% 95%",
      sidebarAccentForeground: "350 15% 25%",
      sidebarBorder: "350 15% 88%",
      sidebarRing: "350 70% 55%",
    },
    dark: {
      background: "350 20% 10%",
      foreground: "340 20% 95%",
      card: "350 20% 12%",
      cardForeground: "340 20% 95%",
      popover: "350 20% 12%",
      popoverForeground: "340 20% 95%",
      primary: "350 70% 60%",
      primaryForeground: "350 20% 10%",
      primaryLight: "350 70% 75%",
      primaryDark: "350 70% 45%",
      secondary: "280 60% 60%",
      secondaryForeground: "350 20% 10%",
      secondaryLight: "280 60% 75%",
      accent: "30 90% 60%",
      accentForeground: "350 20% 10%",
      accentLight: "30 90% 75%",
      muted: "350 20% 18%",
      mutedForeground: "340 15% 60%",
      destructive: "0 70% 55%",
      destructiveForeground: "340 20% 95%",
      border: "350 20% 20%",
      input: "350 20% 20%",
      ring: "350 70% 60%",
      sidebarBackground: "350 20% 12%",
      sidebarForeground: "340 20% 90%",
      sidebarPrimary: "350 70% 60%",
      sidebarPrimaryForeground: "350 20% 10%",
      sidebarAccent: "350 20% 18%",
      sidebarAccentForeground: "340 20% 90%",
      sidebarBorder: "350 20% 20%",
      sidebarRing: "350 70% 60%",
    },
  },

  // Teal theme (professional, calm)
  teal: {
    name: "Teal",
    light: {
      background: "180 20% 98%",
      foreground: "190 15% 15%",
      card: "0 0% 100%",
      cardForeground: "190 15% 15%",
      popover: "0 0% 100%",
      popoverForeground: "190 15% 15%",
      primary: "180 65% 45%",
      primaryForeground: "0 0% 100%",
      primaryLight: "180 65% 60%",
      primaryDark: "180 65% 30%",
      secondary: "210 60% 50%",
      secondaryForeground: "0 0% 100%",
      secondaryLight: "210 60% 65%",
      accent: "30 90% 55%",
      accentForeground: "0 0% 100%",
      accentLight: "30 90% 70%",
      muted: "180 20% 95%",
      mutedForeground: "190 10% 45%",
      destructive: "0 84% 60%",
      destructiveForeground: "0 0% 100%",
      border: "190 15% 88%",
      input: "190 15% 88%",
      ring: "180 65% 45%",
      sidebarBackground: "0 0% 98%",
      sidebarForeground: "190 15% 25%",
      sidebarPrimary: "180 65% 45%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "180 20% 95%",
      sidebarAccentForeground: "190 15% 25%",
      sidebarBorder: "190 15% 88%",
      sidebarRing: "180 65% 45%",
    },
    dark: {
      background: "190 20% 10%",
      foreground: "180 20% 95%",
      card: "190 20% 12%",
      cardForeground: "180 20% 95%",
      popover: "190 20% 12%",
      popoverForeground: "180 20% 95%",
      primary: "180 65% 50%",
      primaryForeground: "190 20% 10%",
      primaryLight: "180 65% 65%",
      primaryDark: "180 65% 35%",
      secondary: "210 60% 55%",
      secondaryForeground: "190 20% 10%",
      secondaryLight: "210 60% 70%",
      accent: "30 90% 60%",
      accentForeground: "190 20% 10%",
      accentLight: "30 90% 75%",
      muted: "190 20% 18%",
      mutedForeground: "180 15% 60%",
      destructive: "0 70% 55%",
      destructiveForeground: "180 20% 95%",
      border: "190 20% 20%",
      input: "190 20% 20%",
      ring: "180 65% 50%",
      sidebarBackground: "190 20% 12%",
      sidebarForeground: "180 20% 90%",
      sidebarPrimary: "180 65% 50%",
      sidebarPrimaryForeground: "190 20% 10%",
      sidebarAccent: "190 20% 18%",
      sidebarAccentForeground: "180 20% 90%",
      sidebarBorder: "190 20% 20%",
      sidebarRing: "180 65% 50%",
    },
  },
};

/**
 * Active theme configuration
 * Change the value here to switch themes globally
 */
export const ACTIVE_THEME: keyof typeof themes = "default";

/**
 * Get the currently active theme
 */
export function getActiveTheme(): Theme {
  return themes[ACTIVE_THEME];
}
