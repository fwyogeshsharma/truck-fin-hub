/**
 * Theme Loader Utility
 * Fetches theme colors from database and applies them dynamically
 */

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
function applyThemeColors(colors: ThemeColors) {
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

/**
 * Load theme colors from database and apply them
 */
export async function loadThemeFromDatabase() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/theme`);

    if (response.ok) {
      const colors: ThemeColors = await response.json();
      applyThemeColors(colors);
      console.log('Theme loaded successfully from database');
    } else {
      console.warn('Failed to fetch theme colors, using defaults');
    }
  } catch (error) {
    console.error('Error loading theme from database:', error);
    // Theme will fall back to CSS defaults
  }
}
